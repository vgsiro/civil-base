# Steel Sections Tool — Build Conventions

Applies when adding a **new section type** (e.g. CHS, RHS, Angles) to this tool.
For general tool conventions see `TOOL_CONVENTIONS.md` at the repo root.

---

## Folder Structure

```
app/(home)/tools/steel-sections/
  SteelSections.tsx           ← orchestrator: sidebar, properties table, tab switching
  page.tsx
  _shared/
    types.ts                  ← SectionRow, SectionType interfaces
    column-meta.tsx           ← VISIBLE_COLS, COLUMN_GROUPS, COL_LABEL, COL_TIP_KEY/SYMBOL
    CapacityShell.tsx         ← shared capacity panel chrome (top bar + grade pills + toggle + scroll wrapper)
  <variant>/                  ← e.g. ub-uc/, chs/, rhs/
    ec3-engine.ts             ← pure TS, no React, all EC3 formulas
    CapacityPanel.tsx         ← full capacity UI for this variant
    data/
      index.ts                ← imports raw arrays, exports SectionType[] + ALL_*_ROWS
  data/
    ub.ts  uc.ts  ...         ← raw section property arrays
```

---

## Adding a New Section Variant

### 1. Data
- Add raw data file under `data/<variant>.ts`
- Create `<variant>/data/index.ts` that assembles `SectionType[]` and exports `ALL_<VARIANT>_ROWS`

### 2. Engine (`<variant>/ec3-engine.ts`)
- Pure TS — no React, no UI imports
- Import `SectionRow` from `../_shared/types`
- Export **table functions** for full grid rendering:
  - `mbRdTable(row, grade): number[][]`
  - `mNrdTable(row, grade): MNrdRow[]`
  - `nbRdTable(row, grade): NbRdRow[]`
  - `computeCapacity(row, grade): CapacityResult`
- Export **point functions** for single-value detail derivations:
  - `calcMbRdPoint(row, grade, C1, Lcr_m)` — returns all intermediate values (Mcr, lamLT, phi, chiLT, chiLTmod, MbRd)
  - `calcMNrdPoint(row, grade, n)` — returns a, MNyRd, MNzRd
  - `calcNbRdPoint(row, grade, Lcr_m)` — returns lamY/Z/T, chiY/Z/T, NbYRd/ZRd/TRd, alphaY/Z
- Keep internal helpers (`lambdaBar`, `chi`, `calcMcr`, etc.) unexported unless the UI needs them directly
- Unit conversions: SectionRow stores cm/dm units — convert to mm inside the engine, never in the UI

### 3. Column Metadata (`_shared/column-meta.tsx`)
- `VISIBLE_COLS` — ordered array of column keys shown in the properties table
- `COLUMN_GROUPS` — array of `{ labelKey: string; cols: string[] }` — use `labelKey` (i18n key), never a hardcoded string
- `COL_LABEL` — `Record<string, ReactNode>` mapping column key → JSX with `<sub>` for subscripts (lightweight, no KaTeX)
- `COL_TIP_KEY` — `Record<string, string>` mapping column key → i18n key for tooltip description
- `COL_TIP_SYMBOL` — `Record<string, string>` mapping column key → symbol string shown in tooltip

### 4. Translation Files

#### File locations
```
app/i18n/locales/
  en/tools/steel-sections/
    shared.ts        ← UI chrome, group labels, column tooltips
    ub-uc.ts         ← UB/UC capacity strings, detail titles, CalcStep labels
    <variant>.ts     ← new variant strings
  vi/tools/steel-sections/
    shared.ts
    ub-uc.ts
    <variant>.ts
```

#### Key prefix convention
| Scope | Prefix | Example |
|---|---|---|
| Shared UI chrome | `bb_` | `bb_section_type`, `bb_tab_properties` |
| Column tooltips | `bb_tip_` | `bb_tip_h`, `bb_tip_Ix` |
| Column group labels | `bb_grp_` | `bb_grp_major_axis` |
| UB/UC specific | `bbuc_` | `bbuc_bend_title`, `bbuc_det_ltb_curve_title` |
| New variant | `bb<abbrev>_` | `bbchs_bend_title` |

