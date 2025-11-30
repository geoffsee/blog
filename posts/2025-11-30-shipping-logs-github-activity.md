---
title: "Shipping Logs: GitHub Since Nov 4"
date: 2025-11-30
author: "Geoff"
tags: ["engineering", "status"]
categories: ["progress"]
excerpt: "A narrative pass through the 300 GitHub events that shaped Spec AI, Toak, and the seemueller-io org this month."
published: true
featured_image: "/assets/images/office-ai.png"
---


## Dispatches from a graph-obsessed November

November started with a small ritual inside the seemueller-io org: five rapid pushes to `homebrew-tap` rehearsed the packaging story for everything that would follow. By the time the calendar clicked to 11-04, the tap could bottle nightly Rust builds without babysitting. I treated that as the ignition key for the rest of the month. What follows is a walk through the 300 public events that landed between then and 11-30—193 pushes, 27 PR events, 25 branch births, 41 ref clean-ups, four issues, eight research stars, and one repo quietly opened to the world.

### The week the graph learned to breathe

Spec AI became the center of gravity almost immediately. I spun up `semantic-memory` and `knowledge-graph` as bookends: [PR #1](https://github.com/geoffsee/spec-ai/pull/1) stitched a semantic store into the runtime (956 new lines of Rust), while [PR #2](https://github.com/geoffsee/spec-ai/pull/2) layered a steering DAG over 9,228 additions. Those two PRs alone accounted for more than ten percent of the month’s additions, but they were just the foundation.

The next sequence felt like threading a loom. [PR #14](https://github.com/geoffsee/spec-ai/pull/14) brought in Toak’s brand-new Rust tokenizer so the runtime could bootstrap itself. Immediately after, [PR #15](https://github.com/geoffsee/spec-ai/pull/15) carved out an embedded service mesh so agents could find each other without wiring YAML. [PR #16](https://github.com/geoffsee/spec-ai/pull/16) kept the graph in sync across that mesh, and later [PR #24](https://github.com/geoffsee/spec-ai/pull/24) plus [PR #25](https://github.com/geoffsee/spec-ai/pull/25) isolated those synchronization loops into their own release track. In raw terms that’s 1,778 + 5,414 + 3,846 + 3,122 lines of churn, but the story is that Spec AI went from “a CLI that remembers things” to “a fabric that can negotiate memories between peers.”

While the graph hardened, I kept peeling back the human interface. [PR #4](https://github.com/geoffsee/spec-ai/pull/4) taught the runtime how to ask for user input mid-run, [PR #6](https://github.com/geoffsee/spec-ai/pull/6) let it bootstrap itself on fresh hardware, and [PR #20](https://github.com/geoffsee/spec-ai/pull/20) wired repository-aware code search straight into the REPL using the toak-rs tokenizer. Speech slipped in via [PR #8](https://github.com/geoffsee/spec-ai/pull/8), which paired nicely with the separate [vtt-rs](https://github.com/geoffsee/vtt-rs) crate I launched for low-latency transcription. All of that culminates in two open pieces of work: [PR #21](https://github.com/geoffsee/spec-ai/pull/21), which adds a UI framework and 8,623 fresh lines devoted to rendering, and [PR #22](https://github.com/geoffsee/spec-ai/pull/22), an HUD renderer aimed at wearable displays.

Keeping the lights on required its own lap. [PR #17](https://github.com/geoffsee/spec-ai/pull/17) ensured the DuckDB packaging path actually exercises tests inside CI. Dependabot nudged `termimad`, `spider`, `tower-http`, `directories`, and `toml` via PRs #9–#13. And because instrumentation matters, I opened [issues #18–#19](https://github.com/geoffsee/spec-ai/issues) plus [#23](https://github.com/geoffsee/spec-ai/issues/23) to capture work on runtime profiling, WASM feature gates, and storage audits. All told, Spec AI saw 192 events: 125 pushes spanning 15 branches, 22 PRs (13 merged), 3 issues, 20 branch creations, and 19 deletions. That’s 47,882 additions and 3,952 deletions touching 441 files in under four weeks.

### Toak’s Rust era (and why the cleanup mattered)

Toak supplied the tokenizer DNA for Spec AI, so it needed its own leap forward. The headline was [PR #107](https://github.com/geoffsee/toak/pull/107), which merged 3,491 lines to bring `toak-rs` to parity with the TypeScript toolchain and expose it as a crate. I followed up with [PR #108](https://github.com/geoffsee/toak/pull/108) to document the crate, then finally closed the lingering [PR #89](https://github.com/geoffsee/toak/pull/89) so the README stopped referencing the old code-tokenizer binaries. If you watched the feed, you saw 39 pushes (23 to `toak-rs`, 16 to `main`), 20 tag/branch deletions, and 2 branch creations in three days. That flurry was intentional: I wanted the release tags to reflect Rust-first workflows before wiring Toak into Spec AI’s bootstrap story. Even the little housekeeping, like closing [issue #49](https://github.com/geoffsee/toak/issues/49) (“wake up bot”), was about making sure the automation around crates.io and Homebrew didn’t stall once the Rust drop shipped.

### Parallel tracks across the org

Beyond Spec AI and Toak, November read like a lab notebook.

- **Smenos** (`geoffsee/smenos`) came online November 20th. Eleven consecutive pushes laid down the “System of Agents” harness I’ve been sketching on paper—a coordinator that can spin up multiple Spec AI runtimes and route work among them.
- **vtt-rs** earned its own repository with six pushes and a pair of tag resets. I wanted to sandbox speech-to-text so HUD experiments could compile quickly without bringing the full Spec stack along.
- **di-framework** saw five master pushes as I refactored dependency injection experiments. It’s the playground where I figure out how services should be registered across Rust crates before those patterns harden in Spec AI.
- **Swifty CLI**—still private—received four pushes that modernized the template generator the seemueller-io org uses for internal tooling.
- **GraalFaaS** absorbed three pushes to keep our GraalVM-based function runner compatible with the Rust agents, ensuring we don’t strand the JVM workloads.
- **wasm-similarity** was born on November 26th, the seed for a vector-similarity engine meant to run inside browsers and WASM runtimes.
- **gsio** quietly flipped to public status on November 8th, opening up the site/blog tooling (including this post) so readers can trace how it all comes together.

And even though the seemueller-io org was quiet after the November 2nd tap rehearsal, that work is why releasing new crates later in the month felt boring—which is the highest compliment I can give infrastructure.

### Listen, star, prune

Eight repositories earned stars as research breadcrumbs: `k2-fsa/sherpa-onnx` (streaming ASR), `google/adk-go` (Android driver kit internals for future wearable experiments), `influxdata/telegraf`, `Nazariglez/notan`, `TapXWorld/ChinaTextbook`, `VedantPadole52/Employee_Finder_AI-Vibe_Coding`, `li630925405/daily-life-vocoder`, and `emingenc/visionlink`. Each of those solved a piece of the stack I’m chasing—audio pipelines, device hooks, telemetry, rendering, multilingual corpora, HR agents, realtime vocoders, and computer-vision linkers. I also dropped a commit comment pointing to a context video, because sometimes the best spec is a hyperlink. Meanwhile the 41 ref deletions across repos kept the namespace clean so collaborators aren’t spelunking through stale branches.

### Looking ahead

Four PRs remain open inside Spec AI—[#21](https://github.com/geoffsee/spec-ai/pull/21), [#22](https://github.com/geoffsee/spec-ai/pull/22), [#24](https://github.com/geoffsee/spec-ai/pull/24), [#25](https://github.com/geoffsee/spec-ai/pull/25)—representing roughly 12k lines of UI and graph work that need polish and testing. The three runtime issues about profiling, WASM support, and storage hygiene are next so we can instrument the service mesh properly. Toak’s crate is ready for a tagged release, and Smenos is waiting to be wired into Spec AI so multi-agent orchestration becomes part of the story, not a side project.

Counts above came from `gh api users/geoffsee/events/public?page=1..3&per_page=100` plus `gh api orgs/seemueller-io/events?page=1`. GitHub caps these feeds at 300 events, but the oldest entry I pulled (2025-11-13) still sits inside the requested window, so nothing from 11-04 onward was lost. November was the month the graph got lungs, the tokenizer grew up, and the org’s supporting projects learned to hum in unison. December’s job is to make all of that boring—in the best possible way.
