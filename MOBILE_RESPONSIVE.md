# Mobile Responsiveness — CivilAxis

This document is the single source of truth for making any new page, tool, or feature mobile-friendly. Read it before building. The patterns here were established across the full site retrofit (session: 2026-06).

---

## Breakpoints

| Name | Rule | Used for |
|---|---|---|
| Mobile | `max-width: 768px` | Hide sidebars, stack layouts, shrink padding |
| Desktop | `min-width: 769px` | Restore desktop-only elements |

All overrides live in `app/globals.css`. Use `!important` on every mobile rule — it is necessary to beat inline styles, which are used throughout the app.

---

## The Core Pattern — CSS Classes on Inline-Styled Elements

The app uses inline `style={{}}` everywhere. To make something responsive **without touching desktop behaviour**:

1. Add a `className` to the JSX element alongside its existing inline style.
2. Add a `@media (max-width: 768px)` rule in `globals.css` that overrides with `!important`.

```tsx
// Before
<div style={{ width: 300, flexShrink: 0, ... }}>

// After
<div className="my-panel" style={{ width: 300, flexShrink: 0, ... }}>
```

```css
/* globals.css */
@media (max-width: 768px) {
  .my-panel { width: 100% !important; }
}
```

Never add JS-based `window.innerWidth` checks or `useState(isMobile)` for layout — CSS media queries are the correct tool and have zero hydration issues.

---

## Established CSS Classes

These classes already exist in `globals.css`. Reuse them on new components before creating new ones.

### Navigation
| Class | What it does on mobile |
|---|---|
| `.homenav-row` | Reduces gap + padding |
| `.homenav-logo-text` | Hidden |
| `.homenav-breadcrumb` | Hidden |
| `.homenav-extra-btn` | Hidden (donate / feedback / community buttons) |
| `.homenav-mobile-slot` | Visible on mobile only (hidden desktop via `min-width: 769px`) |
| `.topnav-logo-text` | Hidden |
| `.topnav-right` | `min-width: unset`, `gap: 2px` |
| `.topnav-category-pills` | Hidden (desktop pill buttons) |
| `.topnav-category-select` | Visible (mobile dropdown) |
| `.nav-dropdown-panel` | `left: 4px; right: 4px; width: auto` — full-width, screen-edge anchored |

### Feed / Profile
| Class | What it does on mobile |
|---|---|
| `.feed-grid` | Single column, bottom padding for nav |
| `.feed-left-sidebar` / `.feed-right-sidebar` | Hidden |
| `.feed-center` | `max-width: 100%` |
| `.mobile-bottom-nav` | Visible (`display: flex`) |
| `.profile-grid` | Single column |
| `.profile-cover` | `height: 180px` |
| `.profile-header-row` | Shrunk margins/gaps |
| `.profile-avatar-circle` | `88px` |

### Standards
| Class | What it does on mobile |
|---|---|
| `.ec-tab-bar` | Reduced padding |
| `.ec-tab-label` | Hidden (icon-only tabs) |
| `.ec-overview-body` | `padding: 16px 14px` |
| `.ec-tables-layout > :nth-child(-n+2)` | Hides both resizable side panels |
| `.ec-tables-layout > :last-child` | Reduces padding on the content area |
| `.ec-table-mobile-picker` | Visible (`display: flex`) — the two-dropdown + search bar |
| `.ec-tool-shell` | `overflow-y: auto` — allows tall tool content to scroll |

### EC2 Rect Tool
| Class | What it does on mobile |
|---|---|
| `.rect-tool-layout` | `flex-direction: column` — stacks input above results |
| `.rect-input-panel` | `width: 100%`, removes fixed 300px, border-bottom instead of border-right |
| `.rect-results-panel` | Reduced padding |
| `.rect-uls-grid` | `grid-template-columns: 1fr` — stacks diagram + sidebar |

---

## Layout Patterns

### 1. Two-column → single column (sidebars, grids)

```tsx
// JSX
<div className="my-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
  <aside className="my-sidebar">...</aside>
  <main>...</main>
</div>
```

```css
@media (max-width: 768px) {
  .my-grid { grid-template-columns: 1fr !important; }
  .my-sidebar { display: none !important; }
}
```

### 2. Fixed-width side panel → hidden with mobile replacement

