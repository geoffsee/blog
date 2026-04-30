---
title: "Training a 1B Language Model From Scratch: A Systems Engineering Story"
date: 2026-04-30
author: "Geoff"
tags: ["AI", "Machine Learning", "Infrastructure", "LLMs", "Training"]
categories: ["Engineering", "AI"]
excerpt: "I trained a 1.05B parameter language model from scratch. The interesting part was not the Transformer. It was the data loader, the pod lifecycle, the PCIe scaling limits, and the small operational fixes that turned a fragile experiment into a reproducible pipeline."
published: true
featured_image: "/assets/images/2026-04-30-training-a-1b-language-model-from-scratch-a-systems-engineering-story.png"
---

The first inference check did not start with a breakthrough. It started with a model that had memorized a single Jane Austen-ish paragraph and learned to hallucinate in that accent forever.

Ask it anything and it answered like this:

> *"Jane's words had no such a war of independence of the Virgin..."*

That was useful precisely because it was obviously wrong in a way the loss curve had hidden. The training loss had fallen from 11 to 0.16 in 50 iterations. On paper, success. In reality, the model had spent the run chewing on the same tiny slice of text until it could imitate the local texture of one paragraph.

The lesson from `auto-g-nano-1b` was not "small LLMs are easy now." The lesson was more practical: training a model from scratch is a systems problem wearing a machine learning costume. The architecture matters, but the project lives or dies on data movement, orchestration, checkpoint safety, hardware topology, and whether your failure modes preserve the artifacts worth learning from.

This is the build log of the first version that made it to the Hub.

## Table of Contents

