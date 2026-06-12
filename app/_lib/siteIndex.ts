// ── Site-wide search index ────────────────────────────────────────────────────
// Add entries here when new tools/pages/sections are built.
// Each entry is instantly searchable by all users (no auth required).

export interface SiteEntry {
  id: string
  title: string
  description: string       // short text shown in search result
  tags: string[]            // keywords that trigger this result
  route: string             // URL to navigate to
  section?: string          // highlight target (e.g. sidebar section id)
  category: string          // shown as the badge label
  categoryColor: string     // badge accent colour
}

const SITE_INDEX: SiteEntry[] = [
  // ── Bolt Design Data page ─────────────────────────────────────────────────
  {
    id: 'bolt-summary',
    title: 'Bolt Summary',
    description: 'Select a bolt size and grade to see all properties at a glance',
    tags: ['bolt', 'summary', 'design check', 'bolt check', 'check'],
    route: '/bolt-data',
    section: 'summary',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-strength',
    title: 'Bolt Strength Classes',
    description: 'fyb and fub for grades 4.6, 4.8, 5.6, 5.8, 6.8, 8.8, 10.9',
    tags: ['bolt', 'strength', 'grade', 'fyb', 'fub', 'yield', 'ultimate', 'class', '8.8', '10.9'],
    route: '/bolt-data',
    section: 'material',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-dimensions',
    title: 'Bolt Dimensions & Areas',
    description: 'Nominal diameter, gross area Ag, stress area As, width across flats',
    tags: ['bolt', 'dimension', 'area', 'diameter', 'ag', 'as', 'stress area', 'gross area', 'm12', 'm16', 'm20', 'm24'],
    route: '/bolt-data',
    section: 'dimensions',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-tension',
    title: 'Tensile Resistance Ft,Rd',
    description: 'Tension resistance in kN for all bolt sizes and grades',
    tags: ['bolt', 'tension', 'tensile', 'ft', 'ft,rd', 'ftrd', 'resistance'],
    route: '/bolt-data',
    section: 'tension',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-shear',
    title: 'Shear Resistance Fv,Rd',
    description: 'Shear resistance per shear plane for all bolt sizes and grades',
    tags: ['bolt', 'shear', 'fv', 'fv,rd', 'fvrd', 'resistance', 'single shear', 'double shear'],
    route: '/bolt-data',
    section: 'shear',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-bearing',
    title: 'Bearing Resistance Fb,Rd',
    description: 'Bearing resistance per mm plate thickness for S235, S275, S355',
    tags: ['bolt', 'bearing', 'fb', 'fb,rd', 'fbrd', 'resistance', 's235', 's275', 's355'],
    route: '/bolt-data',
    section: 'bearing',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-holes',
    title: 'Hole Dimensions',
    description: 'Clearance hole sizes: normal, oversize, short slotted, long slotted',
    tags: ['bolt', 'hole', 'clearance', 'd0', 'oversize', 'slotted', 'short slot', 'long slot'],
    route: '/bolt-data',
    section: 'holes',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-edge',
    title: 'Edge & End Distance',
    description: 'Minimum and maximum edge/end distances e1, e2, p1, p2 per EN 1993-1-8',
    tags: ['bolt', 'edge', 'end', 'distance', 'spacing', 'e1', 'e2', 'p1', 'p2', 'minimum', 'maximum', 'en1993'],
    route: '/bolt-data',
    section: 'edge',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
  {
    id: 'bolt-formulas',
    title: 'Bolt Design Formulas',
    description: 'EN 1993-1-8 design equations for tension, shear, bearing, interaction',
    tags: ['bolt', 'formula', 'equation', 'design', 'en1993', 'interaction', 'punching', 'eurocode'],
    route: '/bolt-data',
    section: 'formulas',
    category: 'Bolt Data',
    categoryColor: '#f59e0b',
  },
]

export function searchSiteIndex(query: string): SiteEntry[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return SITE_INDEX.filter(entry =>
    entry.title.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q) ||
    entry.tags.some(t => t.includes(q) || q.includes(t))
  ).slice(0, 8)
}

export default SITE_INDEX
