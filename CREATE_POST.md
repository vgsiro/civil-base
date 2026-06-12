# CreatePost — Component Guide

Single source of truth for the post composer. Read this before modifying `app/_components/social/post/CreatePost.tsx`.

---

## Architecture

Two components in one file:

```
CreatePost (default export)   ← compact trigger card, always visible in feed
  └── ComposeModal            ← full post form, portal-rendered on top of everything
```

`CreatePost` is the public API. `ComposeModal` is internal — never import it directly.

---

## Trigger Card (`CreatePost`)

The compact card shown in the feed at all times (logged-in users only).

**Contains:**
- Avatar + placeholder button → opens `ComposeModal`
- Three quick-action buttons: Photo/Video · Question · Update
- Hidden `<input type="file">` for Photo/Video (opens OS picker, pre-loads image into modal)
- Global paste listener — pastes an image from clipboard → opens modal with image pre-loaded

**Props:**

| Prop | Type | Description |
|---|---|---|
| `user` | `User` | Supabase auth user |
| `avatarColor` | `number` | Index into `AVATAR_COLORS` array |
| `avatarUrl` | `string \| null` | Profile photo URL (overrides color avatar) |
| `displayName` | `string` | Shown in avatar + modal author row |
| `onPostCreated` | `(post: PostWithProfile) => void` | Called after successful insert |
| `resharePost` | `PostWithProfile \| null` | Pre-fills modal in reshare mode |
| `onCancelReshare` | `() => void` | Clears reshare target in parent |

**Reshare flow:** when `resharePost` is set, the trigger card immediately opens `ComposeModal` in reshare mode via `useEffect`.

---

## Compose Modal (`ComposeModal`)

Full-screen overlay form, rendered via `createPortal` into `document.body` — escapes all `overflow: hidden` ancestors.

### Layout (top → bottom)

```
Header          — title + close button (×)
Author row      — avatar + display name + visibility selector + type tabs
Scrollable body — textarea + image preview + poll fields + reshare preview + error
Footer row 1    — [Add image] [Emoji picker]  ·····················  [Post button]
Footer row 2    — Topic: [Concrete] [Steel] [Composite] [Geotech] [Others]
```

### Post types

| Type | Trigger | Notes |
|---|---|---|
| `text` | Default | Update / Discussion tab |
| `question` | Question tab | Unlocks optional poll section |
| `reshare` | Set automatically | `resharePost` prop controls; tabs hidden |

### Topic categories

`concrete` · `steel` · `composite` · `geotechnical` · `others`

Stored as `category` column in `posts` table. On mobile, pills collapse to a `<select>` dropdown (CSS class toggle — `topic-pills-desktop` / `topic-select-mobile`).

### Visibility

`public` · `friends` · `private` — stored as `visibility` in DB. Selector shown below display name in author row.

### Image handling

Three entry points — all funnel into `applyFile(f: File)`:

1. **"Add image" button** in modal footer → `<input type="file">` inside modal
2. **Photo/Video button** on trigger card → `triggerFileRef` → sets `initialFile` state → opens modal
3. **Paste** (Ctrl+V) → global listener on trigger card (when modal is closed) or inside modal

`initialFile` prop seeds `mediaFile` + `mediaPreview` state on mount.

Only one image at a time. Remove with the `×` overlay button on the preview.

Drag-and-drop is also supported directly on the modal (visual `dashed border` feedback while dragging over).

### Emoji picker

`EmojiPicker` from `app/_components/shared/EmojiPicker.tsx`. On `onSelect`, emoji is inserted at the current cursor position in the textarea using `selectionStart`/`selectionEnd`.

### Poll (Question type only)

- 2–6 options, each an `<input>`
- Toggle: **Limited** (closed poll) / **Open** (anyone can add options)
- Stored as `poll_options: string[]` and `poll_open: boolean` in DB
- Poll section is optional — if both options are empty, no poll is saved

### Submit flow

1. Validate: body or image or (question + ≥2 poll options) required
2. Upload image to `post-media` Supabase Storage bucket if present
3. Insert row into `posts` with all fields
4. Select back with joined `profiles`, `post_likes`, `post_comments`, `post_recommendations`
5. Call `onPostCreated(post)` → fires `toast('Post published', 'success')` → closes modal

---

## State owned by trigger card

| State | Purpose |
|---|---|
| `open` | Whether `ComposeModal` is mounted |
| `initialFile` | Image pre-loaded into modal (from file picker or paste) |

Both are reset when modal closes.

---

## CSS / Mobile

No CSS classes on the trigger card itself — it uses inline styles throughout.

Modal (`ComposeModal`) uses two CSS class toggles for topic pills on mobile:

```css
/* globals.css — already present */
@media (max-width: 768px) {
  .topic-select-mobile { display: block !important; }
  .topic-pills-desktop { display: none !important; }
}
```

The modal itself is `position: fixed`, centered, `90vw` wide, `max-width: 540px`, `max-height: 90vh` — works on mobile without additional CSS.

---

## Adding a new post type

1. Add the type to `PostType` in `app/_types/index.ts`
2. Add a tab entry to the `TABS` array inside `ComposeModal`
3. Handle any special body validation in `handleSubmit`
4. Add the `post_type` value to the DB insert
5. Add i18n keys: `post_tab_<type>` in `en/feed.ts` and `vi/feed.ts`

## Adding a new topic category

1. Add to `PostCategory` type in `app/_types/index.ts`
2. Add an entry to `CATEGORIES` array inside `ComposeModal` (needs `value`, `label`, `activeColor`, `activeBg`, `activeBorder`, `icon`)
3. Add the matching `<option>` to the mobile `<select>` inside footer row 2
4. Add i18n key to `en/feed.ts` and `vi/feed.ts`

---

## Things NOT to do

- Do not import `ComposeModal` from outside this file — it is an internal sub-component
- Do not add a second image upload or multiple-image support without removing the single-image state (`mediaFile`, `mediaPreview`)
- Do not move the paste listener into `ComposeModal` — it lives on the trigger card intentionally so paste-to-open works when the modal is closed
- Do not use `window.innerWidth` for mobile detection — use the CSS class toggle pattern
- Do not add `onSubmit` to the `<form>` — there is no `<form>` element; submit is handled by the button's `onClick`