When a panel contains navigation (part/table selectors), **don't just hide it** — provide a mobile replacement. See the `MobilePanelPicker` pattern below.

### 3. Horizontal flex → vertical stack (tool layout)

```tsx
<div className="tool-layout" style={{ display: 'flex', gap: 0 }}>
  <InputPanel />   {/* fixed width */}
  <ResultsPanel /> {/* flex: 1 */}
</div>
```

```css
@media (max-width: 768px) {
  .tool-layout { flex-direction: column !important; }
  .tool-input-panel { width: 100% !important; min-height: unset !important; }
}
```

### 4. Fixed-width SVG diagrams → horizontal scroll

SVG diagrams have pixel-fixed widths and cannot be reflowed. Wrap them in a scrollable container:

```tsx
<div style={{ overflowX: 'auto', width: '100%' }}>
  <MyDiagram />  {/* renders an <svg width={420} ...> */}
</div>
```

This is sufficient — users scroll horizontally to see the full diagram. Do **not** attempt to resize SVGs dynamically unless the diagram has a `viewBox` and `width="100%"` already set.

---

## Dropdowns and Portals

Any dropdown that opens **inside a `height`-constrained or `overflow: hidden` ancestor will be clipped**. This applies to:
- Navigation bars (`height: 56px`, `overflow: hidden`)
- Tool shells (`overflow: hidden` flex containers)
- Resizable panels

**Rule:** if a dropdown's parent has any `overflow` other than `visible`, use `createPortal`.

```tsx
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
const [mounted, setMounted] = useState(false)
const boxRef = useRef<HTMLDivElement>(null)

useEffect(() => { setMounted(true) }, [])

// Compute position from the trigger element
useEffect(() => {
  if (!open || !boxRef.current) { setPos(null); return }
  const r = boxRef.current.getBoundingClientRect()
  const margin = 8
  const left  = Math.max(margin, r.left)
  const right = Math.min(window.innerWidth - margin, r.right)
  setPos({ top: r.bottom + 4, left, width: right - left })
}, [open])

// In JSX — the trigger
<div ref={boxRef}>...</div>

// The portal — renders into document.body, escapes all clipping
{mounted && open && pos && createPortal(
  <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999, ... }}>
    {/* dropdown content */}
  </div>,
  document.body
)}
```

**Clamping to screen edges** — always clamp `left`/`right` to `8px` from the viewport:
```ts
const left  = Math.max(8, r.left)
const right = Math.min(window.innerWidth - 8, r.right)
```

---

## Mobile-Only Content (`mobileSlot` / CSS show/hide)

When an element must be **visible on mobile but hidden on desktop**, and its natural parent is hidden on mobile:

**Option A — `mobileSlot` prop (used on `HomeNavBar`)**

```tsx
// HomeNavBar accepts a mobileSlot prop
<HomeNavBar dark mobileSlot={<EcDropdown ... />}>
  {/* children = breadcrumb, hidden on mobile */}
  <EcDropdown ... />
</HomeNavBar>
```

```css
@media (min-width: 769px) {
  .homenav-mobile-slot { display: none !important; }
}
```

**Option B — CSS class toggle**

```css
.my-mobile-only { display: none; }

@media (max-width: 768px) {
  .my-mobile-only { display: flex !important; }
}
@media (min-width: 769px) {
  .my-desktop-only { display: none !important; }
}
```

---

## Navigation Controls for Hidden Side Panels

When side panels (part selectors, table selectors, country/section selectors) are hidden on mobile, provide a replacement control in the **main content area above the content**. Use `MobilePanelPicker` from `_ec/_shared/TablesList.tsx`:

```tsx
import { MobilePanelPicker } from '../../_shared/TablesList'

// Before ec-tables-layout div:
<MobilePanelPicker
  parts={parts}                  // { id, code, label }[]
  selectedPartId={selectedPart}
  tablesForPart={tablesForPart}  // { id, number, name }[]
  allTables={ALL_TABLES}         // TableEntry[] — for cross-part search
  activeId={activeTable}
  accentColor={ACCENT}
  onSelectPart={selectPart}
  onSelectTable={selectTable}
/>
<div className="ec-tables-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
  ...
```

