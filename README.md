# CivilBase

A full-stack civil engineering knowledge platform — lecture notes, community feed, AI-powered structural checks, bolt design data, and Eurocode / TCVN standards, all in one place.

**Live demo:** [civilbase.vercel.app](https://civilbase.vercel.app) *(update this URL after deploy)*

---

## Features

| Area | What it does |
|---|---|
| **Lecture Notes** | Hierarchical subjects → sections → PDFs / formulas / mind maps with full-text search |
| **Structural AI** | Clause-cited structural checks (Eurocode & TCVN) powered by Google Gemini — ask in plain English, get deterministic math with PASS / FAIL verdicts |
| **Community Feed** | Post, comment, like, repost — categorised by structural discipline (concrete, steel, composite, geotechnical) |
| **Bolt Design Data** | Strength classes, shear / tension / bearing resistance, and edge distance tables |
| **Standards** | Eurocode (EN 1990–1999) and TCVN reference PDFs and lookup tables |
| **Profiles** | Username, avatar, cover photo, profession, specialisation, experience level, professional verification |
| **Messaging** | Direct messages between users |
| **Notifications** | Friend requests, post interactions, mentions |
| **i18n** | English and Vietnamese — swap at runtime via the account menu |
| **AI Chat** | Context-aware chat for any lecture note section or PDF |

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
├── page.tsx                    # Main notes dashboard (subjects / sections / PDFs / formulas)
├── layout.tsx                  # Root layout — LanguageProvider
├── feed/                       # Community feed
├── structural-ai/              # Structural Engineering AI (chat sessions)
├── bolt-data/                  # Bolt design data tables
├── standards/                  # Eurocode & TCVN standards viewer
├── guidelines/                 # Community guidelines
├── post/[id]/                  # Individual post permalink
├── messages/                   # Direct messages
├── notifications/              # Notification centre
├── admin/                      # Admin dashboard
├── profile/                    # Profile redirect
├── u/
│   ├── [username]/             # Public profile page
│   └── setup/                  # Username setup on first sign-in
│
├── components/
│   ├── TopNavBar.tsx           # Shared nav bar (all feed / social pages)
│   ├── AppHeader.tsx           # Header for the notes dashboard
│   ├── HomePage.tsx            # Landing dashboard with subject cards
│   ├── AuthModal.tsx           # Sign-in / sign-up overlay
│   ├── AccountMenu.tsx         # Avatar menu — language picker, settings
│   │
│   ├── PostCard.tsx            # Feed post card
│   ├── PostModal.tsx           # Post detail + full comment thread
│   ├── CreatePost.tsx          # Compose new post
│   ├── EditPostModal.tsx       # Edit post dialog
│   ├── PostModalFromFeed.tsx   # Opens a post from URL
│   ├── PostCardHelpers.tsx     # Shared avatar, lightbox, time helpers
│   │
│   ├── NotificationDropdown.tsx
│   ├── MessageDropdown.tsx
│   ├── FriendRequestDropdown.tsx
│   ├── ChatBox.tsx             # Floating DM window
│   ├── UserCard.tsx
│   ├── CommunityStats.tsx
│   ├── BigLineChart.tsx        # SVG line chart
│   │
│   ├── SubjectsPanel.tsx
│   ├── SectionsPanel.tsx
│   ├── FilePanel.tsx           # PDF list, upload, drag-to-reorder
│   ├── FormulaPanel.tsx        # Formula editor
│   ├── ChatPanel.tsx           # AI chat panel (per section / PDF)
│   ├── MindMapPanel.tsx        # Mind map viewer / editor
│   ├── PdfViewer.tsx
│   ├── PdfPreviewModal.tsx
│   ├── FormulaViewer.tsx
│   ├── PreviewModal.tsx
│   ├── FormulaPanel.tsx
│   │
│   ├── PhotoModal.tsx          # Avatar / cover photo upload
│   ├── VerifyModal.tsx         # Professional verification
│   └── FeedbackModal.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useData.ts              # Subjects, sections, formulas
│   ├── useSearch.ts            # Full-text search
│   ├── useSidebar.ts
│   ├── usePageView.ts
│   └── useScrollLock.ts
│
├── i18n/
│   ├── index.ts                # Merges locales, exports Locale + TranslationKey
│   ├── LanguageContext.tsx     # useTranslation() hook
│   └── locales/
│       ├── en/                 # English strings
│       └── vi/                 # Vietnamese strings
│
├── lib/
│   ├── notify.ts               # createNotification / deleteNotification helpers
│   └── siteIndex.ts
│
└── types/index.ts              # All shared TypeScript interfaces

supabase/migrations/            # SQL migrations (run these in order in your Supabase project)
ai/                             # AI prompt templates / helpers
recommendation/                 # Recommendation engine
scripts/                        # Utility scripts
```

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

Vercel is the recommended host for Next.js. The free Hobby plan covers this project with no cost.

### Steps

1. Push this repo to GitHub (already done at `github.com/vgsiro/lecture-notes`)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `vgsiro/lecture-notes`
3. Under **Environment Variables**, add the three variables from `.env.local` above
4. Click **Deploy** — Vercel builds and gives you a live URL (e.g. `lecture-notes.vercel.app`)
5. Every future `git push` to `main` auto-deploys

---

## Adding Things

| Task | Where |
|---|---|
| New page | `app/<route>/page.tsx`, import `TopNavBar` |
| New UI string | `app/i18n/locales/en/<namespace>.ts` + matching `vi/` file, use `t('key')` |
| New language | Duplicate `locales/en/` → `locales/<lang>/`, add to `Locale` type and `LANGUAGE_OPTIONS` in `AccountMenu.tsx` |
| New post category | `PostCategory` in `types/index.ts` → SQL migration → `CATEGORY_TABS` in `TopNavBar.tsx` → locale files |
| New profession option | `PROFESSION_KEYS` in `u/[username]/EditModal.tsx` → `prof_*` key in both locale `profile.ts` files |
