'use client'
import { useEffect } from 'react'
import HomeNavBar from '../../../_components/shared/HomeNavBar'
import SteelSections from './SteelSections'
import { recordRecent } from '../../../_hooks/useRecents'

export default function SteelSectionsPage() {
  useEffect(() => {
    recordRecent({
      id: 'steel-sections',
      href: '/tools/steel-sections',
      label: 'Steel Section Properties',
      desc: 'UB · UC · dimensions, inertia, section moduli · BS EN 10365:2017',
      badge: 'SCI P363',
      gradient: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
      accentColor: '#0369a1',
    })
  }, [])

  return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', flexShrink: 0 }}>
        <HomeNavBar dark pageLabel="Steel Section Properties" mobileSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #075985, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="4" rx="1" fill="white"/>
                <rect x="8" y="6" width="4" height="8" rx="0.5" fill="rgba(255,255,255,0.7)"/>
                <rect x="2" y="14" width="16" height="4" rx="1" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Steel Sections</span>
          </div>
        }>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #075985, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="4" rx="1" fill="white"/>
                <rect x="8" y="6" width="4" height="8" rx="0.5" fill="rgba(255,255,255,0.7)"/>
                <rect x="2" y="14" width="16" height="4" rx="1" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>SCI P363</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Steel Section Properties</div>
            </div>
          </div>
        </HomeNavBar>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <SteelSections />
      </div>
    </div>
  )
}