`MobilePanelPicker` is hidden on desktop via `.ec-table-mobile-picker { display: none }` and shown via `.ec-table-mobile-picker { display: flex !important }` in the mobile media query. Its search results render via `createPortal` to escape clipping.

---

## SSR-Safe Mobile Initialisation

For JS state that must differ between mobile and desktop on first render (e.g. sidebars start collapsed on mobile):

```ts
// Module-level constant — safe because typeof window check
const isMobileInit = typeof window !== 'undefined' && window.innerWidth <= 768

// useState with this as initial value — no useEffect needed, no flash
const [collapsed, setCollapsed] = useState(isMobileInit)
```

**Do not** use `useEffect` + `useState(false)` for initial layout state — it causes a desktop → mobile layout flash on first paint.

---

## Overflow on Tool Containers

The tool shell wrapper (`EcToolShell`, when `isTool = true`) uses `overflow: hidden` to contain the desktop split-pane layout. On mobile, stacked tools are taller than the viewport and will be clipped.

```css
@media (max-width: 768px) {
  .ec-tool-shell { overflow-y: auto !important; overflow-x: hidden !important; }
}
```

Add `className="ec-tool-shell"` to the `isTool` wrapper in `EcToolShell.tsx` (already done). This class is reused for all EC tool wrappers — no new class needed for additional tools.

---

## Checklist — New Tool

When building a new interactive tool (calculator, section check, etc.):

- [ ] **Outer layout:** does the tool use a horizontal flex (input | results)? Add `className="rect-tool-layout"` or a new class that stacks to `flex-direction: column` on mobile.
- [ ] **Input panel:** fixed width? Add a class that sets `width: 100%` on mobile.
- [ ] **Results panel:** `overflow: hidden` ancestors? Add `.ec-tool-shell` pattern or ensure the container switches to `overflow-y: auto` on mobile.
- [ ] **SVG diagrams:** fixed pixel width? Wrap in `<div style={{ overflowX: 'auto', width: '100%' }}>`.
- [ ] **Fixed-column grid** (e.g. `gridTemplateColumns: '1fr 280px'`)? Add a class and collapse to `1fr` on mobile.
- [ ] **Side navigation panels** (part/table/section selectors)? Add `ec-tables-layout` class to the outer flex and provide `MobilePanelPicker` above it.
- [ ] **Dropdowns that open from inside a clipped container?** Use `createPortal` with `position: fixed` and viewport clamping.
- [ ] **Bottom nav bar overlap:** any scrollable page content needs `padding-bottom: 72px` on mobile (the bottom nav is 56px + gap).

---

## Checklist — New Page

- [ ] **Full-width layout:** does it have left/right sidebars? Add classes and `display: none` them on mobile.
- [ ] **Bottom padding:** add `80px` bottom padding to main content so it clears the mobile bottom nav.
- [ ] **Nav:** use `HomeNavBar` (home area) or `TopNavBar` (social area) — both already handle mobile sizing.
- [ ] **Dropdowns from nav:** use `nav-dropdown-panel` class to get full-width screen-edge anchoring on mobile.
- [ ] **Auth flash:** seed from `getSession()` + cached profile before `getUser()` — see README "Auth on nav pages".

---

## Sizing Hierarchy (Nav Elements)

These sizes are enforced across all nav bars. Do not deviate:

| Element | Size |
|---|---|
| Website logo (`/logo.png`) | `42 × 42px` |
| Profile/AccountMenu avatar | `size={34}` |
| Social icon buttons (Friends, Messages, Notifications) | `32 × 32px`, icon `16px` |

---

## Anti-Patterns

| Don't | Do instead |
|---|---|
| `window.innerWidth` in `useState` initial value without SSR guard | `typeof window !== 'undefined' && window.innerWidth <= 768` |
| `useEffect` to set `isMobile` for layout | CSS media queries |
| `position: absolute` dropdown inside a height-constrained parent | `createPortal` with `position: fixed` |
| Hardcoded `right: 100` for dropdown position | Compute from `getBoundingClientRect()` + viewport clamp |
| Resizing SVG diagrams dynamically | Wrap in `overflowX: auto` container |
| Hiding side panels without providing a navigation replacement | Add `MobilePanelPicker` or equivalent |
| `overflow: hidden` on a stacked mobile layout | `overflow-y: auto` via `.ec-tool-shell` pattern |
