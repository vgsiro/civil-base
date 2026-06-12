'use client'
import { Wrench } from 'lucide-react'
import { tierLabel, tierColor, tierBg } from '../../../../../lib/useSubscription'
import type { SubscriptionTier } from '../../../../_types'
import type { ToolRow } from './data'
import { TOOL_LABELS } from './data'

const TIER_OPTIONS: SubscriptionTier[] = ['normal', 'pro', 'premium', 'admin']

interface TierSelectProps {
  value: SubscriptionTier
  onChange: (v: SubscriptionTier) => void
  saving: boolean
}

function TierSelect({ value, onChange, saving }: TierSelectProps) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
      {TIER_OPTIONS.map(t => {
        const active = value === t
        return (
          <button
            key={t}
            onClick={() => !saving && onChange(t)}
            disabled={saving}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 400,
              border: `1.5px solid ${active ? tierColor(t) : '#334155'}`,
              background: active ? `${tierColor(t)}20` : 'none',
              color: active ? tierColor(t) : '#475569',
              cursor: saving ? 'wait' : 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {tierLabel(t)}
          </button>
        )
      })}
    </div>
  )
}

interface ToolsTableProps {
  tools: ToolRow[]
  saving: string | null
  onChangeTier: (toolId: string, field: 'min_tier' | 'details_tier', value: SubscriptionTier) => void
  onChangeCopy: (toolId: string, value: SubscriptionTier) => void
}

export function ToolsTable({ tools, saving, onChangeTier, onChangeCopy }: ToolsTableProps) {
  if (tools.length === 0) {
    return <div style={{ padding: '48px', textAlign: 'center' as const, color: '#475569', fontSize: 14 }}>No tools found.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', gap: 0, background: '#0f172a', padding: '10px 16px' }}>
        {['Tool', 'Use (Results)', 'Details', 'Copy Details'].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{h}</div>
        ))}
      </div>

      {tools.map((tool, i) => {
        const label = TOOL_LABELS[tool.tool_id] ?? tool.tool_id
        const isSaving = saving === tool.tool_id
        return (
          <div
            key={tool.tool_id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px',
              padding: '14px 16px', gap: 12, alignItems: 'center',
              borderTop: i > 0 ? '1px solid #1e3a5f' : 'none',
              background: isSaving ? '#ffffff04' : 'transparent',
            }}
          >
            {/* Tool name */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0f172a', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Wrench size={13} color="#6366f1" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>{tool.tool_id}</div>
                </div>
              </div>
            </div>

            {/* min_tier */}
            <div>
              <TierSelect
                value={tool.min_tier}
                onChange={v => onChangeTier(tool.tool_id, 'min_tier', v)}
                saving={isSaving}
              />
              <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>Min to access tool</div>
            </div>

            {/* details_tier */}
            <div>
              <TierSelect
                value={tool.details_tier}
                onChange={v => onChangeTier(tool.tool_id, 'details_tier', v)}
                saving={isSaving}
              />
              <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>Min to see details</div>
            </div>

            {/* copy_tier */}
            <div>
              <TierSelect
                value={tool.copy_tier}
                onChange={v => onChangeCopy(tool.tool_id, v)}
                saving={isSaving}
              />
              <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>Min to copy details</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ToolsLegend() {
  const items: { tier: SubscriptionTier; desc: string }[] = [
    { tier: 'normal',  desc: 'All logged-in users' },
    { tier: 'pro',     desc: 'Pro subscribers and above' },
    { tier: 'premium', desc: 'Premium subscribers and above' },
    { tier: 'admin',   desc: 'Admins only' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
      {items.map(({ tier, desc }) => (
        <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#1e293b', border: `1px solid ${tierColor(tier)}30`, borderRadius: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: tierColor(tier), background: tierBg(tier), padding: '1px 7px', borderRadius: 10 }}>{tierLabel(tier)}</span>
          <span style={{ fontSize: 11, color: '#475569' }}>{desc}</span>
        </div>
      ))}
    </div>
  )
}
