# CivilBase

A full-stack civil engineering knowledge platform — lecture notes, community feed, AI-powered structural checks, and interactive Eurocode / TCVN standards tools, all in one place.

**Live demo:** [civilbase.vercel.app](https://civilbase.vercel.app) *(update this URL after deploy)*

---

## Features

| Area | What it does |
|---|---|
| **Lecture Notes** | Hierarchical subjects → sections → PDFs / formulas / mind maps with full-text search |
| **Structural AI** | Clause-cited structural checks (Eurocode & TCVN) powered by Google Gemini — ask in plain English, get deterministic math with PASS / FAIL verdicts |
| **Community Feed** | Post, comment, like, repost — categorised by structural discipline (concrete, steel, composite, geotechnical) |
| **Standards** | Eurocode (EN 1990–1999) interactive reference tables, wind load calculators (EN 1991-1-4), EC2 rectangular section check tool with ULS / SLS / S&T tabs, bolt design data |
| **Profiles** | Username, avatar, cover photo, profession, specialisation, experience level, professional verification |
| **Messaging** | Direct messages between users |
| **Notifications** | Friend requests, post interactions, mentions |
| **i18n** | English and Vietnamese — swap at runtime via the account menu; preference is saved to `profiles.preferred_locale` for logged-in users |
| **AI Chat** | Context-aware chat for any lecture note section or PDF |
| **Admin** | Tool access control (per-tier gating for results and details), user management, subscriptions, content moderation |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database / Auth / Storage:** Supabase (PostgreSQL + Row Level Security + Storage buckets)
- **AI:** Google Gemini (`@google/generative-ai`)
- **Math rendering:** KaTeX + remark-math + rehype-katex
- **PDF handling:** pdfjs-dist, pdf-parse, unpdf
- **Icons:** Lucide React
- **Styling:** Inline styles + Tailwind CSS v4

---

## Project Structure

```
app/
├── page.tsx                        # Entry point — renders AppShell (subjects dashboard)
│
├── (home)/                         # Home route group (invisible in URL)
│   ├── layout.tsx                  # Shared layout for home area
│   │
│   ├── subjects/                   # Lecture notes area — co-located, mirroring standards/
│   │   ├── _components/
│   │   │   ├── shell/              # App frame — AppHeader, AuthModal, SelectModeBar, HomePage
│   │   │   ├── panels/             # Sidebars — SubjectsPanel, SectionsPanel, FilePanel
│   │   │   ├── content/            # Rich content — FormulaPanel, FormulaViewer, MindMapPanel, ChatPanel
│   │   │   └── pdf/                # PDF handling — PdfViewer, PdfPreviewModal, PreviewModal
│   │   └── _hooks/
│   │       ├── useData.ts          # All subjects/sections/PDFs/formulas/mind-map state + DB ops
│   │       ├── useSidebar.ts       # Sidebar width, collapse, pin, resize handlers
│   │       └── useSearch.ts        # Full-text search (PDF chunks, formulas, mind maps, site index)
│   │
│   ├── standards/                  # Eurocode & TCVN standards viewer
│   │   ├── page.tsx
│   │   ├── _lib/                   # Shared across ALL standards (import via @/app/(home)/standards/_lib/ui)
│   │   │   ├── ui.tsx              # DetailsSection, ResultsDetailsProvider, DetailGroup, CalcStep, Tex…
│   │   │   ├── ui-styles.ts        # Shared inline style constants
│   │   │   ├── ec-data.ts          # Eurocode reference data
│   │   │   └── tcvn-data.ts        # TCVN reference data
│   │   │
│   │   ├── _ec/                    # Eurocode standards
│   │   │   ├── _shared/            # Shared across EC0–EC9 (ui-atoms, section-diagram, nm-diagram, tool-card-grid…)
│   │   │   ├── ec0/                # EN 1990 — load combinations generator
│   │   │   ├── ec1/
│   │   │   │   └── tools/wind/     # EN 1991-1-4 wind load calculators
│   │   │   │       ├── tools/      # WindQp, WindWalls, WindFlat, WindMono, WindDuo, WindCanopy, WindFreewall, WindRectCyl, WindSign
│   │   │   │       ├── WindCalc.tsx
│   │   │   │       ├── WindShared.tsx
│   │   │   │       ├── WindPeakDetails.tsx
│   │   │   │       └── WindTables.tsx
│   │   │   ├── ec2/
│   │   │   │   └── tools/rect-section-check/
│   │   │   │       ├── Ec2RectCalc.tsx         # Root — state, useToolAccess
│   │   │   │       ├── rect-engine/            # Pure TS calculation (ULS, SLS, shear/torsion)
│   │   │   │       └── rect-ui/
│   │   │   │           ├── rect-results-panel.tsx   # Tab orchestrator — owns Results/Details toggle for all 3 tabs
│   │   │   │           ├── rect-input-panel.tsx
│   │   │   │           ├── rect-pass-fail-bar.tsx
│   │   │   │           ├── rect-export-modal.tsx
│   │   │   │           ├── rect-report.tsx
│   │   │   │           ├── uls/                # ULS results (UlsResults) + details (RectUlsDetails)
│   │   │   │           ├── sls/                # SLS results (RectSlsPanel) + details (RectSlsDetails)
│   │   │   │           └── st/                 # S&T results (ShearPanel) + details (RectStDetails) + diagram
│   │   │   └── ec3/                # EN 1993 — bolt data tables
│   │   │
│   │   ├── _tcvn/                  # TCVN reference
│   │   └── _pdf/                   # PDF library viewer
│   │
│   └── _components/                # Home-scoped shared components
│       ├── social/                 # Feed, posts, comments
│       ├── shared/                 # LockedBanner, VerifyModal, etc.
│       └── home/                   # Discussion, PhotoModal (shared with social)
│
├── (admin)/admin/                  # Admin dashboard (route group, auth-gated)
│   ├── page.tsx
│   ├── _components/                # AvatarCell, TierBadge
│   └── _tabs/
│       ├── tools/                  # Tool access control (min_tier, details_tier per tool)
│       ├── users/
│       ├── subscriptions/
│       ├── posts/
│       ├── verify/
│       ├── warnings/
│       ├── tickets/
│       └── stats/
│
├── (social)/
│   ├── u/[username]/               # Public profile page
│   └── feed/                       # Community feed
│
├── api/                            # API routes (chat, upload, etc.)
├── _components/                    # App-wide shared components (social nav, dropdowns)
├── _hooks/                         # useAuth, useScrollLock, useMessagingChat, usePageView
├── _lib/                           # notify.ts, siteIndex.ts, auth.ts
├── _types/                         # All shared TypeScript interfaces (Profile includes preferred_locale)
│
└── i18n/
    ├── LanguageContext.tsx          # useTranslation() — reads preferred_locale from DB on login,
    │                               #   writes back on change; falls back to localStorage for guests
    └── locales/
        ├── en/
        │   ├── index.ts            # Barrel — imports all namespace files and spreads them into `en`
        │   ├── common.ts           # Shared app-wide strings
        │   ├── standards.ts        # Standards page chrome (tabs, sidebar, part labels)
        │   ├── home.ts / feed.ts / … # Other page namespaces
        │   └── tools/              # One file per interactive tool calculator
        │       └── ec2-rect.ts     # std_ec2rc_* keys (504 keys)
        └── vi/                     # Vietnamese — mirrors en/ exactly (same keys, translated values)

> **Per-EC subfolder layout (standards locale):**
> `locales/<lang>/standards/` is split into one folder per Eurocode part:
> ```
> standards/
> ├── shared.ts          # Keys shared across all ECs (chip labels, nav)
> ├── ec0/               # EN 1990 — overview.ts, reference.ts, tables.ts, na.ts, index.ts
> ├── ec1/               # EN 1991 — same four files + index
> ├── ec2/               # EN 1992 — same four files + index
> ├── ec3/               # EN 1993 — same four files + index
> ├── tcvn/              # TCVN — overview.ts, na.ts, index.ts
> ├── eurocode.ts        # Eurocode tab chrome (psi table, load combos, steel/concrete tables)
> └── index.ts           # Barrel — spreads all of the above into one flat object
> ```
> Tool-internal strings (calculator labels, input groups, row labels) go in `tools/<name>.ts`,
> **not** in the standards subfolder. `reference.ts` per EC covers only the grid card labels and
> reference-page header strings.

lib/
├── supabase.ts                     # Supabase client
└── useSubscription.ts              # useToolAccess, useSubscription, tier helpers

supabase/migrations/                # SQL migrations (run in order)
```

---

## Tool System — How Results & Details Work

All tool UI components render their details content through `DetailsSection` from `@/app/(home)/standards/_lib/ui`. This is the **single choke point** for:
- Visibility (tab toggling)
- Copy protection (`userSelect`)
- Any future per-tool feature flags

**Pattern for every tool tab:**
```
rect-results-panel.tsx         ← owns Results/Details sub-tab toggle
  Results tab → <ShearPanel />           (results only, no state)
  Details tab → <DetailsSection>
                  <RectStDetails />      (fragment, no own wrapper div)
                </DetailsSection>
```

**Adding a new tool:** build your results component and details component separately. Wrap the details render in `<DetailsSection>` at the panel/orchestrator level. Import `_lib/ui` via `@/app/(home)/standards/_lib/ui` regardless of nesting depth.

---

## Timestamps — always server-clock

**Rule:** any timestamp that is later **compared or ordered** against a DB-generated timestamp (e.g. `messages.created_at`) must itself be written by the database, never by the client. A browser clock can lag the server, so a client `new Date()` boundary lands too early and `gt/lt/order` comparisons silently include the wrong rows. (This caused the chat-delete bug where deleted conversations resurfaced.)

Three approved patterns, in order of preference:
1. **Column default** — `created_at timestamptz default now()`
2. **Trigger** — for derived/updated columns (`conversation_last_message_at_trigger.sql`, `chat_session_updated_at_trigger.sql`)
3. **RPC returning the value** — when the client needs the stamped value back (`delete_chat_for_me.sql`, `count_active_warnings.sql` / `expire_warning`, `server_now.sql`)

**Guard:** `npm run check:timestamps` (also part of `npm run check`) fails on any `new Date().toISOString()` written via `.insert/.update/.upsert`. If a write is genuinely safe (an audit/`updated_at` column never compared or ordered, or a server-side API route), annotate the line with `// ts-ok`.

---

## Floating chat wiring — `useMessagingChat`

The floating `ChatBox` windows + `MessageDropdown` are mounted in several nav containers (`HomeNavBar`, `AppHeader`, and the per-page `TopNavBar` hosts: feed, recents, saved, notifications). The shared hook [`app/_hooks/useMessagingChat.ts`](app/_hooks/useMessagingChat.ts) owns all the `openChats` state, callback refs, and registrars so a signature change is made in **one** place.

```tsx
const chat = useMessagingChat()
// floating windows:
{user && chat.openChats.map((c, i) => <ChatBox key={c.convId} userId={user.id} {...chat.chatBoxProps(c, i)} />)}
// dropdown (directly or forwarded through TopNavBar):
<MessageDropdown userId={user.id} ... {...chat.dropdownHandlers} />
```

`u/[username]` is the one exception — it persists open chats to `sessionStorage` and renders an extra profile-triggered chat box, so it keeps its own wiring.

---

## Nav badge counts — dropdowns self-seed

`NotificationDropdown` and `FriendRequestDropdown` query their **own** unread/pending count on mount and keep it live via realtime. Pages must **not** also query those counts and push them down — that's how the bell/people badges drifted out of sync between nav bars (some pages seeded them, some didn't). The dropdown is the single source of truth; a nav just renders it.

