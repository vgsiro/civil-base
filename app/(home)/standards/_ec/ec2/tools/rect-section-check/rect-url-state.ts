import { Ec2RectInput, RebarRow } from './rect-engine/rect-types'
import { Ec2SlsInput } from './rect-engine/rect-sls-calc'

export interface RectUrlState {
  inp: Ec2RectInput
  sls: Ec2SlsInput
}

export function encodeRectState(state: RectUrlState): string {
  return btoa(JSON.stringify(state))
}

export function decodeRectState(raw: string): RectUrlState | null {
  try {
    const parsed = JSON.parse(atob(raw))
    if (!parsed?.inp || !parsed?.sls) return null
    // Ensure required array fields exist and rows are valid
    const inp = parsed.inp as Ec2RectInput
    if (!Array.isArray(inp.rows1) || inp.rows1.length === 0) return null
    if (!Array.isArray(inp.rows2) || inp.rows2.length === 0) return null
    inp.rows1 = inp.rows1.map((r: RebarRow) => ({ n: Number(r.n), phi: Number(r.phi) }))
    inp.rows2 = inp.rows2.map((r: RebarRow) => ({ n: Number(r.n), phi: Number(r.phi) }))
    return { inp, sls: parsed.sls as Ec2SlsInput }
  } catch {
    return null
  }
}
