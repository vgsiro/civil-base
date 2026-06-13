# General Tool Build Conventions

Applies when building **any new tool** under `app/(home)/tools/<tool-name>/`.
For conventions specific to the Steel Sections tool see `app/(home)/tools/steel-sections/CONVENTIONS.md`.

---

## 1. Folder Structure

```
app/(home)/tools/<tool-name>/
  page.tsx                    ← Next.js route, minimal — just renders the root component
  <ToolName>.tsx              ← orchestrator: layout, sidebar, tab switching, top-level state
  _shared/
    types.ts                  ← all TypeScript interfaces/types for this tool
    column-meta.tsx           ← column/parameter metadata (labels, groups, tooltips)
  <variant>/                  ← one subfolder per section type or calculation variant
    engine.ts                 ← pure TS calculation engine, no React
    Panel.tsx                 ← UI panel for this variant
    data/
      index.ts                ← assembles raw arrays into typed structures
  data/
    <dataset>.ts              ← raw data arrays (one file per dataset)
```

If the tool has only one variant, the `<variant>/` subfolder can be skipped and `engine.ts` + `Panel.tsx` placed directly in the tool root.

---

## 2. Engine Rules

- **Pure TypeScript** — no React, no UI imports, no `useState`, no JSX
- Import only from `_shared/types` and standard library
- Separate **table functions** (full grid, used for table rendering) from **point functions** (single value, used for detail derivations with real numbers)
- Keep internal helpers unexported unless the UI needs them directly
- All unit conversions happen inside the engine — never in the UI component
- Export a convenience `computeAll(row, params): AllResults` that calls all table functions at once

---

## 3. Translation Organization

### File locations
```
app/i18n/locales/
  en/tools/<tool-name>/
    shared.ts        ← UI chrome, group labels, column/parameter tooltips
    <variant>.ts     ← variant-specific strings (capacity titles, detail labels, etc.)
  vi/tools/<tool-name>/
    shared.ts
    <variant>.ts
```

### Key prefix convention
| Scope | Prefix pattern | Example |
|---|---|---|
| Shared UI chrome | `<abbrev>_` | `bb_section_type` |
| Column/parameter tooltips | `<abbrev>_tip_` | `bb_tip_h` |
| Group labels | `<abbrev>_grp_` | `bb_grp_major_axis` |
| Variant-specific | `<abbrev><variant>_` | `bbuc_bend_title` |

Choose a short unique abbreviation per tool (e.g. `bb` for Blue Book / Steel Sections, `ec2` for EC2 Rect, `bolt` for EC3 Bolt).

### Rules
1. **Create EN and VI files together** before wiring — the i18n parity check requires both
2. Wire with named imports + spread in **both** `en/index.ts` and `vi/index.ts`:
   ```ts
   import toolShared from './tools/<tool-name>/shared'
   import toolVariant from './tools/<tool-name>/<variant>'
   // in the locale object:
   ...toolShared,
   ...toolVariant,
   ```
3. Never hardcode user-facing text in components — always use `const { t } = useTranslation()`
4. Exceptions (leave as literals): brand names, technical tokens, database field values, units like `kN`/`kNm`/`mm`
5. Run `npm run check` after wiring — must show same key count across all locales

---

## 4. Column / Parameter Metadata (`_shared/column-meta.tsx`)

Export from this file:

| Export | Type | Purpose |
|---|---|---|
| `VISIBLE_COLS` | `string[]` | Ordered list of column keys shown in the table |
| `COLUMN_GROUPS` | `{ labelKey: string; cols: string[] }[]` | Groups with i18n key (not hardcoded label) |
| `COL_LABEL` | `Record<string, ReactNode>` | JSX with `<sub>` for subscripts — for table headers |
| `COL_TIP_KEY` | `Record<string, string>` | i18n key for tooltip description |
| `COL_TIP_SYMBOL` | `Record<string, string>` | Symbol string shown alongside tooltip |

Use `grp.labelKey` with `t(grp.labelKey as ...)` when rendering group headers — never store translated strings in the metadata.

---

## 5. Results / Details Tab Pattern

- **Single toggle** at the top of the panel — one `useState<'results' | 'details'>`, not per-section
- **Results tab**: all output tables visible, no derivation formulas
- **Details tab**: `CrossSectionDetails` (or equivalent) + each section component with `showDetails` prop

### `showDetails` prop pattern
Each section component accepts `showDetails?: boolean`:
- `false` or omitted → renders table + selector bar only
- `true` → renders table + selector bar + `CalcStep` derivations

---

## 6. Selector Bars

Each section in the Results tab gets a selector bar below its table so the user can choose which point the Details tab will derive.

### Behaviour
- Click any table cell → snaps input(s) to that cell's parameter values
- Highlighted: column/row header `#e0f2fe`, selected cell `#bae6fd`, bold value
- Text inputs accept any custom value, not limited to grid points
- Show live point result in the bar: e.g. `→ M_b,Rd = 312.45 kNm`
- Use **2 decimal places** (`r2()`) for point results — makes small changes from custom input visible

