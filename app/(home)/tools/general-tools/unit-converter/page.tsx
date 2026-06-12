'use client'
import { useEffect } from 'react'
import { Ruler } from 'lucide-react'
import HomeNavBar from '../../../../_components/shared/HomeNavBar'
import UnitConverter from './UnitConverter'
import { recordRecent } from '../../../../_hooks/useRecents'

export default function UnitConverterPage() {
  useEffect(() => {
    recordRecent({
      id: 'unit-converter',
      href: '/tools/general-tools/unit-converter',
      label: 'Unit Converter',
      desc: 'Length · Area · Force · Pressure · Moment · Mass · Temperature · Angle',
      badge: 'GENERAL TOOLS',
      gradient: 'linear-gradient(135deg, #c2410c, #f97316)',
      accentColor: '#f97316',
    })
  }, [])

  return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', flexShrink: 0 }}>
        <HomeNavBar dark pageLabel="Unit Converter" mobileSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #ea580c, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ruler size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Unit Converter</span>
          </div>
        }>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ea580c, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ruler size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>GENERAL TOOLS</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Unit Converter</div>
            </div>
          </div>
        </HomeNavBar>
      </div>

      {/* Mobile category select — shown only on mobile via CSS */}
      <div className="uc-mobile-cat-bar" style={{ display: 'none', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <UnitConverter pageKey="tools_general_tools_unit_converter" />
      </div>
    </div>
  )
}
