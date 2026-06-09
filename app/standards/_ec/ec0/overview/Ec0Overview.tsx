'use client'
import { Table, TR } from '../../../_lib/ui'
import { TH, TD, TDL } from '../../../_lib/ui-styles'

const EC0_PARTS: {
  code: string
  label: string
  tools: { label: string; section: string; sub: string }[]
  tables: { label: string; section: string; sub: string }[]
}[] = [
  {
    code: 'EN 1990',
    label: 'Basis of structural design — general principles, reliability, load combinations',
    tools: [{ label: 'Load Combinations', section: 'load', sub: 'reference' }],
    tables: [
      { label: 'Table A1.1 ψ Factors', section: 'psi_factors', sub: 'tables' },
    ],
  },
  {
    code: 'EN 1990 Annex A1',
    label: 'Application for buildings',
    tools: [{ label: 'Load Combinations', section: 'load', sub: 'reference' }],
    tables: [
      { label: 'Table A1.2(B) Partial Factors', section: 'partial_factors', sub: 'tables' },
    ],
  },
  {
    code: 'EN 1990 Annex A2',
    label: 'Application for bridges',
    tools: [],
    tables: [],
  },
]

function NavChip({ label, accent, onClick }: { label: string; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 6, border: `1px solid ${accent}40`,
        background: `${accent}12`, color: accent,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap' as const, transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = `${accent}24`)}
      onMouseLeave={e => (e.currentTarget.style.background = `${accent}12`)}
    >
      {label} ›
    </button>
  )
}

export default function Ec0Overview({ onNavTo }: {
  onNavTo: (params: Record<string, string>) => void
}) {
  function navigate(sub: string, section: string) {
    onNavTo({ sub, section })
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>EN 1990 — Basis of Structural Design</div>
        <div style={{ fontSize: 12, color: '#1e293b' }}>Reliability framework, partial factors, and load combinations for Eurocode</div>
      </div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...TH, textAlign: 'left', minWidth: 170 }}>Standard</th>
            <th style={{ ...TH, textAlign: 'left' }}>Title</th>
            <th style={{ ...TH, textAlign: 'left', minWidth: 160 }}>Reference Tools</th>
            <th style={{ ...TH, textAlign: 'left', minWidth: 150 }}>Reference Table</th>
          </tr>
        </thead>
        <tbody>
          {EC0_PARTS.map((p, i) => (
            <TR key={p.code} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#6366f1', whiteSpace: 'nowrap' as const }}>{p.code}</td>
              <td style={TDL}>{p.label}</td>
              <td style={{ ...TD, verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                  {p.tools.length > 0
                    ? p.tools.map(tool => (
                        <NavChip
                          key={tool.label}
                          label={tool.label}
                          accent="#6366f1"
                          onClick={() => navigate(tool.sub, tool.section)}
                        />
                      ))
                    : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                </div>
              </td>
              <td style={{ ...TD, verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                  {p.tables.length > 0
                    ? p.tables.map(tbl => (
                        <NavChip
                          key={tbl.label}
                          label={tbl.label}
                          accent="#8b5cf6"
                          onClick={() => navigate(tbl.sub, tbl.section)}
                        />
                      ))
                    : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                </div>
              </td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
