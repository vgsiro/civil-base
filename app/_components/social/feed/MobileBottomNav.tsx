'use client'
import { Home, Bell, MessageCircle, Bookmark, GraduationCap } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

const TABS = [
  { icon: <Home size={22} />,          label: 'Feed',     href: '/feed'          },
  { icon: <GraduationCap size={22} />, label: 'Notes',    href: '/'              },
  { icon: <MessageCircle size={22} />, label: 'Messages', href: '/messages',     authOnly: true },
  { icon: <Bell size={22} />,          label: 'Notifs',   href: '/notifications', authOnly: true },
  { icon: <Bookmark size={22} />,      label: 'Saved',    href: '/saved',        authOnly: true },
]

export default function MobileBottomNav({ user, onSignInPrompt }: {
  user: User | null
  onSignInPrompt: () => void
}) {
  const current = typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <nav className="mobile-bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
      background: '#fff', borderTop: '1px solid #e4e6eb',
      display: 'none',
      alignItems: 'stretch',
      height: 56,
      boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
    }}>
      {TABS.map(tab => {
        const isActive = current === tab.href || (tab.href !== '/' && current.startsWith(tab.href))
        return (
          <a key={tab.href}
            href={tab.authOnly && !user ? undefined : tab.href}
            onClick={tab.authOnly && !user ? (e) => { e.preventDefault(); onSignInPrompt() } : undefined}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              textDecoration: 'none',
              color: isActive ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              borderTop: isActive ? '2px solid #3b82f6' : '2px solid transparent',
            }}>
            {tab.icon}
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
