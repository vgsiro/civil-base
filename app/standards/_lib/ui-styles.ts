// ── Shared style constants ────────────────────────────────────────────────────

export const TH: React.CSSProperties = { padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#1e293b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap' }
export const TD: React.CSSProperties = { padding: '5px 14px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', textAlign: 'center' }
export const TDN: React.CSSProperties = { ...TD, fontFamily: 'ui-monospace, monospace', fontSize: 13 }
export const TDL: React.CSSProperties = { ...TD, textAlign: 'left' }

export const DETAILS_STEP: React.CSSProperties = { marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }
export const STEP_FORMULA: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#1d4ed8', background: '#eff6ff', padding: '4px 10px', borderRadius: 5, display: 'block', margin: '3px 0', whiteSpace: 'nowrap', overflowX: 'auto' }
export const STEP_RESULT: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700, color: '#1e293b' }

export const INPUT_STYLE: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#1e293b', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }
export const LABEL_STYLE: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 3, lineHeight: 1.4 }
export const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, cursor: 'pointer' }
export const RESULT_BOX: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }
export const RESULT_ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 12 }
export const RESULT_VAL: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#16a34a', fontSize: 13 }
export const RESULT_KEY: React.CSSProperties = { color: '#374151' }
export const FORMULA_BOX: React.CSSProperties = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1d4ed8', lineHeight: 1.7 }
export const WIND_SECTION: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 }
export const INPUT_GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 16px', alignItems: 'end' }
export const INPUT_DIVIDER: React.CSSProperties = { border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }
export const CALC_BTN: React.CSSProperties = { padding: '7px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
export const ZONE_PILL: React.CSSProperties = { display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginRight: 6, marginBottom: 4 }
export const WIND_IMG = {
  terrain: {
    '0':   '/wind-diagrams/ec1-wind-terrain-category-0.png',
    'I':   '/wind-diagrams/ec1-wind-terrain-category-I.png',
    'II':  '/wind-diagrams/ec1-wind-terrain-category-II.png',
    'III': '/wind-diagrams/ec1-wind-terrain-category-III.png',
    'IV':  '/wind-diagrams/ec1-wind-terrain-category-IV.png',
  },
  walls:        '/wind-diagrams/ec1-side-walls-wind-zones-1.png',
  freewall:     '/wind-diagrams/ec1-wall-wind-zones-1.png',
  flatRoof:     '/wind-diagrams/ec1-flat-roof-wind-zones-2.png',
  monoPitch:    '/wind-diagrams/ec1-monopitch-roof-parallel-0deg-wind-zones.png',
  duoPitch:     '/wind-diagrams/ec1-duopitch-roof-perpendicular-0deg-wind-zones.png',
  canopyBlock:  '/wind-diagrams/ec1-canopy-blockage-factor-1.png',
  canopyMono:   '/wind-diagrams/ec1-monopitch-canopy-wind-zones-3.png',
  canopyDuo:    '/wind-diagrams/ec1-duopitch-canopy-wind-zones-1.png',
  signboard:    '/wind-diagrams/ec1-wind-signboard-1.png',
  rectThumb:    '/wind-diagrams/wind-force-rectangular-thumbnail.png',
  cylThumb:     '/wind-diagrams/wind-force-cylinder-thumbnail.png',
}

