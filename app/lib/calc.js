import { evaluate } from 'mathjs'

/**
 * Runs a calc block emitted by the structural AI.
 * Numbers are computed here — never trusted from the model text.
 *
 * @param {object} block - Parsed calc JSON block from the model
 * @returns {{ result: number, result_unit: string, utilisation: number|null, verdict: 'PASS'|'FAIL'|null }}
 */
export function runCalc(block) {
  if (!block.expression || !block.variables) {
    throw new Error('calc block missing expression or variables')
  }

  // Build mathjs scope from the variables map
  const scope = {}
  for (const [k, v] of Object.entries(block.variables)) {
    if (v === null || v === undefined || v.value === undefined) {
      throw new Error(`Variable "${k}" has no value`)
    }
    // mathjs variable names must not contain commas — sanitise keys
    const safeKey = k.replace(/[^a-zA-Z0-9_]/g, '_')
    scope[safeKey] = Number(v.value)
  }

  // Rewrite expression to use sanitised keys too
  let expr = block.expression
  for (const k of Object.keys(block.variables)) {
    const safeKey = k.replace(/[^a-zA-Z0-9_]/g, '_')
    if (safeKey !== k) {
      expr = expr.split(k).join(safeKey)
    }
  }

  const result = evaluate(expr, scope)

  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error(`Expression evaluated to non-finite value: ${result}`)
  }

  let utilisation = null
  let verdict = null

  if (block.compare) {
    const demand = Number(block.compare.demand_value)
    if (isFinite(demand) && result !== 0) {
      utilisation = demand / result
      verdict = utilisation <= 1.0 ? 'PASS' : 'FAIL'
    }
  }

  return {
    clause: block.clause || null,
    quantity: block.quantity || null,
    formula_latex: block.formula_latex || null,
    result,
    result_unit: block.result_unit || '',
    utilisation,
    verdict,
  }
}
