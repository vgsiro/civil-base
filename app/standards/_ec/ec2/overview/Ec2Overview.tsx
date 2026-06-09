'use client'
import { Table, TR } from '../../../_lib/ui'
import { TH, TD, TDL } from '../../../_lib/ui-styles'

const EC2_PARTS: {
  code: string
  label: string
  tools: { label: string; section: string; sub: string }[]
  tables: { label: string; section: string; sub: string }[]
}[] = [
  {
    code: 'EN 1992-1-1',
    label: 'General rules and rules for buildings',
    tools: [],
    tables: [
      { label: 'Concrete Properties', section: 'concrete_props', sub: 'tables' },
      { label: 'Anchorage & Lap',     section: 'anchorage',      sub: 'tables' },
      { label: 'Rebar Quantity',      section: 'rebar_qty',      sub: 'tables' },
    ],
  },
  { code: 'EN 1992-1-2', label: 'Structural fire design',                        tools: [], tables: [] },
  { code: 'EN 1992-2',   label: 'Concrete bridges — design and detailing rules', tools: [], tables: [] },
  { code: 'EN 1992-3',   label: 'Liquid retaining and containment structures',   tools: [], tables: [] },
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

export default function Ec2Overview({ onNavTo }: {
  onNavTo: (params: Record<string, string>) => void
}) {
  function navigate(sub: string, section: string) {
    onNavTo({ sub, section })
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>EN 1992 — Design of Concrete Structures</div>
        <div style={{ fontSize: 12, color: '#1e293b' }}>Parts and scope of Eurocode 2</div>
      </div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...TH, textAlign: 'left', minWidth: 150 }}>Standard</th>
            <th style={{ ...TH, textAlign: 'left' }}>Title</th>
            <th style={{ ...TH, textAlign: 'left', minWidth: 160 }}>Reference Tools</th>
            <th style={{ ...TH, textAlign: 'left', minWidth: 150 }}>Reference Table</th>
          </tr>
        </thead>
        <tbody>
          {EC2_PARTS.map((p, i) => (
            <TR key={p.code} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' as const }}>{p.code}</td>
              <td style={TDL}>{p.label}</td>
              <td style={{ ...TD, verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                  {p.tools.length > 0
                    ? p.tools.map(tool => (
                        <NavChip
                          key={tool.label}
                          label={tool.label}
                          accent="#10b981"
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
