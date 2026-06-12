import { supabase } from './supabase'

export type EcId = 'ec0' | 'ec1' | 'ec2' | 'ec3'

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getEcContent<T>(ec: EcId, section: string, key: string): Promise<T | null> {
  const { data } = await supabase
    .from('ec_content')
    .select('value')
    .eq('ec', ec)
    .eq('section', section)
    .eq('key', key)
    .maybeSingle()
  return data ? (data.value as T) : null
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function setEcContent(
  ec: EcId,
  section: string,
  key: string,
  value: unknown,
  updatedBy: string,
): Promise<void> {
  await supabase.from('ec_content').upsert(
    { ec, section, key, value, updated_by: updatedBy },
    { onConflict: 'ec,section,key' },
  )
}

// ── Batch write ───────────────────────────────────────────────────────────────

export type EcContentPatch = { ec: EcId; section: string; key: string; value: unknown }

export async function saveEcContentBatch(patches: EcContentPatch[], updatedBy: string): Promise<void> {
  const rows = patches.map(p => ({ ...p, updated_by: updatedBy }))
  await supabase.from('ec_content').upsert(rows, { onConflict: 'ec,section,key' })
}
