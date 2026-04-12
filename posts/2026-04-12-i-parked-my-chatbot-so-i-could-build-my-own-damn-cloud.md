---
title: "I Parked My Chatbot So I Could Build My Own Damn Cloud"
date: 2026-04-12
tags: ["Infrastructure", "Self-Hosting", "Portability", "Cloud", "AI"]
categories: ["Engineering", "Infrastructure"]
excerpt: "I took my 12-mode chatbot offline to build the infrastructure layer underneath it. The thesis: AI-era software needs to run anywhere — a colo rack, a VPS, a phone — and the cost of letting agents build on metered infrastructure doesn't scale."
published: true
featured_image: "/assets/images/2026-04-12-i-parked-my-chatbot-so-i-could-build-my-own-damn-cloud.png"
---

My site at geoff.seemueller.io had a chatbot with over 12 distinct modes — different personalities, tools, and interaction models, all under one roof. I took it offline. Not because it was broken, but because I realized I was building the applications before I'd solved the infrastructure problem underneath them.

Here's what I'm doing instead, and why.

## The Thesis

Two structural problems convinced me to stop shipping features and start building the platform layer.

**Portability as a distribution strategy.** Most software today is portable in name only. It runs in a container, but it assumes a specific orchestrator, a specific managed database, a specific object store. The deployment target is baked into the architecture at the earliest design decisions, and it constrains your market from day one.

I want to meet customers where they already are. That might be a rack in a data center, a $5/month VPS, or a phone on a cellular connection. If your stack can only run in one place, you've pre-filtered your addressable market down to the customers who happen to be in that place. True portability — software that genuinely doesn't care where it lands — is a distribution advantage.

**AI agents need a cost ceiling.** This is the one people underestimate. When you point an AI agent at a metered cloud platform and tell it to build something ambitious, you're handing it an open-ended line of credit. Every API call, every container, every storage write is billable, and the agent has no concept of budget. The rational move today is to limit what you let agents do, which limits what they can build.

On fixed-cost infrastructure, the calculus changes completely. The worst case is the machine runs hot. You can let an agent go deep on a complex problem — provisioning services, running experiments, iterating on architectures — without worrying about waking up to a bill that makes you shut the whole thing down. The cost ceiling is what enables the ambition ceiling.

## Why Portability Requires Building From Scratch

Most cloud-native tooling fails the portability test because it makes assumptions about what's underneath. A managed Kubernetes service, a specific object store API, a particular DNS provider. These are reasonable assumptions if you're deploying to one environment. They're fatal if you want to deploy to many.

Building a truly portable stack means designing with harder constraints:

- **Minimal assumptions about the host.** If there's compute and a network interface, that should be enough. No expectation of managed services underneath.
- **Small footprint.** Edge devices and phones have real resource limits. Every megabyte of runtime overhead narrows the set of targets you can reach.
- **Offline-capable by default.** Connectivity is a spectrum. The stack needs to degrade gracefully, not fail completely when a connection drops.

The building blocks are the same ones every cloud has — compute management, networking, storage, orchestration — but designed to scale down as comfortably as they scale up.

## From Monolith to Portfolio

The 12 modes in the original chatbot are becoming 12 independent applications. This is a business decision, not a refactoring exercise.

A single chatbot with 12 modes has one landing page, one value proposition, and one deployment model. Splitting them apart creates a portfolio with fundamentally different economics:

- **Twelve surfaces for discovery.** Each app gets its own positioning, its own SEO footprint, its own pitch tailored to a specific problem. One monolith has one shot at reaching a customer. Twelve products have twelve.
- **Granular pricing.** Each app can be priced according to its value to a specific customer segment — or offered free as a wedge into the paid products. Bundling is a choice, not a constraint.
- **Independent deployment and risk.** A bad deploy to one app doesn't take down the other eleven. Each product ships on its own timeline with its own blast radius.
- **Right-sized codebases.** Each app stays small enough that an AI agent can hold the full context in a single session. This isn't a nice-to-have — it's a multiplier on development velocity when agents are doing the building.
- **Parallel development at scale.** Twelve independent apps means twelve workstreams that can run simultaneously. Different agents, different contributors, different priorities — none of them blocking each other.
- **Portability per product.** Some of these apps belong on the web. Some belong on a phone. Some might make sense as a CLI. A monolith forces one form factor. A portfolio lets each product go wherever its users are.

The monolith was the right architecture for the exploration phase — figuring out which modes had legs. Now that I know, the right move is to let each one stand alone and find its own market.

## What Happens Next

The apps come back online one at a time, each running on the new infrastructure layer. Same capabilities, same personalities — deployed independently to whatever environment makes sense for the people using them.

The chatbot modes are the first tenants. Once the platform exists, every product I build after them inherits the same portability and the same cost structure for free. That's the compounding advantage of getting the infrastructure right first.

No timeline. Building infrastructure properly takes longer than building it fast, and I'd rather get the foundation right than race to redeploy what I already had. The leverage is in the platform, not the speed.