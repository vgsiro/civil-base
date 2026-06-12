'use client'
import NaPanel, { NaCountry } from '../../_shared/NaPanel'

// ── EC3 National Annex — add countries and sections here ──────────────────────
// To add a country: push a new entry to NA_COUNTRIES
// To add a section: push to sections[] inside the country
// To add table items: push to items[] inside the section
const NA_COUNTRIES: NaCountry[] = [
  {
    id: 'sg', name: 'Singapore', prefix: 'SS EN',
    sections: [
      { id: 'sg-ec3-1-1', code: 'SS EN 1993-1-1', label: 'General rules and rules for buildings', items: [] },
    ],
  },
]

export default function Ec3NaPanel({ section, pageKey, onNavChange }: {
  section: string
  pageKey: string
  onNavChange: (key: string, val: string) => void
}) {
  return (
    <NaPanel
      countries={NA_COUNTRIES}
      accentColor="#8b5cf6"
      accentBg="#f5f3ff"
      accentHover="#c4b5fd"
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    />
  )
}
