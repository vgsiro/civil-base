# Next.js integration — clear steps

The ranking engine runs **only on the server**. Your React components never see
the algorithm; they just fetch a finished, ranked list from an API route. This
keeps your weights and logic private and the client lightweight.

```
Browser (Feed.jsx)
   │  fetch('/api/feed')
   ▼
app/api/feed/route.js   ← runs on the server
   │  buildFeed({ viewer, dataSource })
   ▼
lib/feed-ranking/*      ← the engine (config + signals + ranker + feed)
   │
   ▼
your database (via dataSource)
```

---

## Step 1 — drop the engine into your project

Copy the whole folder into your Next.js app under `lib/`:

```
your-next-app/
├── lib/
│   └── feed-ranking/        ← paste config/, src/, examples/ here
├── app/
│   ├── api/
│   │   ├── feed/route.js         ← from examples/nextjs/route.js
│   │   └── interaction/route.js  ← you write this (see Step 4)
│   └── feed/
│       ├── page.jsx              ← renders <Feed/>
│       └── Feed.jsx              ← from examples/nextjs/Feed.jsx
```

Use the `@/` import alias (default in create-next-app) so paths like
`@/lib/feed-ranking/src/feed` just work.

> Module format note: the engine uses CommonJS (`module.exports`). Next.js's
> bundler interops with it automatically, so `import { buildFeed }` works fine
> from your ESM route files. You don't need to convert anything. (If you set
> `"type": "module"` in package.json, rename the engine files to `.cjs` or
> convert their exports to `export`/`import`.)

---

## Step 2 — wire up the feed API route

`examples/nextjs/route.js` is ready to drop in at `app/api/feed/route.js`.
The only thing you must provide is `getCurrentUser()` — your existing auth/session
helper that returns `{ id, interests }` for the logged-in viewer.

---

## Step 3 — connect your database

Open `examples/nextjs/dataSource.js`. It has six methods, each with a commented
Prisma example. Uncomment/replace each query with your real one. The single
rule: **return the exact shapes** described in `src/models/types.js` (especially
`createdAt` as unix milliseconds — `row.createdAt.getTime()`).

That's the entire database-binding job. Nothing in `/src` changes.

---

## Step 4 — log interactions (this is what makes it "learn")

The feed gets smarter only if you record what people do. Add a tiny route:

`app/api/interaction/route.js`

```js
import { getCurrentUser } from '@/lib/auth';
// import { prisma } from '@/lib/prisma';

export async function POST(request) {
  const viewer = await getCurrentUser(request);
  if (!viewer) return Response.json({ error: 'auth' }, { status: 401 });

  const { postId, authorId, action } = await request.json();

  // await prisma.interaction.create({
  //   data: { userId: viewer.id, postId, authorId, action, at: new Date() },
  // });
  // Also bump post.stats counters for like/comment/share if you keep them live.

  return Response.json({ ok: true });
}
```

`Feed.jsx` already calls this on view / like / share. Those rows feed **affinity**
(closeness to authors) and the **seen-penalty** on the next load — the two
signals that personalise the feed over time.

---

## Step 5 — render it

`app/feed/page.jsx`:

```jsx
import Feed from './Feed';
export default function FeedPage() {
  return <Feed />;
}
```

Visit `/feed`. You'll get a ranked, personalising feed.

---

## Optional next steps (when you're ready, not before)

- **Cache the feed** per viewer for ~30–60s so scrolling doesn't re-rank every
  time. Wrap the `buildFeed` call in `app/api/feed/route.js` with Next's
  `unstable_cache` or a Redis get/set.
- **Server-render the first page** for speed: call `buildFeed` directly in a
  Server Component instead of via fetch, then hydrate `<Feed/>` with it.
- **Tune the feel** anytime by editing `lib/feed-ranking/config/ranking-weights.js`
  — no redeploy of logic needed, just new numbers.

See `docs/EXTENDING.md` to add new signals and `prompts/AI_BUILD_PROMPT.md` for
prompts that keep any AI's changes consistent with this structure.
