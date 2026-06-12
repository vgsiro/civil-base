'use client'

// ── Shared card format for all EC reference tool pages ────────────────────────
// To change card size globally, edit CARD_W and CARD_IMG_H here.

export const CARD_W     = 260   // px — fixed card width
export const CARD_IMG_H = 120   // px — color/image area height

export type ToolCard = {
  id:       string
  label:    string            // card title and side nav label
  desc:     string            // one-line description below the title
  graphic:  React.ReactNode   // SVG or <img> centered in the image area
  accent:   string            // brand color — label text + hover glow
  gradient: string            // CSS gradient for image area background
  ref:      string            // EC clause shown top-right (e.g. "EN 1991-1-4")
}

export type ToolGroup = {
  part:  string               // e.g. "EN 1991-1-4"
  desc:  string               // e.g. "Wind actions"
  cards: ToolCard[]
}

export function ToolCardGrid({
  groups,
  accentColor = '#3b82f6',
  accentBg    = '#eff6ff',
  onSelect,
}: {
  groups:      ToolGroup[]
  accentColor?: string        // group pill text color
  accentBg?:   string        // group pill background color
  onSelect:    (id: string) => void
}) {
  return (
    <>
      {groups.map(group => (
        <div key={group.part}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, background: accentBg, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>
              {group.part}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{group.desc}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_W}px, ${CARD_W}px))`, gap: 14 }}>
            {group.cards.map(card => (
              <button key={card.id} onClick={() => onSelect(card.id)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${card.accent}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
                {/* Image / graphic area — replace card.graphic with <img> for a photo */}
                <div style={{ height: CARD_IMG_H, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {card.graphic}
                  <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {card.ref}
                  </span>
                </div>
                {/* Text area */}
                <div style={{ padding: '11px 14px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: card.accent, marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{card.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
