'use client'
import NaPanel, { NaCountry } from '../../_shared/NaPanel'

// ── EC2 National Annex — add countries and sections here ──────────────────────
// To add a country: push a new entry to NA_COUNTRIES
// To add a section: push to sections[] inside the country
// To add table items: push to items[] inside the section
const NA_COUNTRIES: NaCountry[] = [
  {
    id: 'sg', name: 'Singapore', prefix: 'SS EN',
    sections: [
      { id: 'sg-ec2-1-1', code: 'SS EN 1992-1-1', label: 'Design of concrete structures', items: [] },
    ],
  },
]

export default function Ec2NaPanel({ section, pageKey, onNavChange }: {
  section: string
  pageKey: string
  onNavChange: (key: string, val: string) => void
}) {
  return (
    <NaPanel
      countries={NA_COUNTRIES}
      accentColor="#10b981"
      accentBg="#ecfdf5"
      accentHover="#6ee7b7"
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    />
  )
}