`MessageDropdown` follows the same principle — it owns its unread count (the lean `unread_conversation_ids` RPC for the badge, `get_unread_conversations` for per-row counts).

**Guard:** `npm run check:badges` (part of `npm run check`) fails if a page pairs a `notifications`/`friendships` count query with `setUnreadNotifs(` / `setPendingFriends(`. Add `// badge-ok` to whitelist a genuine case.

---

## Auth on nav pages — no logged-out flash

A page that gates its nav on `supabase.auth.getUser()` (a network call) renders `user = null` first, flashing the signed-out nav on F5 before auth resolves. Two-part fix, applied on feed and `u/[username]`:

1. **`authChecked` flag** — pass it to `TopNavBar`; the "Sign in" button only renders when `authChecked && !user`, so a pending auth check shows neither state (no false logged-out flash).
2. **Seed from the cached session first** — `getSession()` reads the user from localStorage near-instantly; seed `currentUser` (and the cached profile under `civilbase_profile_<id>` so the avatar image shows immediately) before the authoritative `getUser()` round-trip.

```tsx
const [authChecked, setAuthChecked] = useState(false)
const { data: { session } } = await supabase.auth.getSession()
if (session?.user) {
  setUser(session.user)
  const cached = localStorage.getItem(`civilbase_profile_${session.user.id}`)
  if (cached) setProfile(JSON.parse(cached))   // avatar shows on first paint
}
setAuthChecked(true)
// ...then confirm with getUser() and refresh the cached profile
```

