---
title: "Generics, Stubs, and the Points Machine"
date: 2025-12-31
author: "Geoff"
tags: ["generics", "types", "testing", "abstractions", "learning", "rust", "typescript"]
categories: ["Software Development"]
excerpt: "A metaphor that made generics click: constraints are rules, compilers and tests are reward functions, and stubs are engineered shortcuts to the same rewards."
published: true
featured_image: "/assets/images/generated-image-1767222160554.png"
---

# Generics, Stubs, and the Points Machine

Imagine a machine that gives you points.

It has one rule:

> Give me something that makes a sound when I shake it.

No explanation. No taxonomy. Just feedback.

## Summary
Most explanations of generics are “correct” and still fail to teach: type parameters, polymorphism, constraints, bounds. What finally clicked for me was thinking of generics as a rule-bound system that only rewards behavior, not identity.

Once you see the reward, stubs stop feeling like a testing trick and start feeling inevitable.

## The Points Machine
You try a bell: points.
You try a box of rocks: points.
You try a stuffed animal: no points. It’s soft, cuddly, arguably more valuable—but silent.
You try a sealed cup of rice: points.

At first you’re “learning objects”. But pretty quickly you aren’t learning objects at all. You’re learning the boundary between reward and no reward.

## Where the abstraction forms
The moment the abstraction locks in is the moment you realize:

> It doesn’t matter what the thing is. It matters what it does.

That’s the heart of a generic constraint. The machine isn’t interested in identity, provenance, or the “realness” of the thing you hand it. It only cares whether the behavior matches the rule.

Depending on the language, you’ll hear this described as “behavior over identity”, “duck typing”, or “structural typing”. The labels differ; the move is the same.

## Mapping the metaphor to actual code
In Rust, the “rule card” is a trait bound:

```rust
trait Rattles {
    fn shake(&self) -> bool;
}

fn points<T: Rattles>(thing: &T) -> u32 {
    if thing.shake() { 3 } else { 0 }
}
```

In TypeScript, it’s an interface (or structural type) constraint:

```ts
type Rattles = { shake: () => boolean };

export function points<T extends Rattles>(thing: T): number {
  return thing.shake() ? 3 : 0;
}
```

Different languages, same shape:
- The generic says: “I don’t care what you are.”
- The constraint says: “I do care what you can do.”
- The reward says: “Prove it.”

## Why stubs show up naturally
Now the interesting part: you run out of noisy objects.

So you make one.

You take an empty box and tape beads inside. It “rattles” on demand. The machine hands you the points. You feel clever.

That’s a stub.

In Rust, it’s literally an implementation engineered to satisfy the bound:

```rust
struct BoxOfBeads;

impl Rattles for BoxOfBeads {
    fn shake(&self) -> bool { true }
}
```

In TypeScript, it’s the same move:

```ts
const boxOfBeads = { shake: () => true };
```

The key is that nothing about the system can distinguish “real” from “fake” beyond behavior. If the only thing you measure is behavior, behavior is all that’s real.

> Generics work because they reward correct behavior no matter what produces it. Stubs work because they’re built to earn the same reward.

## The uncomfortable implication (and why it matters)
If you’ve ever looked at a test suite and felt that vague anxiety — “this passes, but I don’t trust it” — this is why.

A test suite is a reward function.
An API boundary is a reward function.
A compiler is a reward function.

If the reward is too easy, you’ll build impressive boxes of beads that don’t survive contact with reality.

If the reward is too noisy, nobody learns the abstraction; they just memorize edge cases and cargo-cult the incantations that make CI go green.

### A tiny “bad reward” example
Here’s how this shows up in tests.

If the only thing your test rewards is “returns something shaped like a user”, you can pass it with a stub that ignores reality:

```ts
type Row = { id: number };
type Db = { query: (sql: string, params: unknown[]) => Promise<Row[]> };

async function loadUser(db: Db, id: number) {
  const rows = await db.query("select id from users where id = ?", [id]);
  return rows[0];
}

test("loads a user", async () => {
  const fakeDb: Db = { query: async () => [{ id: 1 }] };
  const user = await loadUser(fakeDb, 1);
  expect(user.id).toBe(1);
});
```

If your production code needs to handle timeouts, empty results, or parameter correctness, this reward function teaches none of that. It teaches “be the beads in a box.”

If you speak reinforcement learning: this is reward hacking. The system learned how to get points, not how to solve the real task.

### A slightly better reward
You don’t need a real database to reward more meaningful behavior. You can reward the interaction:

```ts
test("queries by id", async () => {
  const fakeDb: Db = {
    query: async (sql, params) => {
      expect(sql.toLowerCase()).toContain("where id = ?");
      expect(params).toEqual([1]);
      return [{ id: 1 }];
    },
  };

  const user = await loadUser(fakeDb, 1);
  expect(user.id).toBe(1);
});
```

## The real question
When I’m designing an interface, writing tests, or choosing a generic bound, I’m trying to ask a better version of the same question:

> What behavior am I rewarding?

Because whatever it is, that’s what the system will optimize for — whether it’s a person, a team, or a machine. It’s worth asking before you ship, because someone will absolutely optimize it.
