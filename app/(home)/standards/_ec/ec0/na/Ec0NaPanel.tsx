'use client'
import NaPanel, { NaCountry } from '../../_shared/NaPanel'

// ── EC0 National Annex — add countries and sections here ──────────────────────
// To add a country: push a new entry to NA_COUNTRIES
// To add a section: push to sections[] inside the country
// To add table items: push to items[] inside the section
const NA_COUNTRIES: NaCountry[] = [
  {
    id: 'sg', name: 'Singapore', prefix: 'SS EN',
    sections: [
      { id: 'sg-ec0', code: 'SS EN 1990', label: 'Basis of structural design', items: [] },
    ],
  },
]

export default function Ec0NaPanel({ section, pageKey, onNavChange }: {
  section: string
  pageKey: string
  onNavChange: (key: string, val: string) => void
}) {
  return (
    <NaPanel
      countries={NA_COUNTRIES}
      accentColor="#6366f1"
      accentBg="#eef2ff"
      accentHover="#a5b4fc"
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    />
  )
}