#### Rules
- Create **EN and VI files together** before wiring into `index.ts` — the i18n check requires parity
- Wire with named imports + spread: `import ssVariant from './tools/steel-sections/<variant>'` then `...ssVariant`
- Do this in **both** `en/index.ts` and `vi/index.ts`
- Run `npm run check` after wiring — must show same key count across all locales

### 5. Tier Gating

Wire tiers at the orchestrator level (`SteelSections.tsx`) using the shared hooks — **never** call `supabase.auth.getUser()` directly in a component:

```tsx
import { useCurrentUser, useToolAccess } from '@/lib/useSubscription'

const { userId, userEmail } = useCurrentUser()
const toolAccess = useToolAccess('steel_sections', userId, userEmail)
// Pass toolAccess to <CapacityPanel toolAccess={toolAccess} />
```

See `TOOL_CONVENTIONS.md §11` for full wiring pattern, `ToolAccess` fields, and required i18n keys (`bb_upgrade_details`, `bb_export_premium` already in `shared.ts`).

---

### 6. Capacity Panel (`<variant>/CapacityPanel.tsx`)

#### Use `CapacityShell` from `_shared/`

The top bar (search, grade pills, export button), Results/Details toggle, and scrollable content wrapper are shared via `CapacityShell`. **Do not duplicate this chrome in new variants.**

```tsx
import { CapacityShell, type CapacityTab } from '../_shared/CapacityShell'

// Inside the CapacityPanel return (after the empty-state guard):
return (
  <>
    <CapacityShell
      searchSlot={<SectionSearch current={row} onSelect={r => setLocalRow(r)} />}
      grade={grade}
      grades={['S275', 'S355']}          // adjust for variant
      onGrade={g => setGrade(g as SteelGrade)}
      gradeLabel={t('<abbrev>_grade_label')}
      tab={tab}
      onTab={setTab}
      tabLabels={{ results: t('<abbrev>_tab_results'), details: t('<abbrev>_tab_details') }}
      exportLabel={`🖨 ${t('<abbrev>_exp_btn')}`}
      onExport={() => setExportOpen(true)}
      headerSlot={<HeaderCard row={row} grade={grade} cs={cs} />}
    >
      {/* tab content — variant-specific */}
      {tab === 'results' && <ResultsContent ... />}
      {tab === 'details' && <DetailsContent ... />}
    </CapacityShell>

    {exportOpen && <VariantExportModal ... onClose={() => setExportOpen(false)} />}
  </>
)
```

- `headerSlot` is rendered inside the scroll area, above the toggle — use it for the blue `HeaderCard`
- `exportLabel`/`onExport` are optional — omit both to hide the export button
- The export modal renders outside `CapacityShell` so it can be a portal/overlay

#### Structure
```
CapacityPanel (default export)
  ├─ state: grade, localRow, tab ('results'|'details'), selC1, selL, selN, selLcomp
  ├─ CapacityShell (from _shared)
  │    ├─ SectionSearch      ← passed via searchSlot
  │    ├─ HeaderCard         ← passed via headerSlot
  │    ├─ [Results] [Details] pill toggle  ← owned by CapacityShell
  │    ├─ tab === 'results'
  │    │    ├─ CrossSection summary box (green)
  │    │    ├─ BendingSection        (table + selector bar)
  │    │    ├─ AxialBendingSection   (table + selector bar)
  │    │    └─ CompressionSection    (table + selector bar)
  │    └─ tab === 'details'
  │         ├─ CrossSectionDetails   (CalcStep derivations)
  │         ├─ BendingSection        showDetails
  │         ├─ AxialBendingSection   showDetails
  │         └─ CompressionSection    showDetails
  └─ ExportModal (rendered outside CapacityShell)
```

