'use client'

interface Props {
  dark?: boolean
}

export default function HomeFooter({ dark = false }: Props) {
  const border  = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
  const muted   = dark ? 'rgba(255,255,255,0.35)' : '#94a3b8'
  const text    = dark ? 'rgba(255,255,255,0.6)'  : '#475569'
  const heading = dark ? 'rgba(255,255,255,0.85)' : '#1e293b'
  const bg      = dark ? 'rgba(255,255,255,0.03)' : '#f8fafc'

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}`, marginTop: 'auto', flexShrink: 0 }}>

      {/* Top bar — links */}
      <div style={{
        borderBottom: `1px solid ${border}`,
        padding: '10px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap' as const, gap: 8,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="CivilAxis" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: heading, letterSpacing: '0.01em' }}>CivilAxis</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Community Guidelines', href: '/guidelines' },
            { label: 'Privacy Policy',       href: '/privacy' },
            { label: 'Terms of Use',         href: '/terms' },
            { label: 'Support',              href: '/donate' },
          ].map((link, i, arr) => (
            <span key={link.label} style={{ display: 'flex', alignItems: 'center' }}>
              <a href={link.href}
                style={{ fontSize: 12, color: muted, textDecoration: 'none', padding: '2px 10px', whiteSpace: 'nowrap' as const }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = heading }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = muted }}>
                {link.label}
              </a>
              {i < arr.length - 1 && (
                <span style={{ color: border, fontSize: 12 }}>|</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom — 2 rows */}
      <div style={{ padding: '10px 32px 14px', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
        {/* Row 1 — about + contact */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
          <div style={{ fontSize: 11, color: text }}>
            A free engineering knowledge platform for civil and structural engineers. Built with ❤️ for the profession.
          </div>
          <div style={{ fontSize: 11, color: text, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
            <span>Developer: Tran Nguyen Vuong</span>
            <span style={{ color: border }}>·</span>
            <a href="mailto:tranvuong2832@gmail.com"
              style={{ color: muted, textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = heading }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = muted }}>
              tranvuong2832@gmail.com
            </a>
            <span style={{ color: border }}>·</span>
            <a href="/donate"
              style={{ color: '#b45309', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}>
              ☕ Buy me a coffee
            </a>
          </div>
        </div>
        {/* Row 2 — copyright */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10, color: muted, opacity: 0.7 }}>
            © {new Date().getFullYear()} CivilAxis · All rights reserved. · Built for engineers · Eurocode tools & community
          </div>
        </div>
      </div>
    </footer>
  )
}
