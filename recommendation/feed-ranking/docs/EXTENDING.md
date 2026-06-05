# Extending — how to add or change a signal in the future

The system is built so that adding a new ranking factor is a **3-step, ~15-line
change** that touches isolated files. Here's the exact recipe.

---

## Example: add a "media type" signal (boost videos)

### Step 1 — create the signal file

`src/signals/mediaType.js`

```js
// Returns 0..1. Videos score highest, plain text lowest.
const SCORES = { video: 1.0, image: 0.7, link: 0.5, text: 0.4 };

function mediaTypeScore(post) {
  return SCORES[post.type] ?? 0.4;
}

module.exports = { mediaTypeScore };
```

A signal is just a pure function that returns a number from 0 to 1. It can
take whatever inputs it needs (the post, the viewer, the shared context).

### Step 2 — add its weight to config

In `config/ranking-weights.js`, add one line to `WEIGHTS`:

```js
const WEIGHTS = {
  recency:    2.0,
  affinity:   3.0,
  engagement: 1.5,
  interest:   2.5,
  mediaType:  1.0,   // ← new
};
```

### Step 3 — wire it into the ranker

In `src/ranker.js`, import it and add one row to the `signals` array:

```js
const { mediaTypeScore } = require('./signals/mediaType');

// inside scorePost(), in the signals array:
['mediaType', WEIGHTS.mediaType, mediaTypeScore(post)],
```

Done. The ranker re-normalises weights automatically, and the new signal shows
up in the per-post `breakdown` for free, so you can immediately see its effect.

---

## Changing an existing signal

You almost never need to. Two cases:

- **Tune its strength** → change the number in `config/ranking-weights.js`.
- **Change its logic** (e.g. swap interest tag-overlap for embeddings) → rewrite
  the body of that one signal file. Keep the same function signature and the
  same 0..1 return range, and nothing else changes.

---

## Rules that keep this clean (please keep them)

1. **A signal returns 0..1.** Always. Normalise inside the signal, never in the
   ranker. This is what lets weights stay comparable.
2. **A signal is pure.** Same inputs → same output. No DB calls inside a signal;
   fetch data in the pipeline (`feed.js`) and pass it through `ctx`.
3. **Fetch data once per request, not per post.** If a new signal needs new
   data, add a method to `dataSource`, fetch it in `feed.js` into `ctx`, and
   read it from `ctx` inside the signal.
4. **Keep the ranker tiny.** If you're tempted to add logic to `ranker.js`,
   it probably belongs in a signal file instead.
5. **Never delete the `breakdown`.** It's how you debug "why did this rank here".

---

## Bigger future upgrades and where they go

| Upgrade                                    | Where it lives                          |
|--------------------------------------------|-----------------------------------------|
| Embedding-based interest matching          | rewrite `signals/interest.js`           |
| ML model predicting like/comment chance    | new `signals/predictedEngagement.js`    |
| Diversity (don't show 5 posts in a row from one author) | a post-rank step in `feed.js` after sort |
| A/B testing different weights              | load a different `WEIGHTS` per bucket   |
| Per-user learned weights                   | pass weights into `scorePost` instead of importing |

Every one of these is an additive change to an isolated place — none require
rewriting the core.