- [The Loader That Stopped Loading](#the-loader-that-stopped-loading)
- [Bash Got Me to the First Wall](#bash-got-me-to-the-first-wall)
- [Throughput Was a Topology Problem](#throughput-was-a-topology-problem)
- [Clean Web Text Was Not Enough](#clean-web-text-was-not-enough)
- [The Run That Died Because SSH Died](#the-run-that-died-because-ssh-died)
- [The Rerun Found the Bugs That Only Appear Mid-Flight](#the-rerun-found-the-bugs-that-only-appear-mid-flight)
- [What Finished](#what-finished)
- [What It Can Do](#what-it-can-do)
- [The Actual Takeaways](#the-actual-takeaways)
- [Glossary](#glossary)
- [References](#references)

## The Loader That Stopped Loading

The first bug was almost insultingly small.

In `dataset.py`, `_refill()` only pulled new documents from FineWeb-Edu when the token buffer dipped below `block_size + 1`. That sounds fine until you look at `get_batch()`: it sampled random windows, but never removed tokens from the buffer. After the first refill, the buffer landed around 1,026 tokens and stayed there.

So the model did exactly what I asked it to do: it trained. The problem was that it trained on the same tiny window over and over:

- 50 iterations
- 128 gradient accumulation steps
- the same roughly 1KB of text
- loss collapsing because the data distribution had collapsed

The fix was a `deque` and a `popleft()`. Drain the buffer as batches are consumed. Add `.shuffle(buffer_size=10_000)` to the Hugging Face stream. Three lines moved the run from fake progress to real learning. The next step-50 loss landed at 7.99, which is roughly what you expect from a from-scratch 1B model staring at real entropy for the first time.

That became the first rule of the project: never trust a loss curve until you have inspected the data path.

## Bash Got Me to the First Wall

The first orchestration layer was just a bash script: `scripts/train_e2e.sh`.

It used `runpodctl` to provision a Blackwell pod, wait for SSH, stream training logs, copy the checkpoint back, then destroy the pod. It got the loop moving. It also found the next class of bugs immediately.

`runpodctl pod get` exposes SSH endpoints under `.ssh.{ip,port}`, not under `.runtime.ports[]`, which is where I guessed they would be. Then RunPod's scheduler repeatedly marked pods as `RUNNING` even when no machine had actually been assigned. The tell was `runtime: null`: the pod existed in the control plane, but there was no useful runtime behind it.

That was the point where bash stopped being enough. The pipeline needed declared infrastructure, explicit state, and a launcher that could understand cloud weirdness without pretending every nonzero exit was the same failure.

Pulumi became the control plane. The RunPod provider could declare the pod resource, while a TypeScript orchestrator polled RunPod's GraphQL API for the operational details Pulumi did not expose directly. `bun run e2e` became the first real chain: `pulumi up`, launch training, collect artifacts, destroy infrastructure.

It worked. It was still too dangerous.

## Throughput Was a Topology Problem

Once the pipeline could run repeatedly, the next question was not philosophical. It was mechanical: which hardware shape gives the most useful tokens per second for this model?

The answer was not "the biggest GPU wins."

| Setup | Result | Notes |
|---|---:|---|
| 1x Blackwell WK, batch=1 grad=128 | 21k tok/s | legacy default |
| 1x Blackwell WK, batch=4 grad=32 | 30k tok/s | same tokens per step, fewer kernel launches |
| 1x Blackwell WK, batch=8 grad=16 | no gain | launch overhead was no longer the bottleneck |
| 2x Blackwell WK, PCIe | 41k tok/s | 68% scaling after disabling NCCL P2P |
| 4x Blackwell Server, PCIe | 49k tok/s | scaling collapsed under PCIe contention |
| 1x H200 | 40k tok/s | faster, but not proportionally |
| 2x H200, NVLink | 71k to 81k tok/s | NVLink changed the scaling curve |

The NCCL failure was the most concrete example. On 2x Blackwell Workstation cards over PCIe, the first allgather hung until I set `NCCL_P2P_DISABLE=1`, forcing shared-memory transport. That fixed the hang, but the penalty grew as rank count increased. Four PCIe-connected cards looked better on paper and worse in practice.

The best working shape for the full run became 2x Blackwell Workstation Edition with batch=8 and grad=16: about 54k tokens per second steady, simple enough to operate, and efficient enough to justify finishing the run.

The second rule followed naturally: benchmark the topology, not the GPU name.

## Clean Web Text Was Not Enough

The initial corpus was FineWeb-Edu only. That was useful for broad educational prose, but it created a blind spot you could see in one prompt:

```python
def fibonacci(n):
```

The model had no useful prior for that shape. Not "bad code." Not "wrong algorithm." Literal gibberish. A model cannot learn the shape of a function definition from a corpus that almost never contains code.

The loader changed to a three-way stream:

- **40%** `HuggingFaceTB/smollm-corpus` / `fineweb-edu-dedup`
- **25%** `HuggingFaceTB/smollm-corpus` / `cosmopedia-v2`
- **35%** `bigcode/starcoderdata` / `python`

That mix was intentionally aggressive. SmolLM-Corpus is built from educational and synthetic subsets, including FineWeb-Edu-Dedup and Cosmopedia v2. StarCoderData brings source code from the StarCoder training corpus, with gated access and provenance constraints inherited from The Stack.

The goal was not to build a coding model. The goal was to stop the base model from treating code, dialogue, and instruction-shaped text as alien formats. In a small training budget, distribution coverage matters more than purity.

The smoke run validated the direction quickly: same throughput, faster loss descent, and no sustained penalty from the three-stream interleave.

## The Run That Died Because SSH Died

The first full 50k run looked healthy for 7.5 hours.

It reached iteration 8,227 of 50,000. Then my Mac's SSH connection to the pod dropped with `Connection reset by peer`.

That should have been annoying. Instead, it was fatal.

The orchestrator was still holding the SSH session as the thread keeping training alive. When the connection died, the remote shell received SIGHUP and killed the training process with it. Then the local code made the worse decision: it interpreted the SSH disconnect as a training failure, assumed the checkpoint was missing, and let `pulumi destroy` tear down the pod.

Sixteen useful intermediate checkpoints disappeared with the machine.

The fix was not subtle. Stop attaching the training lifetime to the control connection.

The launcher now SSHes in once, starts the remote process under `nohup ... </dev/null &`, prints the exact SSH and `scp` commands needed for later inspection, and exits. Training lives on the pod, not inside my laptop's network session. Destroying the pod is a manual act, not a cleanup handler.

That became the third rule: automation is allowed to launch expensive work, but it is not allowed to destroy the only copy of the evidence just because the network blinked.

## The Rerun Found the Bugs That Only Appear Mid-Flight

The next run survived the SSH problem. Then the operational bugs started surfacing.

**`saveInterval` was read from the wrong place.** The training script looked at `process.env` instead of the Pulumi stack output, silently defaulted to `0`, and would have saved only at iteration 50,000. I caught it at iteration 3,000 because there were no `.pt` files on disk despite passing the expected checkpoint boundaries. Fixed, restarted, and checkpointing began every 500 iterations.

**`podName` included `Date.now().toString(36)`.** Every `pulumi up` produced a name diff, which meant Pulumi planned a destroy-and-create instead of a refresh. That is fine for disposable infrastructure and terrible for a running training pod. The name became deterministic and stack-derived.

**The pod volume did not grow.** At iteration 10.8k, 22 checkpoints at about 4GB each had filled most of the 100GB pod volume. Disk-full would have killed the run around iteration 13k. I pruned to the last three checkpoints plus `model_latest.pt`, freed the volume, and kept going. The obvious long-term fix is checkpoint rotation inside `train.hf.py`.

None of these bugs are interesting individually. Together, they are the difference between "I trained a model" and "I can reproduce the training run without babysitting a remote shell."

## What Finished

The completed run trained for 50,000 iterations:

```text
50,000 iterations x 262,144 tokens/step ~= 13.1B tokens
```

For a 1.05B parameter model, that is under Chinchilla-style compute-optimal token guidance, which is roughly 20 training tokens per parameter. That constraint matters when interpreting the outputs. This is a base model trained enough to become coherent, not enough to be mistaken for a polished assistant.

The useful outputs were practical:

- `model_latest.pt` uploaded to Hugging Face
- `model.safetensors`
- `model_bf16.pt`
- ONNX export in fp16 with opset 20
- a model card with architecture, corpus mix, benchmarks, sample generations, and limitations
- a Pulumi plus Bun launcher that no longer self-destructs on network failure

The ONNX export needed custom glue because the RoPE implementation used `torch.view_as_complex`, and the exporter path did not support that complex-valued operation. Rewriting it in real arithmetic got the export through. The fp16 ONNX output matched PyTorch closely enough for this stage: max absolute difference around 0.02, mean around 0.0025.

## What It Can Do

The same 12-prompt smoke test that originally produced Jane Austen soup started producing recognizable completions.

Story prompt:

> *"Once upon a time, in a small village near the mountains, lived two best friends named Timmy the Turtle and Sally the Squirrel. They loved exploring the forest together..."*

Code sample:

```python
def fibonacci(n):
    '''
    Return the number of times n can be Fibonacci numbers with a
    given number of factors.
    '''
    return int(n/2)
```

The Fibonacci function is semantically wrong. That is expected. The important change is that it is recognizably Python-shaped: a function, a docstring, indentation, and a return value. Stories follow the requested mode. At low temperature, greedy decoding still loops. At `T >= 0.7`, the generations are coherent enough to show the run learned a real distribution instead of one cursed paragraph.

My smoke score was 9 OK, 3 WEAK, 0 FAIL. For an undertrained 1B base model, that is not magic. It is a clean first checkpoint in a longer line of work.

## The Actual Takeaways

The model was the visible artifact. The pipeline was the real product.

A few rules came out of the run:

- **Inspect the data stream, not just the loss.** A collapsing loss can mean learning, or it can mean your input distribution collapsed first.
- **Detach training from your control session.** SSH is not a process supervisor.
- **Checkpoint policy is part of the training algorithm.** If checkpointing is wrong, the run is not real.
- **Deterministic infrastructure names matter.** Random names are a footgun when the resource is stateful.
- **Hardware topology beats spec-sheet reasoning.** PCIe, NVLink, NCCL transport, and rank count determine whether more GPUs help.
- **Small models need deliberate data diversity.** If the corpus excludes code, dialogue, and instruction-shaped text, the model will not infer those formats by vibes.
- **Never let cleanup automation delete evidence.** Failed runs still contain artifacts, logs, and checkpoints. Preserve first, destroy later.

The repo now has a working `infra/` orchestrator, a documented multi-source corpus loader, an ONNX exporter, a model card, and a 1.05B parameter base model that can write a passable Python-shaped function and tell a simple story.

That is the part I care about. Not because `auto-g-nano-1b` is finished, but because the next run starts from a system that understands failure better than the first one did.

## Glossary

Definitions here are scoped to how each term is used in this post.

### Allgather

A distributed training communication step where every process collects data from every other process. If this hangs, training can stall before useful work starts.

### Batch Size

The number of training samples processed before an optimizer update, or in this post, the per-step microbatch setting paired with gradient accumulation.

### BF16

Brain floating point 16-bit format. It keeps a large exponent range while using less memory than fp32, which makes it common for modern model training.

### Checkpoint

A saved copy of model weights and training state. Checkpoints are the recovery points that keep a long training run from becoming all-or-nothing.

### Chinchilla-Optimal

A rule of thumb from compute-optimal scaling work: for a fixed compute budget, model size and training tokens should be balanced. The common shorthand is roughly 20 training tokens per parameter.

### Data Loader

The code path that reads documents, tokenizes them, fills the training buffer, and returns batches. In this run, the loader was the first major failure point because it sampled from a buffer that never drained.

### FineWeb-Edu

A filtered educational web text corpus. It is useful for broad prose, but by itself it does not guarantee exposure to code, dialogue, or instruction-shaped examples.

### Gradient Accumulation

Running several forward/backward passes before applying one optimizer step. It simulates a larger batch without requiring the full batch to fit in GPU memory at once.

### Kernel Launch

The act of dispatching work from the host process to the GPU. Too many small launches can waste time on overhead instead of useful math, which is why changing batch and accumulation settings affected throughput.

### Loss Curve

The training metric showing how prediction error changes over time. It is useful, but only if the data stream is healthy; a falling loss can also mean the model is memorizing a broken input distribution.

### Model Card

A public description of a model's architecture, training data, intended use, limitations, and sample behavior. For a released model, it is part documentation and part warning label.

### NCCL

NVIDIA Collective Communications Library, used for communication between GPUs during distributed training.

### NVLink

NVIDIA's high-bandwidth GPU interconnect. It can change multi-GPU scaling substantially compared with PCIe-only communication.

### ONNX

Open Neural Network Exchange, a portable model format used to move models between runtimes and deployment targets.

### PCIe

The standard host interconnect used by many GPUs. It works, but it can become the bottleneck in distributed training when GPUs need to exchange data frequently.

### Pod

In this post, a rented RunPod machine running the training container, attached storage, and GPU allocation. Losing the pod meant losing any checkpoints that had not been copied elsewhere.

### Rank

One participating process in a distributed training job. A two-GPU run usually has two ranks; collective operations like allgather coordinate work across them.

### RoPE

Rotary positional embeddings, a method for injecting token position information into Transformer attention.

### Safetensors

A model weight file format designed for safe and efficient tensor storage. It avoids arbitrary code execution during load, which is why it is common for publishing model artifacts.

### SIGHUP

A Unix hangup signal commonly sent when a terminal or SSH session closes. If a training process is still attached to that session, it can die when the connection drops.

### Tokens Per Second

Throughput measurement for training or inference. In this post, it measures how many text tokens the training loop processed per second.

### Topology

The physical and logical layout of the training hardware: GPU count, interconnect, host path, and communication behavior. It often matters more than the GPU model name alone.

## References

- Pulumi Registry: [RunPod provider](https://www.pulumi.com/registry/packages/runpod/) and [`runpod.Pod` resource](https://www.pulumi.com/registry/packages/runpod/api-docs/pod/).
- Hugging Face: [`HuggingFaceTB/smollm-corpus`](https://huggingface.co/datasets/HuggingFaceTB/smollm-corpus) dataset card.
- Hugging Face: [`bigcode/starcoderdata`](https://huggingface.co/datasets/bigcode/starcoderdata) dataset card.
- Hoffmann et al.: ["Training Compute-Optimal Large Language Models"](https://arxiv.org/abs/2203.15556), commonly referred to as Chinchilla scaling.
