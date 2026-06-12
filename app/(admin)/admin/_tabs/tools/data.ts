import type { SupabaseClient } from '@supabase/supabase-js'
import type { SubscriptionTier } from '../../../../_types'

export interface ToolRow {
  tool_id: string
  min_tier: SubscriptionTier
  details_tier: SubscriptionTier
  copy_tier: SubscriptionTier
  updated_at: string
  updated_by: string | null
}

export const TOOL_LABELS: Record<string, string> = {
  ec2_rect_section_check: 'EC2 Rectangular Section Check',
  wind_qp:       'Wind — Peak Velocity Pressure',
  wind_walls:    'Wind — Vertical Walls',
  wind_freewall: 'Wind — Free-standing Wall',
  wind_flat:     'Wind — Flat Roof',
  wind_mono:     'Wind — Monopitch Roof',
  wind_duo:      'Wind — Duopitch Roof',
  wind_canopy_m: 'Wind — Monopitch Canopy',
  wind_canopy_d: 'Wind — Duopitch Canopy',
  wind_rect:     'Wind — Rectangular Structure',
  wind_cylinder: 'Wind — Cylinder',
  wind_signboard: 'Wind — Signboard',
}

export async function fetchToolAccess(supabase: SupabaseClient): Promise<ToolRow[]> {
  const { data, error } = await supabase
    .from('tool_access')
    .select('tool_id, min_tier, details_tier, copy_tier, updated_at, updated_by')
    .order('tool_id')
  if (error) console.error('[Admin] fetchToolAccess error:', error.message)
  return (data as unknown as ToolRow[]) ?? []
}

export async function updateToolTier(
  supabase: SupabaseClient,
  toolId: string,
  field: 'min_tier' | 'details_tier',
  value: SubscriptionTier,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('tool_access')
    .update({ [field]: value, updated_at: new Date().toISOString(), updated_by: user?.id ?? null }) // ts-ok: audit stamp, never compared/ordered
    .eq('tool_id', toolId)
  if (error) throw error
}

export async function updateToolCopy(
  supabase: SupabaseClient,
  toolId: string,
  copyTier: SubscriptionTier,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('tool_access')
    .update({ copy_tier: copyTier, updated_at: new Date().toISOString(), updated_by: user?.id ?? null }) // ts-ok: audit stamp, never compared/ordered
    .eq('tool_id', toolId)
  if (error) throw error
}
