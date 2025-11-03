---
title: "Simple Wins Matter"
date: 2025-11-03
author: "Geoff"
tags: ["business"]
categories: ["systems"]
excerpt: "Trust your real-time systems. Verify your caches. Question your heuristics."
published: true
featured_image: "/assets/images/post-hype-tech.png"
---


## Summary

In software, optimization often gets tied up with grand rewrites and complex refactoring. But sometimes the highest ROI comes from questioning basic assumptions: Why are we hitting this API twice? Why poll when we already have real-time updates? Why trust heuristics over explicit signals?

We spent one hour auditing Ramble's infrastructure costs and found three quick wins that reduce monthly spend by 20-30% with minimal code changes. The question wasn't "how do we optimize everything?" but rather "where are we being wastefully defensive?"

Note: This is about cloud infrastructure costs (API calls, bandwidth, compute) running on Cloudflare Workers, not a holistic performance review.

---

## The Core Challenge

Cloud costs scale silently. You add a feature with "just one more API call" or implement polling as a safety net, and individually these seem fine. Six months later, you're burning budget on redundant operations you forgot existed.

The challenge isn't identifying *what* to optimize—profilers and logs will tell you that. It's recognizing *when* defensive patterns have become wasteful and knowing which ones are safe to dial back.

---

## What We Found: Three Misaligned Patterns

### Pattern 1: Cache Expiration Timing

**The Setup:**
- GDELT news articles fetched every 15 minutes
- Cache TTL set to 10 minutes
- Result: Every fetch was a cache miss

**The Reality:**
Cache was expiring 5 minutes before the next fetch cycle. We were paying for API calls that should have been free hits.

**The Fix:**
Increased cache TTL from 10 to 20 minutes. One line change.

**Savings:**
~25% reduction in GDELT API calls.

**Trust Domain:**
This is pure math. If your interval is X, your cache should be ≥ X. No tradeoffs, just misalignment.

---

### Pattern 2: Defensive Polling Over Real-Time Updates

**The Setup:**
- WebSocket connection for real-time feed updates
- Background polling every 60 seconds "just in case"
- Result: Polling even when WebSocket was successfully delivering updates

**The Reality:**
We built real-time infrastructure but didn't trust it. The polling was originally added as a fallback before WebSockets were reliable, but we never removed it once they were.

**The Fix:**
Only poll when `isWebSocketConnected === false`. Added conditional logic to disable polling when real-time updates are active.

**Savings:**
80% reduction in HTTP polling requests during normal operation.

**Trust Domain:**
This one requires confidence in your WebSocket implementation. We verified reconnection logic and fallback behavior before making the change. The key insight: defensive redundancy has a cost—make it conditional.

---

### Pattern 3: Database Indexes (Already Solved)

**The Setup:**
Search queries filtering by channel and sorting by timestamp.

**The Reality:**
Indexes already existed. No work needed, just verification.

**Impact:**
Confirmed queries stay efficient as data scales.

**Trust Domain:**
This is foundational. Never assume indexes exist—always verify before declaring victory.

---

## Bonus: The Language Detection Bug

While auditing translation costs, we found German article titles weren't being translated. The code was using ASCII ratio as a heuristic to detect English text, but German (and French, Spanish, Italian) are mostly ASCII characters.

**The Problem:**
```typescript
// Old logic:
const asciiRatio = title.split("").filter(char => char.charCodeAt(0) <= 127).length / title.length;
return asciiRatio > 0.9; // Incorrectly skips German text
```

**The Fix:**
Trust the language code from GDELT API *first*, fallback to ASCII ratio only when no code exists.

```typescript
// New logic:
if (languageCode && languageCode !== "en") {
  return false; // Not English, translate it
}
// Only use ASCII heuristic when no language code available
```

**Impact:**
Translation now works for all European languages. This should have been caught earlier—it's a reminder that heuristics are useful fallbacks, not primary signals.

---

## Building Your Own Optimization Model

Instead of asking "what can we optimize?", ask domain-specific questions:

**For API Caching:**
- What's my fetch interval?
- Is cache TTL ≥ interval?
- Am I measuring hit/miss rates?

**For Real-Time vs. Polling:**
- Do I have reliable real-time infrastructure?
- Is polling truly a necessary fallback?
- Can I make redundancy conditional?

**For Database Performance:**
- Which queries run most frequently?
- Are indexes present for filter/sort columns?
- Am I monitoring query execution time?

**For AI/Translation APIs:**
- Am I using explicit signals (language codes) when available?
- Are my heuristics tested across all input types?
- What's the cost per call vs. value delivered?

---

## The Philosophy: Question Defensive Defaults

Defensive programming teaches us to handle edge cases and build fallbacks. That's good engineering. But defensive patterns ossify—they stick around long after the uncertainty that justified them is resolved.

The real optimization opportunity isn't rewriting hot paths. It's identifying places where you're being *wastefully defensive*: caching for less time than you need, polling when real-time works, using heuristics when explicit data exists.

---

## My Honest Assessment

**What worked:**
- Cache timing fix: zero-risk, pure efficiency gain
- Conditional polling: safe because we verified WebSocket reliability first
- Translation fix: simple logic error with clear solution

**What required caution:**
- Disabling polling required confidence in WebSocket reconnection logic
- We tested failure scenarios before shipping the change

**What we deferred:**
- N+1 query patterns (requires more invasive refactoring)
- Translation result caching (needs storage strategy)
- Image optimization (bigger infrastructure project)

The wins here came from alignment fixes and questioning defaults, not from algorithmic improvements. That's often where the best ROI lives.

---

## The Real Question

The question isn't "what's the most optimized architecture?" It's "where are we paying for safety we no longer need?"

Optimization isn't always about making things faster. Sometimes it's about recognizing when your training wheels are creating drag.

---

**Total impact:** ~$240-720/year saved, 15 lines changed, 1 hour invested.
