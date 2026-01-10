---
title: "Creating Synchronized Multi-Repository Gource Visualizations"
date: 2026-01-10
author: "Geoff"
tags: ["Gource", "Git", "FFmpeg", "Visualization", "Video Production"]
categories: ["Tutorial", "DevOps", "Tools"]
excerpt: "A step-by-step guide to creating a split-screen video showing the development history of multiple git repositories with aligned timelines."
published: true
featured_image: "/assets/images/gourced.png"
---

## Summary

A step-by-step guide to creating a split-screen video showing the development history of multiple git repositories with aligned timelines.

---

## What is Gource?

Gource is a software version control visualization tool that creates animated visualizations of git repository history. It shows files and directories as nodes in a tree, with contributors appearing as avatars who interact with the files they modify.

---

## Prerequisites

- **Gource**: `brew install gource` (macOS) or `apt install gource` (Linux)
- **FFmpeg**: `brew install ffmpeg` or `apt install ffmpeg`
- Multiple git repositories you want to visualize

---

## Step 1: Generate Individual Gource Videos

First, create a Gource video for each repository. The key parameters:

```bash
gource /path/to/repo \
  --title "Repository Name" \
  --seconds-per-day 0.3 \
  --auto-skip-seconds 0.5 \
  --key \
  --highlight-users \
  --hide mouse,progress \
  --file-idle-time 0 \
  -1920x1080 \
  --output-ppm-stream - \
  --output-framerate 60 | \
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset fast -pix_fmt yuv420p -crf 18 \
  /tmp/repo-name-raw.mp4
```

### Parameter explanation:

- `--seconds-per-day 0.3`: How fast time passes (lower = faster)
- `--auto-skip-seconds 0.5`: Skip periods of inactivity
- `--key`: Show file type legend
- `--highlight-users`: Make contributors stand out
- `--output-ppm-stream -`: Pipe raw frames to FFmpeg
- `-crf 18`: Quality setting (lower = better quality, larger file)

Repeat this for each repository, saving to `/tmp/`.

---

## Step 2: Find Each Repository's First Commit Date

To synchronize timelines, you need to know when each repository started:

```bash
git -C /path/to/repo log --reverse --format="%ci" | head -1
```

Example output for multiple repos:

| Repository          | First Commit |
|---------------------|--------------|
| geoff-seemueller-io | Aug 27, 2024 |
| ai-seemueller-io    | Jan 17, 2025 |
| open-gsio           | May 22, 2025 |
| predict-otron-9000  | Aug 16, 2025 |
| ramble              | Oct 9, 2025  |
| gsio                | Oct 22, 2025 |
| spec-ai             | Nov 12, 2025 |

---

## Step 3: Calculate Time Delays

Find the earliest repository (your "anchor") and calculate how many days after it each other repo started:

```bash
# Calculate days between two dates
start_date="2024-08-27"  # Earliest repo
repo_date="2025-01-17"   # Another repo's first commit

days=$(( ($(date -j -f "%Y-%m-%d" "$repo_date" +%s) - $(date -j -f "%Y-%m-%d" "$start_date" +%s)) / 86400 ))
```

Then multiply by your `--seconds-per-day` value:

```
delay_seconds = days_difference * seconds_per_day
```

For example, at 0.3 seconds per day:

- **geoff-seemueller-io**: 0 days → 0.0s delay
- **ai-seemueller-io**: 143 days → 42.9s delay
- **spec-ai**: 442 days → 132.6s delay

---

## Step 4: Add Time Padding to Each Video

Use FFmpeg's `tpad` filter to add padding at the start of each video. This makes later-starting repos appear blank until their actual start date:

```bash
ffmpeg -y -i /tmp/repo-raw.mp4 \
  -vf "tpad=start_mode=clone:start_duration=42.9:stop_mode=clone:stop_duration=20" \
  -c:v libx264 -preset fast -crf 18 \
  /tmp/repo-padded.mp4
```

### tpad parameters:

- `start_mode=clone`: Show first frame during the delay (not black)
- `start_duration=42.9`: Seconds to pad at the beginning
- `stop_mode=clone`: Extend end with last frame
- `stop_duration=20`: Extra seconds at end so all videos end together

The anchor repository (earliest one) needs no start padding.

---

## Step 5: Combine into Split-Screen

Use FFmpeg's `filter_complex` to arrange videos in a grid:

```bash
ffmpeg -y \
  -i /tmp/spec-ai-padded.mp4 \
  -i /tmp/geoff-padded.mp4 \
  -i /tmp/ai-padded.mp4 \
  -i /tmp/ramble-padded.mp4 \
  -i /tmp/predict-padded.mp4 \
  -i /tmp/open-gsio-padded.mp4 \
  -i /tmp/gsio-padded.mp4 \
  -filter_complex "
    [0:v]scale=480:540[v0];
    [1:v]scale=480:540[v1];
    [2:v]scale=480:540[v2];
    [3:v]scale=480:540[v3];
    [4:v]scale=640:540[v4];
    [5:v]scale=640:540[v5];
    [6:v]scale=640:540[v6];
    [v0][v1][v2][v3]hstack=inputs=4[top];
    [v4][v5][v6]hstack=inputs=3[bottom];
    [top][bottom]vstack=inputs=2[out]
  " \
  -map "[out]" \
  -shortest \
  -c:v libx264 -preset medium -crf 18 \
  output-splitscreen.mp4
```

This creates a layout like:

```
┌────────┬────────┬────────┬────────┐
│ video0 │ video1 │ video2 │ video3 │
├────────┴───┬────┴────┬───┴────────┤
│   video4   │ video5  │   video6   │
└────────────┴─────────┴────────────┘
```

### Key filter_complex concepts:

- `scale=WxH`: Resize each video to fit the grid
- `hstack=inputs=N`: Stack N videos horizontally
- `vstack=inputs=N`: Stack N videos vertically
- `-shortest`: End when the shortest input ends

---

## Common Pitfalls

### Gource's date parameters don't sync timelines

You might think `--start-date` and `--stop-date` would help, but they only filter which commits to show—they don't pad the timeline. A repo that started in 2025 will still begin playing immediately, not wait until the 2024 repos catch up.

**Solution**: Use FFmpeg's `tpad` filter as described above.

### Videos have different lengths

When repos have different activity spans, the split-screen will have videos ending at different times.

**Solution**: Use `stop_mode=clone:stop_duration=X` in `tpad` to extend shorter videos, and `-shortest` flag to end when appropriate.

---

## The Result

You'll have a synchronized split-screen video where all repositories show the same calendar date at any point in time. Repos that didn't exist yet will show their initial state, and you can watch how development across all projects evolved together chronologically.

---

This technique is perfect for showcasing a portfolio of related projects, demonstrating how a suite of tools evolved together, or creating a visual timeline of your development journey.
