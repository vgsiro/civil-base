'use client'
import { Table, TR } from '../../../_lib/ui'
import { TH, TD, TDL } from '../../../_lib/ui-styles'

const EC3_PARTS: {
  code: string
  label: string
  tools: { label: string; section: string; sub: string }[]
  tables: { label: string; section: string; sub: string }[]
}[] = [
  { code: 'EN 1993-1-1',  label: 'General rules and rules for buildings',                    tools: [], tables: [] },
  { code: 'EN 1993-1-2',  label: 'Structural fire design',                                   tools: [], tables: [] },
  { code: 'EN 1993-1-3',  label: 'Cold-formed members and sheeting',                         tools: [], tables: [] },
  { code: 'EN 1993-1-4',  label: 'Stainless steels',                                         tools: [], tables: [] },
  { code: 'EN 1993-1-5',  label: 'Plated structural elements',                               tools: [], tables: [] },
  { code: 'EN 1993-1-6',  label: 'Strength and stability of shell structures',               tools: [], tables: [] },
  { code: 'EN 1993-1-7',  label: 'Plated structures subject to out-of-plane loading',        tools: [], tables: [] },
  { code: 'EN 1993-1-8',  label: 'Design of joints',                                         tools: [], tables: [] },
  { code: 'EN 1993-1-9',  label: 'Fatigue',                                                  tools: [], tables: [] },
  { code: 'EN 1993-1-10', label: 'Material toughness and through-thickness properties',      tools: [], tables: [] },
  { code: 'EN 1993-1-11', label: 'Design of structures with tension components',             tools: [], tables: [] },
  { code: 'EN 1993-1-12', label: 'High strength steels',                                     tools: [], tables: [] },
  { code: 'EN 1993-2',    label: 'Steel bridges',                                            tools: [], tables: [] },
  { code: 'EN 1993-3',    label: 'Towers, masts and chimneys',                               tools: [], tables: [] },
  { code: 'EN 1993-4',    label: 'Silos, tanks and pipelines',                               tools: [], tables: [] },
  { code: 'EN 1993-5',    label: 'Piling',                                                   tools: [], tables: [] },
  { code: 'EN 1993-6',    label: 'Crane supporting structures',                              tools: [], tables: [] },
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

export default function Ec3Overview({ onNavTo }: {
  onNavTo: (params: Record<string, string>) => void
}) {
  function navigate(sub: string, section: string) {
    onNavTo({ sub, section })
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>EN 1993 — Design of Steel Structures</div>
        <div style={{ fontSize: 12, color: '#1e293b' }}>Parts and scope of Eurocode 3</div>
      </div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...TH, textAlign: 'left', minWidth: 160 }}>Standard</th>
            <th style={{ ...TH, textAlign: 'left' }}>Title</th>
            <th style={{ ...TH, textAlign: 'left', minWidth: 160 }}>Reference Tools</th>
            <th style={{ ...TH, textAlign: 'left', minWidth: 150 }}>Reference Table</th>
          </tr>
        </thead>
        <tbody>
          {EC3_PARTS.map((p, i) => (
            <TR key={p.code} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', whiteSpace: 'nowrap' as const }}>{p.code}</td>
              <td style={TDL}>{p.label}</td>
              <td style={{ ...TD, verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                  {p.tools.length > 0
                    ? p.tools.map(tool => (
                        <NavChip
                          key={tool.label}
                          label={tool.label}
                          accent="#8b5cf6"
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
