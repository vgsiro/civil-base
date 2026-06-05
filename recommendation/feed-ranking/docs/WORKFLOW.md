# Workflow — how data flows and when things happen

## The request flow (what happens when a viewer opens the feed)

```
Viewer opens page
      │
      ▼
your feed endpoint  ──calls──▶  buildFeed({ viewer, dataSource, limit })
      │
      ▼
1. INVENTORY   dataSource.getCandidatePosts(viewerId)
      │
      ▼
2. FILTER      remove blocked authors + hidden posts
      │
      ▼
   fetch shared context ONCE:
     - viewer interactions  (for affinity)
     - seen counts          (for the seen-penalty)
      │
      ▼
3. RANK        scorePost() per post  →  sort by score desc
      │
      ▼
4. SERVE       slice top N  →  return to page
```

Key point: the context (interactions, seen counts) is fetched **once per
request**, not once per post. With 500 candidate posts you still do a handful
of queries, not 500.

---

## Where each signal gets its data

| Signal     | Needs                                    | Comes from                         |
|------------|------------------------------------------|------------------------------------|
| recency    | post.createdAt + current time            | the post itself                    |
| affinity   | viewer's past interactions with author   | `getViewerInteractions`            |
| engagement | post like/comment/share/impression counts| the post's `stats`                 |
| interest   | viewer.interests vs post.tags            | the viewer + the post              |

---

## The write side (keeping data fresh)

Ranking is the *read* side. For it to work, you also log the *write* side:

1. Every time a viewer views/likes/comments/shares/hides a post, write one
   `Interaction` row. This feeds affinity AND seen-counts AND, in aggregate,
   the post `stats`.
2. Keep `post.stats` updated (likes, comments, shares, impressions). You can
   update these live, or recompute them on a schedule — either works.

```
User taps "like"
      │
      ▼
write Interaction { userId, postId, authorId, action:'like', at }
      │
      ├──▶ increments post.stats.likes        (engagement signal)
      └──▶ becomes history for affinity        (affinity signal)
```

---

## Performance notes for later (don't over-build early)

- **Start simple:** rank on every request, in memory. Fine up to thousands of
  candidate posts.
- **When it gets slow:** cache the ranked feed per viewer for a short window
  (e.g. 30–60s) instead of re-ranking on every scroll.
- **When it gets big:** precompute candidate inventory in a background job and
  store it per viewer, so request-time only does filter + rank + serve.
- **Much later:** replace the `interest` signal's tag-overlap with embedding
  similarity, and add an ML model that predicts engagement probability. The
  signal interface stays the same, so this is a swap, not a rewrite.

The architecture is built so each of these upgrades touches one place.
