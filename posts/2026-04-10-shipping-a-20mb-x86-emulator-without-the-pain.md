---
title: "Shipping a 20MB x86 Emulator Without the Pain"
date: 2026-04-10
tags: ["WebAssembly", "Optimization", "Performance", "Linux", "React"]
categories: ["Engineering", "Web Development"]
excerpt: "A personal site that boots a real Linux kernel in the browser sounds cool until you realize you're asking visitors to download 20MB before they see anything. Here's how I cut that to ~4MB and added a loading experience that doesn't make people bounce."
published: true
featured_image: "/assets/images/2026-04-10-shipping-a-20mb-x86-emulator-without-the-pain.png"
---

A personal site that boots a real Linux kernel in the browser sounds cool until you realize you're asking visitors to download 20MB before they see anything. Here's how I cut that to ~4MB and added a loading experience that doesn't make people bounce.

## The Starting Point

My initial setup looked like this:
- **v86 emulator** running Buildroot Linux in the browser (React + Vite + Cloudflare Workers)
- A custom Rust REPL binary (`hello-shell`) baked into a Linux ISO, served as a static asset
- **Total payload before anything renders:** ~20MB (18MB ISO + 2MB WASM) plus BIOS files
- **No loading indicator** — the user just stared at a black screen for seconds

## Problem Breakdown

1. **No feedback during boot** — black screen while WASM and the ISO download, and the VM initializes.
2. **The ISO is massive** — 18MB of raw ISO9660, mostly compressible filesystem padding.
3. **The WASM could be smaller** — v86's WASM ships unoptimized from npm.
4. **The raw ISO still gets deployed** even after adding compression.

## What I Did

### 1. Loading Indicator

The app already tracked `status` and `activity` state through v86's lifecycle events (`download-progress`, `emulator-loaded`, `emulator-ready`, `emulator-started`) — it just never rendered them.

I added a full-screen overlay with a pure CSS spinner and status/activity text, positioned over the emulator surface. The overlay disappears when `isRunning` flips to true (meaning the VM has started executing). It also shows an error state in red if the boot fails. All of this required no extra dependencies.

### 2. Compressing the ISO with Zstd

Running `zstd -19` on `linux.iso` took it from **18MB to 2.4MB** (an 87% reduction, down to 12% of the original size). Level 19 is slow to compress but fast to decompress, which is perfect for a build artifact served to many clients.

For client-side decompression, I used `fzstd` (a lightweight pure-JS zstd decoder, ~8KB). I fetch the `.zst`, decompress it in JS, and pass the raw `ArrayBuffer` to v86 instead of a URL.

**The gotcha:** `fzstd`'s `decompress()` returns a `Uint8Array` that may be a view into a larger backing `ArrayBuffer`. Passing `.buffer` directly gives v86 garbage data past the real ISO, resulting in `"Boot failed: Could not read from CDROM (code 0005)"`. 
**Fix:** Use `.slice().buffer` to get a correctly-sized copy.

### 3. wasm-opt on v86.wasm

I ran `wasm-opt -Oz` (optimize for size) on the WASM file, bringing it from **2.0MB to 1.5MB** (a 25% reduction). I installed `binaryen` as an npm dev dependency so `wasm-opt` is available in CI without system-level setup, and added it as a post-build step that finds and optimizes all `.wasm` files in the dist output.

### 4. Stripping the Raw ISO from Deploy

Vite copies everything from `public/` to `dist/`, including the original uncompressed ISO. Since Cloudflare Workers deploys all static assets, the 18MB ISO was being uploaded alongside the 2.4MB `.zst`.

**Fix:** I chained `rm -f` after the Vite build in the `build:web` script to delete the raw ISO from `dist/` before deploy. The raw ISO stays in `public/` for local dev (v86 can still boot from it if the compressed path isn't configured).

## Build Pipeline (Final)

```bash
build:rust     → cross-compile hello-shell (i686 musl, Docker)
build:iso      → inject binary into Buildroot ISO (Docker + xorriso)
build:compress → zstd -19 the ISO
build:web      → vite build + rm raw ISO from dist
build:wasm-opt → wasm-opt -Oz on all .wasm in dist
```

## Results

| Asset         | Before  | After  | Reduction |
|---------------|---------|--------|-----------|
| linux.iso     | 18 MB   | 2.4 MB | 87%       |
| v86.wasm      | 2.0 MB  | 1.5 MB | 25%       |
| **Total**     | ~20 MB  | ~4 MB  | ~80%      |

Plus, users now see a spinner with status text instead of a black void.

## Lessons / Things Worth Noting

- **Zstd >> gzip for this use case.** HTTP gzip/brotli helps on text, but ISO images have large runs of zero padding that zstd handles aggressively at high levels. The 87% reduction is on top of whatever the CDN does with transfer encoding.
- **Don't trust `.buffer` on typed arrays.** Any library that returns a `Uint8Array` might hand you a view into a shared/oversized ArrayBuffer. Always `.slice()` if you need the exact bytes.
- **wasm-opt is free performance.** Most npm WASM packages ship unoptimized. A one-line build step shaves 25%.
- **Audit what you deploy.** Vite's `public/` copy is convenient but dumb — it copies everything. If you have a build artifact that replaces a source file, you need to clean up the original.
- **State you already have is state you can show.** The loading indicator was basically free — the download/boot lifecycle events were already wired up and updating React state. They just weren't rendered.

## Possible Follow-Ups

- Streaming decompression (decompress as chunks arrive instead of buffering the full .zst)
- Service worker integration for the .zst (cache the decompressed ISO so repeat visits skip decompression)
- Lazy-loading the v86 WASM with a lighter initial bundle
- Preloading the .zst with `<link rel="preload">` while React hydrates
