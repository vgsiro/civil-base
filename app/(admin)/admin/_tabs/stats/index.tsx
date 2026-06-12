'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import CommunityStats from '../../../../_components/social/feed/CommunityStats'
import type { Stats, ChartData, VerifyRequest } from '../../_lib/types'
import { timeAgo } from '../../_lib/constants'
import { LineChart, BarChart } from './ui'

interface Props {
  stats: Stats | null
  chartData: ChartData | null
  pendingVerify: VerifyRequest[]
  onGoToVerify: () => void
}

export default function StatsTab({ stats, chartData, pendingVerify, onGoToVerify }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Overview</div>

      <CommunityStats />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Pending verify', value: stats?.pendingVerify, color: '#ef4444' },
          { label: 'Visits today',   value: stats?.todayViews,   color: '#3b82f6' },
          { label: 'Total visits',   value: stats?.totalViews,   color: '#8b5cf6' },
        ].map(card => (
          <div key={card.label} style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: card.color }}>{card.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {chartData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <LineChart title="Page views (30d)" data={chartData.views30} color="#3b82f6" />
          <BarChart  title="New users (30d)"  data={chartData.users30} color="#10b981" />
          <BarChart  title="New posts (30d)"  data={chartData.posts30} color="#8b5cf6" />
        </div>
      )}

      {pendingVerify.length > 0 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Pending verifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingVerify.slice(0, 5).map(req => (
              <div key={req.id} style={{ background: '#1e293b', border: '1px solid #f59e0b40', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{req.display_name || req.username}</span>
                  <span style={{ color: '#64748b', fontSize: 13 }}> · @{req.username} · {req.profession}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>{timeAgo(req.created_at)}</span>
                <button onClick={onGoToVerify} style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Review →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
