# AI build prompt

Copy/paste one of these to an AI (Claude, etc.) when you want it to build,
extend, or change this feed-ranking system. They're written so the AI produces
code that fits the existing architecture instead of reinventing it.

---

## Prompt A — build the whole thing from scratch

```
Build a Facebook-style feed ranking system in Node.js with this architecture:

- config/ranking-weights.js: ALL tunable numbers (signal weights, decay
  params, action values). No logic here — just exported constants.
- src/models/types.js: JSDoc typedefs for Post, User, Interaction, ScoredPost.
- src/signals/: one file per signal, each a PURE function returning 0..1:
    recency (exponential half-life decay on post age),
    affinity (viewer's past weighted interactions with the author, saturating),
    engagement (weighted likes/comments/shares per impression, log-dampened),
    interest (Jaccard overlap of viewer interests vs post tags, with a floor).
- src/ranker.js: scorePost(viewer, post, ctx) — blends signals by
  weight/totalWeight, applies a seen-penalty, returns { post, score, breakdown }.
- src/feed.js: buildFeed({ viewer, dataSource, limit, now }) running the 4
  stages: inventory → filter → rank → serve. All DB access goes through a
  `dataSource` object so the ranking logic is storage-agnostic.
- example.js: runnable demo with in-memory fake data.

Rules: signals return 0..1 and are pure (no DB calls inside them); fetch shared
data ONCE per request in feed.js and pass it via ctx; keep ranker.js tiny; keep
a per-signal `breakdown` on every scored post for debugging. Make it run with
`node example.js`.
```

---

## Prompt B — add a new signal

```
Add a new ranking signal called "<NAME>" to this feed-ranking system. Follow
the existing pattern exactly:

1. Create src/signals/<name>.js as a PURE function returning 0..1. It should
   <describe what it measures, e.g. "boost posts whose location is near the
   viewer's city">.
2. Add a "<name>" weight to WEIGHTS in config/ranking-weights.js.
3. Wire it into the signals array in src/ranker.js with one new line.

If the signal needs data we don't already fetch, add a method to the dataSource
interface, fetch it once in feed.js into ctx, and read it from ctx inside the
signal. Don't put logic in ranker.js and don't make the signal hit a database
directly. Show me only the changed/new files.
```

---

## Prompt C — change feed behaviour without new code

```
I want the feed to <describe the goal, e.g. "show fresher content and weight
comments more heavily than likes">. Tell me exactly which numbers to change in
config/ranking-weights.js and what each change does. Don't change any code in
/src.
```

---

## Prompt D — add a non-signal feature (diversity, caching, A/B)

```
Add <feature> to this feed-ranking system. Keep the existing architecture:
signals stay pure and 0..1, the ranker stays tiny, data access stays behind
dataSource. For:
- diversity: add a post-rank reordering step in feed.js AFTER the sort.
- caching: wrap buildFeed's result per-viewer with a short TTL; don't touch
  signals.
- A/B testing: load a different WEIGHTS object per bucket and pass weights into
  scorePost instead of importing them.
Show me the changed files and explain the trade-offs in 3 bullets.
```

---

## What to always tell the AI (context that keeps changes safe)

Whatever you ask, include these constraints so the AI doesn't drift:

- "Signals return a value from 0 to 1 and must be pure functions."
- "All tunable numbers live in config/ranking-weights.js, never hard-coded in logic."
- "Database access only happens through the dataSource object in feed.js."
- "Keep the per-signal breakdown on every scored post."
- "Show me only the files that changed."
