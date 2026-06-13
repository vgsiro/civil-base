import React from 'react'

export interface ToolCard {
  id: string
  label: string
  desc: string
  accent: string
  gradient: string
  ref: string
  graphic: React.ReactNode
  /** Direct href. If omitted, the group's `hrefFn` is used to compute it. */
  href?: string
}

export interface ToolCategory {
  label: string
  accentColor: string
  accentBg: string
}

export interface ToolGroup {
  /** Unique key — used as the ?tab= param for EC tools, or a slug for others */
  tab: string
  /** Display label for the group header */
  label: string
  /** Badge shown on each card in this group */
  part: string
  desc: string
  category: ToolCategory
  /**
   * How to build the href for a card. EC tools go to the standards page;
   * standalone pages supply href directly on the card instead.
   */
  hrefFn?: (cardId: string) => string
  cards: ToolCard[]
}

// ── Categories ────────────────────────────────────────────────────────────────

export const CATEGORIES: Record<string, ToolCategory> = {
  eurocode: { label: 'Eurocode',     accentColor: '#6366f1', accentBg: '#eef2ff' },
  general:  { label: 'General',      accentColor: '#f97316', accentBg: '#fff7ed' },
  sci:      { label: 'SCI P363',     accentColor: '#0369a1', accentBg: '#e0f2fe' },
  // Add new categories here — e.g.:
  // tcvn: { label: 'TCVN', accentColor: '#10b981', accentBg: '#ecfdf5' },
}

// ── All tool groups — add new groups here as tools are built ──────────────────