A `scrollbar-gutter: stable` on `html` (in `globals.css`) keeps centered layouts from shifting when a scrollbar appears. `html` and `body` are also set to `height: 100%; overflow: hidden` so the browser never uses the document scroll as a fallback — all scrolling happens inside explicitly designated `overflowY: auto` containers, and `TopNavBar`'s right section reserves its logged-in width (`minWidth`) so the category tabs don't slide when the avatar/icons mount.

---

## Internationalization

All on-screen text lives in `app/i18n/locales/<lang>/<namespace>.ts` as flat `key: 'value'` objects. Components read it with `const { t } = useTranslation()` → `t('some_key')`. The current namespaces: `common`, `feed`, `profile`, `setup`, `postcard`, `notifications`, `home`, plus the standards namespace (split into per-EC subfolders under `locales/<lang>/standards/`), plus one file per interactive tool under `locales/<lang>/tools/` (e.g. `tools/ec2-rect.ts`, `tools/ec1-wind.ts`, `tools/ec3-bolt.ts`).

**Per-user locale persistence:** `LanguageContext` reads `profiles.preferred_locale` from Supabase on login and writes it back whenever the user changes language. For guests, locale is stored only in `localStorage` under the key `civilbase_locale`. Run `supabase/migrations/profile_preferred_locale.sql` to add the column.

