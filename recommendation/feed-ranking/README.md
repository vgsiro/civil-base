# Feed ranking system

A small, readable, Facebook-style feed ranking engine. It scores every
candidate post for a viewer and returns them sorted best-first.

The whole design goal is **easy to change later**: behaviour is controlled
by numbers in one config file, and each ranking signal is an isolated file
you can rewrite without breaking anything else.

---

## File map — what each file is for

```
feed-ranking/
├── config/
│   └── ranking-weights.js   ← TUNE THE FEED HERE (numbers only, no logic)
├── src/
│   ├── models/types.js      ← data shapes (Post, User, Interaction…)
│   ├── signals/             ← one file per ranking signal, each returns 0..1
│   │   ├── recency.js
│   │   ├── affinity.js
│   │   ├── engagement.js
│   │   └── interest.js
│   ├── ranker.js            ← combines signals → one score (stays tiny)
│   └── feed.js              ← the pipeline you call: buildFeed()
├── docs/
│   ├── WORKFLOW.md          ← how data flows + when to recompute
│   └── EXTENDING.md         ← exact steps to add/change a signal
├── prompts/
│   └── AI_BUILD_PROMPT.md   ← paste into an AI to build/extend this
└── example.js               ← runnable demo with fake data
```

The mental model: **config = the dials, signals = the sensors, ranker =
the mixer, feed = the machine.**

---

## How the algorithm works (the 4 stages)

1. **Inventory** — gather candidate posts (from people/pages the viewer follows).
2. **Filter** — remove blocked authors, hidden posts, anything they shouldn't see.
3. **Rank** — for each post compute four signals, blend them by weight into a
   single score, then sort high → low.
4. **Serve** — return the top N.

The score for one post is:

```
score = Σ (weightᵢ / totalWeight) × signalᵢ      (each signal is 0..1)
then × seenPenalty   (pushes down posts already viewed)
```

Because every signal is normalised to 0..1 and weights are relative, you can
reason about the feed just by reading `config/ranking-weights.js`.

---

## Clear steps to run it

1. Make sure Node.js is installed (`node -v`).
2. From the `feed-ranking/` folder run:
   ```
   node example.js
   ```
3. You'll see each post with its score and a per-signal breakdown — that
   breakdown is your debugging superpower; it tells you *why* a post ranked
   where it did.

---

## Clear steps to use it in your real app

1. Open `example.js` and look at the `dataSource` object. It has six methods
   (getCandidatePosts, getBlockedAuthors, …). These are the **only** things
   tied to your database.
2. Create your own `dataSource` where each method runs a real DB query but
   returns the **same shapes** described in `src/models/types.js`.
3. In your feed route/endpoint, call:
   ```js
   const { buildFeed } = require('./src/feed');
   const feed = await buildFeed({ viewer, dataSource, limit: 20 });
   ```
4. Render `feed` on your page. Done — the ranking logic never had to change.

---

## When you want to change how the feed behaves

| You want…                              | Change this                                  |
|----------------------------------------|----------------------------------------------|
| Newer posts to matter more             | raise `WEIGHTS.recency`                       |
| Friends' posts to dominate             | raise `WEIGHTS.affinity`                      |
| A slower / more evergreen feed         | raise `PARAMS.recencyHalfLifeHours`           |
| Comments to count more than likes      | raise `ACTION_VALUES.comment`                 |
| A brand-new signal (e.g. location)     | follow `docs/EXTENDING.md`                    |

Most changes are a single number in `config/ranking-weights.js`.

---

See `docs/WORKFLOW.md` for the data flow and `docs/EXTENDING.md` for the exact
recipe to add a new signal. Hand `prompts/AI_BUILD_PROMPT.md` to an AI when you
want it to build or extend this system for you.
