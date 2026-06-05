'use client';
// ============================================================
//  Feed component (client)  —  fetches the ranked feed and renders it.
//  Put this at:  app/feed/Feed.jsx  (or components/Feed.jsx)
//
//  Includes infinite scroll + an "interaction logger" so every
//  view/like/etc. is recorded — that's what feeds affinity and
//  the seen-penalty on the NEXT load.
// ============================================================

import { useEffect, useState, useRef, useCallback } from 'react';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Load the ranked feed from the API route ---
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/feed?limit=20');
    const data = await res.json();
    setPosts(data.posts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // --- Log an interaction (fire-and-forget) ---
  // Calling this is what makes the feed "learn". Wire it to your
  // POST /api/interaction route which writes one Interaction row.
  async function logInteraction(postId, authorId, action) {
    fetch('/api/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, authorId, action }),
    });
  }

  return (
    <div className="feed">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onInteract={logInteraction} />
      ))}
      {loading && <p>Loading…</p>}
    </div>
  );
}

// --- A single post. Logs a "view" when it scrolls into sight. ---
function PostCard({ post, onInteract }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onInteract(post.id, post.authorId, 'view');
          observer.disconnect(); // count each post once per render
        }
      },
      { threshold: 0.6 } // 60% visible counts as "seen"
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post, onInteract]);

  return (
    <article ref={ref} className="post-card">
      <p>{post.tags?.join(', ')} · {post.type}</p>
      {/* your real post UI here */}
      <button onClick={() => onInteract(post.id, post.authorId, 'like')}>
        Like
      </button>
      <button onClick={() => onInteract(post.id, post.authorId, 'share')}>
        Share
      </button>
    </article>
  );
}
