// Main orchestrator — combines ULS, shear/torsion into one Ec2RectResult

import { Ec2RectInput, Ec2RectResult } from './rect-types'
import { calcUls, buildLayers } from './rect-uls-calc'
import { calcShearTorsion } from './rect-shear-torsion-calc'

export type { Ec2RectInput, Ec2RectResult, ReinfLayer, RebarRow } from './rect-types'

export function calcEc2Rect(inp: Ec2RectInput): Ec2RectResult {
  const uls = calcUls(inp)

  // Pass raw As1 in m² to shear calc (uls stores cm²·100 = m²·1e4 → divide back)
  const As1_m2 = inp.rows1.reduce((s, r) => s + r.n * Math.PI * (r.phi / 1000) ** 2 / 4, 0)

  const shear = calcShearTorsion(inp, {
    fcd: uls.fcd,
    fyd: uls.fyd,
    gc: inp.gc,
    d: uls.d,
    As1_m2,
    A: uls.A,
  })

  return { ...uls, ...shear }
}