### State location
- All selector state lives in the parent panel component
- Passed as props + setters to each section component: `selParam`, `onSelParam`
- Same state feeds the Details tab — selecting in Results immediately updates derivations

---

## 7. KaTeX and Subscripts

### `<Tex>` (KaTeX) — use for
- Inline math in JSX: `<Tex>{'M_{b,Rd}'}</Tex>`
- Section headings that include symbols
- Selector bar output labels
- Any symbol that needs proper math rendering

### `<sub>` (plain HTML) — use for
- Column headers in property tables — keeps table lightweight, no KaTeX overhead
- `COL_LABEL` map uses `<sub>` for this reason

### `CalcStep formula=` strings — always full LaTeX
```ts
formula={`\\dfrac{h}{b} = \\dfrac{${row.h}}{${row.b}} = ${nf(val, 2)}`}
```
- Double-escape backslashes: `\\dfrac`, `\\mathrm`, `\\sqrt`, `\\times`
- Inject real computed values via template literals for point derivations
- Never mix: symbol in a `formula=` string → LaTeX; symbol in JSX → `<Tex>` or `<sub>`

---

## 8. CalcStep / DetailGroup Pattern

```tsx
<DetailGroup title={t('tool_det_group_title')}>
  <CalcStep
    label={t('tool_det_step_label')}
    formula={`\\text{formula with } ${nf(value, 4)}\\ \\mathrm{unit}`}
  />
</DetailGroup>
```

- `DetailGroup` — titled card that groups related steps; title can include `<Tex>` inline
- `CalcStep` — `label` (ReactNode or string) left, KaTeX-rendered `formula` right
- For point derivations: inject computed intermediate values (not just final result) so the reader can follow the full derivation path
- Group logically: material → classification → resistance → buckling, etc.

---

## 9. Export (Print / Save PDF)

Use the shared `ExportModal` + `runPrint` from `standards/_lib/print-engine.tsx`. No external PDF library needed — browser `window.print()` to A4.

### File
Create `<variant>/ExportModal.tsx` (or `ExportModal.tsx` at tool root for single-variant tools).

### Pattern
```tsx
// ExportModal.tsx
import { ExportModal, type SectionGroup } from '../../../standards/_lib/print-engine'

export function ToolExportModal({ ...props, onClose }) {
  const bendRef    = useRef<HTMLDivElement>(null)
  const bendDetRef = useRef<HTMLDivElement>(null)
  // ...one ref pair per section group

  const groups: SectionGroup[] = [
    { color: '#1d4ed8', label: t('...'), desc: t('...'), detDesc: t('...'),
      refs: [bendRef, bendDetRef], defaultOn: true },
    // ...
  ]

  return (
    <ExportModal title={t('...')} defaultReport={t('...')} groups={groups} onClose={onClose}>
      {() => (<>
        <div ref={bendRef}>  {/* Results content — tool-specific only */}  </div>
        <div ref={bendDetRef}>  {/* Details content — tool-specific only */}  </div>
        {/* ...more ref divs */}
      </>)}
    </ExportModal>
  )
}
```

### Rules
- **Ref divs contain tool-specific content only** — never a report header or footer. `runPrint` owns all branding/chrome.
- The `ExportModal` children render prop is where ref divs live — refs must attach to elements **inside** the children, not elements already in the main DOM
- Section components rendered inside the modal must be **exported** from their source file so the modal can import them
- Pass `noOp = () => {}` as interactive callbacks (selectors, setters) inside the modal — the hidden copies are read-only
- Pass current selector values as props so the PDF matches exactly what the user sees
- `refs[0]` = results (tables only, `showDetails={false}`); `refs[1]` = details (derivations, `showDetails`)
- `SectionGroup.firstIsRef = true` only for sections that use a `cb-sections` two-column grid layout — omit for standard detail blocks

### Report header — owned by `runPrint`, consistent across all tools
`runPrint` in `standards/_lib/print-engine.tsx` automatically generates all report chrome:

| Page | Content |
|---|---|
| Page 1 | Blue gradient banner (CivilAxis logo + title) + 3-column meta grid (Project, Report/Subject, Designer, Checker, Approver, Date) |
| Pages 2+ | Slim running header: report name right-aligned |
| All pages | Footer: CivilAxis · copyright · "Generated {date}" |

**Never add a header or footer inside a tool's ref div.** All reports are consistent because the chrome lives in one place.

### i18n keys to add per tool
```
<abbrev>_exp_title           — modal title
<abbrev>_exp_default_report  — default report name pre-filled in the modal
<abbrev>_exp_<section>_label   — group label
<abbrev>_exp_<section>_desc    — results checkbox description
<abbrev>_exp_<section>_detdesc — details checkbox description
<abbrev>_exp_btn             — button label (shown on the Results/Details pill row)
```

