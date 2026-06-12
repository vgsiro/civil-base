'use client'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import WindQp from './tools/WindQp'
import WindWalls from './tools/WindWalls'
import WindFlat from './tools/WindFlat'
import WindMono from './tools/WindMono'
import WindDuo from './tools/WindDuo'
import { WindCanopyMono, WindCanopyDuo } from './tools/WindCanopy'
import WindFreewall from './tools/WindFreewall'
import { WindRect, WindCylinder } from './tools/WindRectCyl'
import WindSign from './tools/WindSign'

const CDN = 'https://cdn.eurocodeapplied.com/images/thumbnails'

function WindToolNav({ tool, setTool, tools, groups, groupShort }: {
  tool: string; setTool: (id: string) => void
  tools: { id: string; label: string; group: string }[]
  groups: string[]
  groupShort: Record<string, string>
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={navRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {groups.map(group => {
        const items = tools.filter(t => t.group === group)
        const isActive = items.some(t => t.id === tool)
        const isOpen = openGroup === group
        return (
          <div key={group} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenGroup(isOpen ? null : group)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1d4ed8' : '#374151',
                background: isActive ? '#eff6ff' : isOpen ? '#f1f5f9' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? '#93c5fd' : isOpen ? '#cbd5e1' : '#e2e8f0',
                borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {groupShort[group]}
              <span style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 220, overflow: 'hidden',
              }}>
                {items.map(t => (
                  <button key={t.id}
                    onClick={() => { setTool(t.id); setOpenGroup(null) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', fontSize: 12,
                      fontWeight: tool === t.id ? 700 : 400,
                      color: tool === t.id ? '#1d4ed8' : '#1e293b',
                      background: tool === t.id ? '#eff6ff' : 'transparent',
                      border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (tool !== t.id) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (tool !== t.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function WindCalc({ calc, onNavChange }: { calc: string; onNavChange: (key: string, val: string) => void }) {
  const { t } = useTranslation()
  const tool = calc
  const setTool = (id: string) => onNavChange('calc', id)

  const TOOLS = [
    { id: 'qp', label: t('std_wind_tool_qp_label'), thumb: `${CDN}/wind-peak-velocity-pressure-thumbnail.png`, desc: t('std_wind_tool_qp_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 4', group: t('std_wind_group_velocity') },
    { id: 'walls', label: t('std_wind_tool_walls_label'), thumb: `${CDN}/wind-pressure-side-walls-thumbnail.png`, desc: t('std_wind_tool_walls_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.2.2', group: t('std_wind_group_walls') },
    { id: 'freewall', label: t('std_wind_tool_freewall_label'), thumb: `${CDN}/wind-pressure-freestanding-wall-thumbnail.png`, desc: t('std_wind_tool_freewall_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.4.1', group: t('std_wind_group_walls') },
    { id: 'flat', label: t('std_wind_tool_flat_label'), thumb: `${CDN}/wind-pressure-flat-roof-thumbnail.png`, desc: t('std_wind_tool_flat_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.2.3', group: t('std_wind_group_roofs') },
    { id: 'mono', label: t('std_wind_tool_mono_label'), thumb: `${CDN}/wind-pressure-monopitch-roof-thumbnail.png`, desc: t('std_wind_tool_mono_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.2.4', group: t('std_wind_group_roofs') },
    { id: 'duo', label: t('std_wind_tool_duo_label'), thumb: `${CDN}/wind-pressure-duopitch-roof-thumbnail.png`, desc: t('std_wind_tool_duo_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.2.5', group: t('std_wind_group_roofs') },
    { id: 'canopy_m', label: t('std_wind_tool_canopy_m_label'), thumb: `${CDN}/wind-pressure-monopitch-canopy-thumbnail.png`, desc: t('std_wind_tool_canopy_m_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.3', group: t('std_wind_group_canopies') },
    { id: 'canopy_d', label: t('std_wind_tool_canopy_d_label'), thumb: `${CDN}/wind-pressure-duopitch-canopy-thumbnail.png`, desc: t('std_wind_tool_canopy_d_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.3', group: t('std_wind_group_canopies') },
    { id: 'rect', label: t('std_wind_tool_rect_label'), thumb: `${CDN}/wind-force-rectangular-thumbnail.png`, desc: t('std_wind_tool_rect_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.6', group: t('std_wind_group_force') },
    { id: 'cylinder', label: t('std_wind_tool_cylinder_label'), thumb: `${CDN}/wind-force-cylinder-thumbnail.png`, desc: t('std_wind_tool_cylinder_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.9', group: t('std_wind_group_force') },
    { id: 'signboard', label: t('std_wind_tool_signboard_label'), thumb: `${CDN}/wind-signboard-thumbnail.png`, desc: t('std_wind_tool_signboard_desc'), ref: 'EN 1991-1-4:2005+A1:2010 Section 7.4.3', group: t('std_wind_group_force') },
  ]

  const GROUPS = [t('std_wind_group_velocity'), t('std_wind_group_walls'), t('std_wind_group_roofs'), t('std_wind_group_canopies'), t('std_wind_group_force')]

  const GROUP_SHORT: Record<string, string> = {
    [t('std_wind_group_velocity')]: t('std_wind_nav_velocity'),
    [t('std_wind_group_walls')]: t('std_wind_nav_walls'),
    [t('std_wind_group_roofs')]: t('std_wind_nav_roofs'),
    [t('std_wind_group_canopies')]: t('std_wind_nav_canopies'),
    [t('std_wind_group_force')]: t('std_wind_nav_force'),
  }

  // Defaults match eurocodeapplied.com reference inputs for easy cross-checking
  const [vb, setVb] = useState(27); const [cat, setCat] = useState('II')
  const [z, setZ] = useState(6); const [c0, setC0] = useState(1.0); const [rho, setRho] = useState(1.25)
  // Walls: d=10, b=20, h=5 (from eurocodeapplied side walls defaults)
  const [wD, setWD] = useState(10); const [wB, setWB] = useState(20); const [wH, setWH] = useState(5)
  const [cpiMin, setCpiMin] = useState(-0.3); const [cpiMax, setCpiMax] = useState(0.2)
  // Flat roof: d=10, b=20, h=5, hp=0
  const [rD, setRD] = useState(10); const [rB, setRB] = useState(20); const [rH, setRH] = useState(5); const [rHp, setRHp] = useState(0)
  const [alpha, setAlpha] = useState(20); const [windDir, setWindDir] = useState('0')
  // Canopy: d=15, b=10, h=5
  const [cD, setCD] = useState(10); const [cB, setCB] = useState(20); const [cH, setCH] = useState(5)
  const [canopyAlpha, setCanopyAlpha] = useState(0); const [phi, setPhi] = useState(0)
  const [cscd, setCscd] = useState(1.0)
  // Freewall: L=10, H=2, Hbase=0, corner=0
  const [fwL, setFwL] = useState(10); const [fwH, setFwH] = useState(2)
  const [fwHbase, setFwHbase] = useState(0); const [fwCorner, setFwCorner] = useState(0)
  const [fwSolid, setFwSolid] = useState(1.0)
  // Rect section: d=0.5, b=0.3, L=6
  const [elD, setElD] = useState(0.5); const [elB, setElB] = useState(0.3)
  const [elL, setElL] = useState(6); const [elR, setElR] = useState(0); const [elCscd, setElCscd] = useState(1.0)
  // Cylinder: diam=0.5, L=6, smooth
  const [cylDiam, setCylDiam] = useState(0.5); const [cylL, setCylL] = useState(6)
  const [cylSurf, setCylSurf] = useState('smooth'); const [cylCscd, setCylCscd] = useState(1.0)
  // Signboard: w=3, h=1.5, zg=2
  const [sgW, setSgW] = useState(25); const [sgH, setSgH] = useState(4)
  const [sgZg, setSgZg] = useState(6); const [sgCscd, setSgCscd] = useState(1.0)
  const [sgEcc, setSgEcc] = useState(0.25)

  if (!tool) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{t('std_wind_title')}</h2>
          <p style={{ fontSize: 12, color: '#1e293b', margin: 0 }}>{t('std_wind_sub')}</p>
        </div>
        {GROUPS.map(group => {
          const cards = TOOLS.filter(tool => tool.group === group)
          return (
            <div key={group}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map(card => (
                  <button key={card.id} onClick={() => setTool(card.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e0f2fe')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}>
                    <img src={card.thumb} alt={card.label}
                      style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 5, flexShrink: 0, border: '1px solid #e2e8f0', background: '#fff' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{card.label}</div>
                      <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.5, marginBottom: 4 }}>{card.desc}</div>
                      <div style={{ fontSize: 10, color: '#1e293b' }}><span style={{ fontWeight: 600 }}>{t('std_wind_according_to')}</span> {card.ref}</div>
                    </div>
                    <span style={{ fontSize: 18, color: '#1e293b', flexShrink: 0 }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const currentTool = TOOLS.find(tool => tool.id === calc)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* breadcrumb / back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onNavChange('section', 'tools')}
          style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          ‹ EN 1991-1-4
        </button>
        <span style={{ fontSize: 12, color: '#cbd5e1' }}>›</span>
        <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 600 }}>{currentTool?.label}</span>
      </div>

      {/* grouped dropdown nav */}
      <WindToolNav tool={tool} setTool={setTool} tools={TOOLS} groups={GROUPS} groupShort={GROUP_SHORT} />

      {tool === 'qp' && <WindQp vb={vb} setVb={setVb} cat={cat} setCat={setCat} z={z} setZ={setZ} c0={c0} setC0={setC0} rho={rho} setRho={setRho} />}
      {tool === 'walls' && <WindWalls vb={vb} setVb={setVb} cat={cat} setCat={setCat} c0={c0} setC0={setC0} rho={rho} setRho={setRho} wD={wD} setWD={setWD} wB={wB} setWB={setWB} wH={wH} setWH={setWH} cpiMin={cpiMin} setCpiMin={setCpiMin} cpiMax={cpiMax} setCpiMax={setCpiMax} />}
      {tool === 'flat' && <WindFlat vb={vb} setVb={setVb} cat={cat} setCat={setCat} c0={c0} setC0={setC0} rho={rho} setRho={setRho} rD={rD} setRD={setRD} rB={rB} setRB={setRB} rH={rH} setRH={setRH} rHp={rHp} setRHp={setRHp} cpiMin={cpiMin} setCpiMin={setCpiMin} cpiMax={cpiMax} setCpiMax={setCpiMax} />}
      {tool === 'mono' && <WindMono vb={vb} setVb={setVb} cat={cat} setCat={setCat} c0={c0} setC0={setC0} rho={rho} setRho={setRho} mD={wD} setMD={setWD} mB={wB} setMB={setWB} mH={wH} setMH={setWH} alpha={alpha} setAlpha={setAlpha} cpiMin={cpiMin} setCpiMin={setCpiMin} cpiMax={cpiMax} setCpiMax={setCpiMax} />}
      {tool === 'duo' && <WindDuo vb={vb} setVb={setVb} cat={cat} setCat={setCat} c0={c0} setC0={setC0} rho={rho} setRho={setRho} mD={wD} setMD={setWD} mB={wB} setMB={setWB} mH={wH} setMH={setWH} alpha={alpha} setAlpha={setAlpha} cpiMin={cpiMin} setCpiMin={setCpiMin} cpiMax={cpiMax} setCpiMax={setCpiMax} />}
      {tool === 'canopy_m' && <WindCanopyMono vb={vb} setVb={setVb} cat={cat} setCat={setCat} cH={cH} setCH={setCH} c0={c0} setC0={setC0} rho={rho} setRho={setRho} canopyAlpha={canopyAlpha} setCanopyAlpha={setCanopyAlpha} cD={cD} setCD={setCD} cB={cB} setCB={setCB} phi={phi} setPhi={setPhi} cscd={cscd} setCscd={setCscd} />}
      {tool === 'canopy_d' && <WindCanopyDuo vb={vb} setVb={setVb} cat={cat} setCat={setCat} cH={cH} setCH={setCH} c0={c0} setC0={setC0} rho={rho} setRho={setRho} canopyAlpha={canopyAlpha} setCanopyAlpha={setCanopyAlpha} cD={cD} setCD={setCD} cB={cB} setCB={setCB} phi={phi} setPhi={setPhi} cscd={cscd} setCscd={setCscd} />}
      {tool === 'freewall' && <WindFreewall vb={vb} setVb={setVb} cat={cat} setCat={setCat} c0={c0} setC0={setC0} rho={rho} setRho={setRho} fwL={fwL} setFwL={setFwL} fwH={fwH} setFwH={setFwH} fwHbase={fwHbase} setFwHbase={setFwHbase} fwCorner={fwCorner} setFwCorner={setFwCorner} fwSolid={fwSolid} setFwSolid={setFwSolid} />}
      {tool === 'rect' && <WindRect vb={vb} setVb={setVb} cat={cat} setCat={setCat} z={z} setZ={setZ} c0={c0} setC0={setC0} rho={rho} setRho={setRho} elD={elD} setElD={setElD} elB={elB} setElB={setElB} elL={elL} setElL={setElL} elR={elR} setElR={setElR} elCscd={elCscd} setElCscd={setElCscd} />}
      {tool === 'cylinder' && <WindCylinder vb={vb} setVb={setVb} cat={cat} setCat={setCat} z={z} setZ={setZ} c0={c0} setC0={setC0} rho={rho} setRho={setRho} cylDiam={cylDiam} setCylDiam={setCylDiam} cylL={cylL} setCylL={setCylL} cylSurf={cylSurf} setCylSurf={setCylSurf} cylCscd={cylCscd} setCylCscd={setCylCscd} />}
      {tool === 'signboard' && <WindSign vb={vb} setVb={setVb} cat={cat} setCat={setCat} c0={c0} setC0={setC0} rho={rho} setRho={setRho} sgW={sgW} setSgW={setSgW} sgH={sgH} setSgH={setSgH} sgZg={sgZg} setSgZg={setSgZg} sgCscd={sgCscd} setSgCscd={setSgCscd} sgEcc={sgEcc} setSgEcc={setSgEcc} />}
    </div>
  )
}

