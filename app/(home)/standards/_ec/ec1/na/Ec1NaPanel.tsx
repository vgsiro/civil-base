'use client'
import NaPanel, { NaCountry } from '../../_shared/NaPanel'

// ── EC1 National Annex — add countries and sections here ──────────────────────
// To add a country: push a new entry to NA_COUNTRIES
// To add a section: push to sections[] inside the country
// To add table items: push to items[] inside the section
const NA_COUNTRIES: NaCountry[] = [
  {
    id: 'sg', name: 'Singapore', prefix: 'SS EN',
    sections: [
      { id: 'sg-ec1-1-1', code: 'SS EN 1991-1-1', label: 'Densities, self-weight, imposed loads', items: [] },
      { id: 'sg-ec1-1-4', code: 'SS EN 1991-1-4', label: 'Wind actions', items: [] },
    ],
  },
]

export default function Ec1NaPanel({ section, pageKey, onNavChange }: {
  section: string
  pageKey: string
  onNavChange: (key: string, val: string) => void
}) {
  return (
    <NaPanel
      countries={NA_COUNTRIES}
      accentColor="#0ea5e9"
      accentBg="#f0f9ff"
      accentHover="#7dd3fc"
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    />
  )
}