export const ALL_TOOL_GROUPS: ToolGroup[] = [
  {
    tab: 'ec0',
    label: 'EC0 — Basis of Design',
    part: 'EN 1990',
    desc: 'Basis of design — load combinations',
    category: CATEGORIES.eurocode,
    hrefFn: id => `/standards?tab=ec0&sub=reference&section=${id}`,
    cards: [
      {
        id: 'combo_gen',
        label: 'Combination Generator',
        desc: 'Generate EN 1990 ULS/SLS combinations · STAAD output',
        accent:   '#6366f1',
        gradient: 'linear-gradient(135deg, #3730a3, #6366f1)',
        ref:      'EN 1990',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 80 55" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8"  y="8"  width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
            <text x="17" y="15" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">ULS</text>
            <line x1="26" y1="12" x2="36" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="36" y="8"  width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="50" y1="12" x2="60" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="60" y="8"  width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <rect x="8"  y="22" width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
            <text x="17" y="29" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">SLS</text>
            <line x1="26" y1="26" x2="36" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="36" y="22" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="50" y1="26" x2="60" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="60" y="22" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="40" y1="38" x2="40" y2="46" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round"/>
            <polygon points="40,48 36,44 44,44" fill="rgba(255,255,255,0.8)"/>
          </svg>
        ),
      },
    ],
  },
  {
    tab: 'ec1',
    label: 'EC1 — Actions on Structures',
    part: 'EN 1991-1-4',
    desc: 'Wind actions',
    category: CATEGORIES.eurocode,
    hrefFn: id => `/standards?tab=ec1&sub=reference&section=${id}`,
    cards: [
      {
        id: 'wind',
        label: 'Wind Load Calculator',
        desc: 'q_p · walls · roofs · canopies · cylinders · signboards',
        accent:   '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
        ref:      'EN 1991-1-4',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="54" y="10" width="28" height="44" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.85)" strokeWidth="2"/>
            <line x1="8" y1="21" x2="44" y2="21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="50,21 42,16 42,26" fill="rgba(255,255,255,0.9)"/>
            <line x1="8" y1="33" x2="44" y2="33" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="50,33 42,28 42,38" fill="rgba(255,255,255,0.65)"/>
            <line x1="8" y1="45" x2="44" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="50,45 42,40 42,50" fill="rgba(255,255,255,0.4)"/>
            <text x="68" y="36" fontSize="9" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">q<tspan fontSize="7" dy="2">p</tspan></text>
          </svg>
        ),
      },
    ],
  },
  {
    tab: 'ec2',
    label: 'EC2 — Concrete Structures',
    part: 'EN 1992-1-1',
    desc: 'Design of concrete structures — General rules',
    category: CATEGORIES.eurocode,
    hrefFn: id => `/standards?tab=ec2&sub=reference&section=${id}`,
    cards: [
      {
        id: 'rect_section',
        label: 'Rectangular RC Section Check',
        desc: 'ULS bending/axial · shear & torsion · SLS crack width',
        accent:   '#10b981',
        gradient: 'linear-gradient(135deg, #047857, #10b981)',
        ref:      'EN 1992-1-1 §6.1',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="52" height="36" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
            {[12, 21, 30, 39, 48].map(cx => <circle key={cx} cx={cx} cy="12" r="3.2" fill="rgba(255,255,255,0.9)" />)}
            {[12, 21, 30, 39, 48].map(cx => <circle key={cx} cx={cx} cy="32" r="3.2" fill="rgba(255,255,255,0.9)" />)}
            <line x1="6" y1="22" x2="54" y2="22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
          </svg>
        ),
      },
    ],
  },
  {
    tab: 'ec3',
    label: 'EC3 — Steel Structures',
    part: 'EN 1993-1-8',
    desc: 'Design of joints',
    category: CATEGORIES.eurocode,
    hrefFn: id => `/standards?tab=ec3&sub=reference&section=${id}`,
    cards: [
      {
        id: 'bolt_data',
        label: 'Bolt Design Data',
        desc: 'Strength classes, shear/tension/bearing resistance, edge distances',
        accent:   '#8b5cf6',
        gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
        ref:      'EN 1993-1-8 §3',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="38" y="10" width="14" height="45" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
            <rect x="30" y="6" width="30" height="10" rx="2" fill="rgba(255,255,255,0.85)"/>
            <rect x="30" y="49" width="30" height="10" rx="2" fill="rgba(255,255,255,0.85)"/>
            <rect x="12" y="20" width="66" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
            <rect x="12" y="35" width="66" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
          </svg>
        ),
      },
    ],
  },
  {
    tab: 'bluebook',
    label: 'Blue Book — Steel Sections',
    part: 'SCI P363',
    desc: 'Section properties · BS EN 10365:2017',
    category: CATEGORIES.general,
    cards: [
      {
        id: 'steel-sections',
        href: '/tools/steel-sections',
        label: 'Steel Section Properties',
        desc: 'UB · UC · dimensions, inertia, section moduli · BS EN 10365:2017',
        accent:   '#0369a1',
        gradient: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
        ref:      'SCI P363',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* I-section outline */}
            <rect x="22" y="8"  width="46" height="9" rx="1.5" fill="rgba(255,255,255,0.85)"/>
            <rect x="38" y="17" width="14" height="23" rx="1" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
            <rect x="22" y="40" width="46" height="9" rx="1.5" fill="rgba(255,255,255,0.85)"/>
            <line x1="10" y1="12" x2="20" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <line x1="10" y1="44" x2="20" y2="44" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <line x1="11" y1="12" x2="11" y2="44" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <text x="6" y="30" fontSize="7" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">h</text>
            <line x1="72" y1="5"  x2="72" y2="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="22" y1="5"  x2="68" y2="5"  stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <text x="45" y="4" fontSize="7" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">b</text>
          </svg>
        ),
      },
    ],
  },
  {
    tab: 'general',
    label: 'General Tools',
    part: 'GENERAL',
    desc: 'Code-agnostic utilities',
    category: CATEGORIES.general,
    cards: [
      {
        id: 'unit-converter',
        href: '/tools/general-tools/unit-converter',
        label: 'Unit Converter',
        desc: 'Length · Area · Force · Pressure · Moment · Mass · Temperature · Angle',
        accent:   '#f97316',
        gradient: 'linear-gradient(135deg, #c2410c, #f97316)',
        ref:      'GENERAL TOOLS',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="14" width="32" height="12" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
            <text x="24" y="23" fontSize="8" fill="rgba(255,255,255,0.95)" fontWeight="700" textAnchor="middle">kN·m</text>
            <line x1="42" y1="20" x2="50" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="2 2"/>
            <polygon points="52,20 48,17 48,23" fill="rgba(255,255,255,0.6)"/>
            <line x1="52" y1="20" x2="58" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
            <rect x="58" y="14" width="24" height="12" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
            <text x="70" y="23" fontSize="8" fill="rgba(255,255,255,0.95)" fontWeight="700" textAnchor="middle">kip·ft</text>
            <rect x="8" y="34" width="32" height="12" rx="2" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            <text x="24" y="43" fontSize="8" fill="rgba(255,255,255,0.7)" fontWeight="600" textAnchor="middle">MPa</text>
            <line x1="42" y1="40" x2="58" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="58" y="34" width="24" height="12" rx="2" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            <text x="70" y="43" fontSize="8" fill="rgba(255,255,255,0.7)" fontWeight="600" textAnchor="middle">psi</text>
          </svg>
        ),
      },
    ],
  },
]

// ── Derived flat list — used for home page search ─────────────────────────────

export interface FlatTool {
  key: string
  href: string
  card: ToolCard
  group: ToolGroup
}

export function getAllFlatTools(): FlatTool[] {
  return ALL_TOOL_GROUPS.flatMap(group =>
    group.cards.map(card => ({
      key: `${group.tab}-${card.id}`,
      href: card.href ?? group.hrefFn?.(card.id) ?? '#',
      card,
      group,
    }))
  )
}

// Legacy export — tools/page.tsx uses GENERAL_TOOLS shape for its own rendering
export const GENERAL_TOOLS = ALL_TOOL_GROUPS
  .filter(g => g.tab === 'general')
  .flatMap(g => g.cards.map(card => ({
    id: card.id,
    href: card.href ?? '#',
    label: card.label,
    desc: card.desc,
    ref: card.ref,
    accent: card.accent,
    gradient: card.gradient,
    graphic: card.graphic,
  })))