**Edit existing text:** change the string on the right of the colon — e.g. in `locales/en/home.ts` change `home_new_subject: 'New Subject'` to `'Add Subject'`. Edit `locales/vi/home.ts` for the Vietnamese version. **Never rename the key** (the left side) — components reference it by name.

**Add a string:** add the same `key: 'value'` to that namespace in **every** locale, then use `t('key')`.

**Add a language:** copy `locales/en/` → `locales/<code>/`, translate the values, then in `app/i18n/index.ts` add one `import <code> from './locales/<code>'`, one entry in `translations`, and one row in `LANGUAGE_OPTIONS`. `Locale` is derived from `translations`, and each locale folder has an `index.ts` barrel listing its namespaces — so there's nothing else to wire.

**Rules:** every locale must define the *same keys* as English (the reference). A missing key silently falls back to English on screen; a renamed/typo'd key is dead weight that never renders.

**Guard:** `npm run check:i18n` (part of `npm run check`) fails if any locale's keys don't exactly mirror `en/`. Brand/technical tokens (CivilBase, EC0–EC3, EN 1990…, PASS/FAIL, TCVN) are intentionally left as literals in components, not translated.

### Recipe — building a new tool, standard, or component with i18n

Follow this from the start so the feature ships bilingual and never needs a retrofit:

1. **Pick the namespace.** Every interactive **tool** (a calculator, a check tool, a multi-panel UI) gets its own file at `locales/<lang>/tools/<toolname>.ts` — e.g. `tools/ec2-rect.ts`. Shared page chrome (labels, tabs, sidebar headings) stays in `standards`. For non-tool areas use the closest existing namespace (`home`, `feed`, `profile`, …). After creating the file, add one import and one spread to **both** `locales/en/index.ts` and `locales/vi/index.ts` — that's all the wiring needed; the check script and `TranslationKey` type pick up the new file automatically.

2. **As you write JSX, never hardcode user-facing text.** For every visible string, add a key to **every** locale's namespace file and render it with `t('key')`:
   ```tsx
   const { t } = useTranslation()         // top of the component
   <button>{t('std_calc_run')}</button>   // not <button>Run</button>
   <input placeholder={t('std_input_span')} />
   ```
   This applies to JSX text, `placeholder=`, `title=`, `aria-label=`, and `alert()`/error strings.

3. **Key naming:** prefix by namespace + feature, snake_case — e.g. `std_ec2rc_<thing>` for the EC2 rect tool. Group related keys together with a `// ── comment ──` header so the file stays scannable.