### Export button placement
The export button belongs on the **same row as the Results/Details pills**, not in the top bar. In `CapacityShell` pass it via `exportLabel` + `onExport` — the shell places it with `marginLeft: 'auto'` at the right end of the pill row.

### Wiring in parent panel
```tsx
const [exportOpen, setExportOpen] = useState(false)
// Pass to CapacityShell — rendered on the Results/Details row:
<CapacityShell
  exportLabel={`🖨 ${t('<abbrev>_exp_btn')}`}
  onExport={() => setExportOpen(true)}
  ...
>
// Modal rendered as sibling outside CapacityShell:
{exportOpen && <ToolExportModal ...currentState onClose={() => setExportOpen(false)} />}
```

---

## 10. Mobile Responsiveness

Tools with a sidebar + main panel layout must use a **column-then-row** flex structure so a mobile dropdown selector can sit above the row:

```tsx
// Outer: column so mobile controls stack above the content row
<div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
  {/* Mobile dropdown — CSS class shows/hides it */}
  <div className="<tool>-mobile-cat" style={{ display: 'none' }}>
    <select .../>
  </div>

  {/* Inner row: sidebar + right panel */}
  <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
    <div className="<tool>-sidebar" style={{ width: N, flexShrink: 0, ... }}>...</div>
    <div style={{ flex: 1, ... }}>...</div>
  </div>
</div>
```

Add these CSS classes to `app/globals.css` under `@media (max-width: 768px)`:
```css
.<tool>-sidebar    { display: none !important; }
.<tool>-mobile-cat { display: block !important; padding: 10px 14px; background: #fff; border-bottom: 1px solid #e2e8f0; }
```

For tables inside the tool, wrap in a div with class `<tool>-table-wrap` and add:
```css
.<tool>-table-wrap { overflow-x: auto !important; }
```
— or give the table container `overflowX: 'auto'` inline and assign the class so CSS can override if needed.

Top bars with multiple controls should use `flexWrap: 'wrap'` so buttons wrap gracefully on narrow screens.

---

## 11. Tier Gating

Tools gate features via `useToolAccess` from `lib/useSubscription.ts`. The tier configuration lives in the `tool_access` DB table (per `tool_id`).

### Pattern — in the tool root component

```tsx
import { useCurrentUser, useToolAccess } from '@/lib/useSubscription'

// Inside the component:
const { userId, userEmail } = useCurrentUser()   // shared hook — no per-tool supabase.auth.getUser()
const toolAccess = useToolAccess('<tool_id>', userId, userEmail)
// Pass toolAccess down to the panel that needs it
```

`useCurrentUser()` handles the `supabase.auth.getUser()` call once — **never** write the `useState`/`useEffect` pattern inline in a component again.

### ToolAccess fields

| Field | Default tier | Controls |
|---|---|---|
| `canUse` | `normal` | whether the tool is accessible at all |
| `canViewDetails` | `pro` | Details tab (CalcStep derivations) |
| `canExport` | `premium` | Print / Save PDF button |
| `canCopyDetails` | `admin` | copy-to-clipboard of derivations |

### Wiring into CapacityShell

```tsx
// In CapacityPanel.tsx (or equivalent):
import type { ToolAccess } from '@/lib/useSubscription'
import { LockedBanner } from '@/app/_components/shared/LockedBanner'

const DEFAULT_ACCESS: ToolAccess = { canUse: true, canViewDetails: false, canExport: false, canCopyDetails: false }

export default function CapacityPanel({ ..., toolAccess = DEFAULT_ACCESS }) {
  ...
  return (
    <CapacityShell
      exportLabel={toolAccess.canExport ? `🖨 ${t('..._exp_btn')}` : undefined}
      onExport={toolAccess.canExport ? () => setExportOpen(true) : undefined}
      exportLocked={!toolAccess.canExport}
      exportLockedLabel={t('..._export_premium')}
      detailsLockedBanner={!toolAccess.canViewDetails
        ? <LockedBanner requiredTier="pro" message={t('..._upgrade_details')} />
        : undefined
      }
      ...
    >
```

### i18n keys to add per tool

```
<abbrev>_upgrade_details   — pro gate message on Details tab (add to shared.ts or variant.ts)
<abbrev>_export_premium    — premium badge label on export button
```

---

## 13. i18n Hook Usage

```tsx
// In every component that renders user-facing text:
const { t } = useTranslation()

// Typed usage — cast the key when using dynamic labelKey:
t(grp.labelKey as Parameters<typeof t>[0])
```

Import from `../../../../i18n/LanguageContext` (adjust depth for file location).

---

## 14. Checks Before Finishing Any Task

```bash
npx tsc --noEmit        # zero TypeScript errors
npm run check           # all 3 must pass:
                        #   ✓ No client timestamps written to the DB
                        #   ✓ No parent-seeded nav badge counts
                        #   ✓ i18n keys in sync across N locales
```

Never mark a task done until both commands are clean.