#### Results / Details tab — single toggle, not per-section
- One `useState<'results' | 'details'>` in `CapacityPanel`
- Results tab: all tables visible, no CalcStep formulas
- Details tab: `CrossSectionDetails` + each section component with `showDetails` prop

#### Selector bars (in Results tab, per section)
- Rendered below each table inside the section component
- Click any table cell → snaps inputs to that cell's grid values
- Text inputs accept any custom value (not limited to grid points)
- Highlighted column/row in blue (`#bae6fd` cell, `#e0f2fe` header)
- State lives in `CapacityPanel`, passed as `selC1/selL/selN/selLcomp` props + `onSel*` setters
- Point results shown to **2 decimal places** (`r2()`) so small changes from custom input are visible
- Selector bar shows live result: e.g. `→ M_b,Rd = 312.45 kNm`
- Same state feeds Details tab — selecting in Results immediately updates derivation formulas

#### `showDetails` prop pattern
Each section component accepts `showDetails?: boolean`:
- `false` (Results tab): renders table + selector bar only, details `<div>` is skipped
- `true` (Details tab): renders table + selector bar + CalcStep derivations

### 8. Export (Print / Save PDF)

**File:** `<variant>/ExportModal.tsx`

Uses the shared `ExportModal` + `runPrint` from `standards/_lib/print-engine.tsx` — no external PDF library needed.

#### Architecture
- `SteelSectionsExportModal` owns its own `useRef` pairs (results ref + details ref per section group)
- **Ref divs contain only tool-specific content** — no report header or footer. `runPrint` injects all branding/chrome automatically (see below).
- Section components (`BendingSection`, `AxialBendingSection`, `CompressionSection`, `CrossSectionDetails`) must be **exported** from `CapacityPanel.tsx` so the modal can import and render them inside its hidden measurement divs
- The modal receives the current selector values (`selC1`, `selL`, `selN`, `selLcomp`) as props — the PDF always uses the same point the user has chosen in the UI
- `noOp = () => {}` is passed as `onSel*` setters inside the modal (the hidden copies are read-only)

#### Section groups
```ts
const groups: SectionGroup[] = [
  { color: '#1d4ed8', label: t('bbuc_exp_bend_label'),   refs: [bendRef, bendDetRef],  defaultOn: true },
  { color: '#0d9488', label: t('bbuc_exp_axbend_label'), refs: [axRef,   axDetRef],    defaultOn: true },
  { color: '#b45309', label: t('bbuc_exp_comp_label'),   refs: [compRef, compDetRef],  defaultOn: true },
]
```
- `refs[0]` = results (table + selector bar, `showDetails={false}`)
- `refs[1]` = details (table + selector bar + CalcStep derivations, `showDetails`)
- Bending results ref also includes `CrossSectionDetails` above the table

#### i18n keys required (add to `<variant>.ts` in both EN + VI)
```
bbuc_exp_title           — modal title
bbuc_exp_default_report  — default report name in metadata fields
bbuc_exp_bend_label      — group label
bbuc_exp_bend_desc       — results checkbox description
bbuc_exp_bend_detdesc    — details checkbox description
bbuc_exp_axbend_label / _desc / _detdesc
bbuc_exp_comp_label / _desc / _detdesc
bbuc_exp_btn             — button label (shown on the Results/Details toggle row)
```

#### Trigger in CapacityPanel
```tsx
const [exportOpen, setExportOpen] = useState(false)
// Pass to CapacityShell — button appears on the same row as the Results/Details pills:
<CapacityShell
  ...
  exportLabel={`🖨 ${t('bbuc_exp_btn')}`}
  onExport={() => setExportOpen(true)}
>
// Modal rendered outside CapacityShell (sibling, not child):
{exportOpen && <SteelSectionsExportModal ... onClose={() => setExportOpen(false)} />}
```

#### Report header — owned by `runPrint`, consistent across all tools
`runPrint` in `standards/_lib/print-engine.tsx` injects all report chrome automatically:

| Page | Content |
|---|---|
| Page 1 | Blue gradient banner (CivilAxis logo + title) + 3-column meta grid (Project, Report/Subject, Designer, Checker, Approver, Date) |
| Pages 2+ | Slim running header: report name right-aligned |
| All pages | Footer: CivilAxis · copyright · "Generated {date}" |

Empty meta fields render as `—`. No extra work needed in `ExportModal.tsx` — never add a header inside a ref div.

### 6. KaTeX and Subscripts

#### When to use `<Tex>` (KaTeX)
- Inline math in JSX labels, section headings, selector bar output: `<Tex>{'M_{b,Rd}'}</Tex>`
- Inside `CalcStep formula=` strings: always full LaTeX, e.g. `` `M_{b,Rd} = ${nf(pt.MbRd, 2)}\\ \\mathrm{kNm}` ``

#### When to use `<sub>` (plain HTML)
- Column headers in the properties table: `I<sub>y</sub>` — keeps table headers lightweight, no KaTeX overhead
- `COL_LABEL` map uses JSX with `<sub>` for this reason

#### Rules
- Never mix: if a symbol appears in a `CalcStep formula=` string → LaTeX; if in JSX → `<Tex>` or `<sub>`
- Double-escape backslashes in template literals: `\\dfrac`, `\\mathrm`, `\\sqrt`
- For real-number substitution in Details: inject computed values directly into the LaTeX string via template literals

### 7. CalcStep / DetailGroup Pattern

```tsx
<DetailGroup title={t('bbuc_det_ltb_curve_title')}>
  <CalcStep
    label={t('bbuc_det_hb_label')}
    formula={`\\dfrac{h}{b} = \\dfrac{${row.h}}{${row.b}} = ${nf(val, 2)}`}
  />
</DetailGroup>
```

- `DetailGroup` — titled card, groups related steps
- `CalcStep` — `label` (ReactNode or string) + `formula` (LaTeX string rendered by KaTeX)
- Title can include inline `<Tex>`: `title={<><Tex>{'M_{cr}'}</Tex> — {t('bbuc_det_mcr_title')}</>}`
- When showing point derivations: substitute real computed values into the LaTeX string directly

### 9. Mobile Responsiveness

The tool uses a **column-then-row** layout pattern so the mobile dropdown sits above the main content:

```tsx
// Outer: column flex so mobile dropdown stacks above the row
<div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
  {/* Mobile section select — CSS shows/hides via .bb-mobile-cat */}
  <div className="bb-mobile-cat" style={{ display: 'none' }}>
    <select .../>
  </div>

  {/* Inner row: sidebar + right panel */}
  <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
    <SectionSidebar .../>   {/* CSS hides via .bb-sidebar on mobile */}
    <div style={{ flex: 1, ... }}>  {/* right panel always fills remaining width */}
      ...
    </div>
  </div>
</div>
```

#### CSS (already in `app/globals.css` under `@media (max-width: 768px)`)
```css
.bb-sidebar    { display: none !important; }
.bb-mobile-cat { display: block !important; padding: 10px 14px; ... }
.bb-table-wrap { overflow-x: auto !important; }
```

#### Rules
- The outer wrapper must be `flexDirection: 'column'` — never `row` — so the mobile dropdown is above the content row
- The inner wrapper is the `flex` row that holds sidebar + right panel
- Sidebar hides on mobile via `.bb-sidebar` class — no inline `display` override needed
- All capacity tables already have `overflowX: 'auto'` via `.bb-table-wrap` — this makes them scrollable on narrow viewports
- The CapacityPanel top bar uses `flexWrap: 'wrap'` so the grade selector wraps gracefully on narrow screens
- The export button lives on the Results/Details pill row (inside the scroll area), not the top bar — it wraps naturally with the pills

---

## Checks Before Finishing

```bash
npx tsc --noEmit      # zero errors
npm run check         # timestamps + badges + i18n parity (same key count per locale)
```
