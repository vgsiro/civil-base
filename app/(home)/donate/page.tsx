'use client'
import HomeNavBar from '../../_components/shared/HomeNavBar'
import HomeFooter from '../../_components/shared/HomeFooter'

// ── Edit this section to customise your donate page ──────────────────────────
const DONATE_CONFIG = {
  heading: 'Support CivilAxis',
  subheading: 'CivilAxis is free and always will be. If it saves you time or helps your work, a coffee goes a long way ☕',
  paypalUrl: '',           // e.g. 'https://paypal.me/yourname'
  qrImageUrl: '',          // e.g. '/donate-qr.png' — drop image in /public
  bankDetails: '',         // e.g. 'BSB 062-000 · Account 1234 5678 · Tran Nguyen Vuong'
  otherNote: '',           // any extra text shown at the bottom
}
// ─────────────────────────────────────────────────────────────────────────────

export default function DonatePage() {
  const { heading, subheading, paypalUrl, qrImageUrl, bankDetails, otherNote } = DONATE_CONFIG
  const hasAnyMethod = paypalUrl || qrImageUrl || bankDetails

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <HomeNavBar dark pageLabel="Donate">
          <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Support CivilAxis</span>
        </HomeNavBar>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 48px', flex: 1, width: '100%', boxSizing: 'border-box' as const }}>

        {/* Hero */}
        <div style={{ textAlign: 'center' as const, marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>☕</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>{heading}</h1>
          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: 0 }}>{subheading}</p>
        </div>

        {/* Payment methods */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

          {/* PayPal */}
          {paypalUrl ? (
            <a href={paypalUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>🅿</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>PayPal</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Quick one-click donation</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 18, color: '#94a3b8' }}>→</div>
            </a>
          ) : (
            <div style={{ padding: '20px 24px', background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.5 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>🅿</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>PayPal</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Coming soon — add your PayPal link in the config</div>
              </div>
            </div>
          )}

          {/* QR code */}
          {qrImageUrl ? (
            <div style={{ padding: '24px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' as const }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Scan to donate</div>
              <img src={qrImageUrl} alt="Donation QR code" style={{ width: 180, height: 180, borderRadius: 12, border: '1px solid #e2e8f0', objectFit: 'contain' as const }} />
            </div>
          ) : (
            <div style={{ padding: '24px', background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 14, textAlign: 'center' as const, opacity: 0.5 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>QR Code</div>
              <div style={{ width: 120, height: 120, borderRadius: 12, background: '#e2e8f0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36 }}>📷</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>Add your QR image path in the config</div>
            </div>
          )}

          {/* Bank / direct transfer */}
          {bankDetails && (
            <div style={{ padding: '20px 24px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Bank Transfer</div>
              <div style={{ fontSize: 14, color: '#0f172a', fontFamily: 'monospace', background: '#f8fafc', borderRadius: 8, padding: '12px 14px', lineHeight: 1.7, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' as const }}>{bankDetails}</div>
            </div>
          )}

        </div>

        {/* Extra note */}
        {otherNote && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, fontSize: 14, color: '#92400e', lineHeight: 1.7 }}>
            {otherNote}
          </div>
        )}

        {/* Thank you note */}
        <div style={{ marginTop: 40, textAlign: 'center' as const, padding: '24px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🙏</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Thank you for your support</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            Every contribution helps keep CivilAxis free, fast, and growing.<br />
            It means the world to independent developers building for engineers.
          </div>
        </div>

      </div>
      <HomeFooter />
    </div>
  )
}