4. **What to translate vs leave literal:**
   - **Translate:** button labels, headings, field labels, placeholders, helper/empty/error text, tooltips.
   - **Leave as literals (don't add keys):** brand/standard tokens (CivilBase, EC0–EC3, EN 1990, TCVN), units (kN, MPa, mm), math symbols/variable names (ψ, η, M_Ed), PASS/FAIL verdict tokens, and any value that comes from the **database or user input** (subject names, user-typed categories) — those render as stored, in any language.

5. **Counts/plurals:** there's no `{n}` interpolation in `t()`. Store the noun only (`'subject'` / `'subjects'`) and compose in JSX: `{n} {n === 1 ? t('..._one') : t('..._other')}`.

6. **Before committing:** run `npm run check:i18n` (or `npm run check`) — it fails if any locale is missing/extra a key. Then switch language in the account menu and eyeball the new screen.

---

## Local Development

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (for Structural AI and chat)

### 2. Clone and install

```bash
git clone https://github.com/vgsiro/lecture-notes.git
cd lecture-notes
npm install
```

### 3. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-google-ai-key
```

### 4. Database setup

Run every file in `supabase/migrations/` in numeric order inside the Supabase SQL editor, or use the Supabase CLI:

```bash
supabase db push
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel — free)

1. Push this repo to GitHub (already done at `github.com/vgsiro/lecture-notes`)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `vgsiro/lecture-notes`
3. Under **Environment Variables**, add the three variables from `.env.local` above
4. Click **Deploy** — Vercel builds and gives you a live URL
5. Every future `git push` to `main` auto-deploys

---

## Adding Things

| Task | Where |
|---|---|
| New standards tool | 1. Create folder under the relevant `_ec/ecN/tools/<toolname>/`. 2. Create `results` + `details` components. Wrap details in `<DetailsSection>`. Import `_lib/ui` via `@/app/(home)/standards/_lib/ui`. 3. Add tool ID to `TOOL_LABELS` in `admin/_tabs/tools/data.ts` and insert a row in `tool_access` table. 4. **Create translation files** `locales/en/tools/<toolname>.ts` and `locales/vi/tools/<toolname>.ts` — one flat `key: 'value'` object each. Add one `import` + one spread (`...toolname`) to **both** `locales/en/index.ts` and `locales/vi/index.ts`. Key prefix: `std_<shortname>_`. Use `t('key')` for every user-facing string — see "Recipe — building a new tool…". Run `npm run check` before committing. |
| New Eurocode part | Add folder under `app/(home)/standards/_ec/ecN/`. Shared EC atoms go in `_ec/_shared/`, shared standards UI goes in `_lib/`. Use `t()` for UI text (`standards` namespace) — see the i18n recipe. |
| New standard (non-EC) | Add folder under `app/(home)/standards/_<name>/`. Use `_lib/ui` for all shared UI. Use `t()` for UI text — see the i18n recipe. |
| Edit on-screen text | Change the **value** (right of the colon) in `app/i18n/locales/<lang>/<namespace>.ts`. For standards, the file is inside `locales/<lang>/standards/<ec>/`. Never rename the key. See "Internationalization". |
| New UI string | Add the same `key: 'value'` to **every** `locales/<lang>/<namespace>.ts`, use `t('key')`. For a new EC string: edit the matching `standards/<ec>/<file>.ts` in both `en/` and `vi/`. Run `npm run check:i18n`. |
| New language | Copy `locales/en/` → `locales/<code>/`, translate the values, then add one `import` + one `translations` entry + one `LANGUAGE_OPTIONS` row in `app/i18n/index.ts`. Nothing else. |
| New post category | `PostCategory` in `_types/` → SQL migration → locale files |
| New profession option | `PROFESSION_KEYS` in `u/[username]/` → `prof_*` key in both locale `profile.ts` files |
| New DB timestamp column | If it will ever be compared/ordered against another timestamp, make the DB own it (`default now()`, trigger, or RPC) — never write it from the client. Run `npm run check:timestamps` to verify. See "Timestamps — always server-clock". |
| Mount floating chat in a new nav | Call `useMessagingChat()` and spread `chatBoxProps(c, i)` / `dropdownHandlers` — see "Floating chat wiring". |
| New nav bar / page with auth | Seed `user` from `getSession()` + cached profile, pass `authChecked` to the nav. Don't query notification/friend badge counts (the dropdowns self-seed). See "Auth on nav pages" + "Nav badge counts". |
