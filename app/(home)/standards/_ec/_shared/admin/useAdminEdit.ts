'use client'
import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { saveEcContentBatch, EcContentPatch, EcId } from '@/lib/ec-content'

export function useAdminEdit(ec: EcId, editMode = false, onEditDone?: () => void) {
  const [userEmail, setEmail] = useState('')
  const [dirty, setDirty]     = useState<Map<string, EcContentPatch>>(new Map())
  const [saving, setSaving]   = useState(false)
  const initialized           = useRef(false)

  if (!initialized.current) {
    initialized.current = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? '')
    })
  }

  const stage = useCallback((section: string, key: string, value: unknown) => {
    const patchKey = `${section}__${key}`
    setDirty(prev => {
      const next = new Map(prev)
      next.set(patchKey, { ec, section, key, value })
      return next
    })
  }, [ec])

  const discard = useCallback(() => {
    setDirty(new Map())
    onEditDone?.()
  }, [onEditDone])

  const save = useCallback(async () => {
    if (dirty.size === 0) { onEditDone?.(); return }
    setSaving(true)
    await saveEcContentBatch(Array.from(dirty.values()), userEmail)
    setSaving(false)
    setDirty(new Map())
    onEditDone?.()
  }, [dirty, userEmail, onEditDone])

  return { dirty: dirty.size, saving, stage, save, discard }
}
