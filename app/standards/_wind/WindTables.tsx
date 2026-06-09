'use client'
import React, { useState, useRef, useCallback } from 'react'
import { Table, TR } from '../_lib/ui'
import { TH, TD, TDN, TDL } from '../_lib/ui-styles'

// ─── shared primitives ────────────────────────────────────────────────────────
const TIT: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }
const SUB: React.CSSProperties = { fontSize: 11, color: '#1e293b', marginBottom: 10 }
const NOTE: React.CSSProperties = {
  background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6,
  padding: '8px 12px', fontSize: 11, color: '#92400e', marginTop: 8, lineHeight: 1.6,
}
const WRAP: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
const THS: React.CSSProperties = { ...TH, padding: '5px 10px', fontSize: 11 }
const TDS: React.CSSProperties = { ...TD, padding: '4px 10px', fontSize: 12 }
const TDNS: React.CSSProperties = { ...TDN, padding: '4px 10px', fontSize: 12 }
const TDLS: React.CSSProperties = { ...TDL, padding: '4px 10px', fontSize: 12 }

function TableBlock({ id, title, children, notes }: {
  id: string; title: string; children: React.ReactNode; notes?: React.ReactNode
}) {
  return (
    <div id={id} style={WRAP}>
      <div style={TIT}>{title}</div>
      {children}
      {notes && <div style={NOTE}>{notes}</div>}
    </div>
  )
}

// ─── Table 4.1 ────────────────────────────────────────────────────────────────
function Table41() {
  const rows = [
    { cat: '0',   desc: 'Sea or coastal area exposed to the open sea',                                                                                   z0: '0,003', zmin: '1' },
    { cat: 'I',   desc: 'Lakes or flat and horizontal area with negligible vegetation and without obstacles',                                             z0: '0,01',  zmin: '1' },
    { cat: 'II',  desc: 'Area with low vegetation such as grass and isolated obstacles (trees, buildings) with separations of at least 20 obstacle heights', z0: '0,05',  zmin: '2' },
    { cat: 'III', desc: 'Area with regular cover of vegetation or buildings or with isolated obstacles with separations of maximum 20 obstacle heights (such as villages, suburban terrain, permanent forest)', z0: '0,3', zmin: '5' },
    { cat: 'IV',  desc: 'Area in which at least 15 % of the surface is covered with buildings and their average height exceeds 15 m',                    z0: '1,0',   zmin: '10' },
  ]
  return (
    <TableBlock id="t4-1" title="Table 4.1 — Terrain categories and terrain parameters"
      notes="NOTE  The terrain categories are illustrated in A.1.">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'center', width: 40 }}>Cat.</th>
          <th style={{ ...THS, textAlign: 'left', minWidth: 340 }}>Terrain category</th>
          <th style={{ ...THS }}>z₀ (m)</th>
          <th style={{ ...THS }}>z<sub>min</sub> (m)</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.cat} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.cat}</td>
              <td style={TDLS}>{r.desc}</td>
              <td style={TDNS}>{r.z0}</td>
              <td style={TDNS}>{r.zmin}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 5.1 ────────────────────────────────────────────────────────────────
function Table51() {
  const groups = [
    {
      header: 'peak velocity pressure qₚ',
      rows: [
        { param: 'basic wind velocity vᵇ',             ref: '4.2 (2)P' },
        { param: 'reference height zₑ',               ref: 'Section 7' },
        { param: 'terrain category',                        ref: 'Table 4.1' },
        { param: 'characteristic peak velocity pressure qₚ', ref: '4.5 (1)' },
        { param: 'turbulence intensity Iᵥ',            ref: '4.4' },
        { param: 'mean wind velocity vₘ',              ref: '4.3.1' },
        { param: 'orography coefficient cₒ(z)',        ref: '4.3.3' },
        { param: 'roughness coefficient cᵣ(z)',        ref: '4.3.2' },
      ],
    },
    {
      header: 'Wind pressures, e.g. for cladding, fixings and structural parts',
      rows: [
        { param: 'external pressure coefficient cₚₑ',         ref: 'Section 7' },
        { param: 'internal pressure coefficient cₚᴵ',         ref: 'Section 7' },
        { param: 'net pressure coefficient cₚ,net',                ref: 'Section 7' },
        { param: 'external wind pressure: wₑ = qₚ · cₚₑ', ref: '5.2 (1)' },
        { param: 'internal wind pressure: wᴵ = qₚ · cₚᴵ', ref: '5.2 (2)' },
      ],
    },
    {
      header: 'Wind forces on structures, e.g. for overall wind effects',
      rows: [
        { param: 'structural factor: cₚcᵈ',                   ref: '6' },
        { param: 'wind force Fᵂ calculated from force coefficients',   ref: '5.3 (2)' },
        { param: 'wind force Fᵂ calculated from pressure coefficients', ref: '5.3 (3)' },
      ],
    },
  ]
  return (
    <TableBlock id="t5-1" title="Table 5.1 — Calculation procedures for the determination of wind actions">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', minWidth: 340 }}>Parameter</th>
          <th style={{ ...THS, textAlign: 'left', minWidth: 120 }}>Subject Reference</th>
        </tr></thead>
        <tbody>
          {groups.map(g => (
            <React.Fragment key={g.header}>
              <tr>
                <td colSpan={2} style={{ ...TDLS, fontWeight: 700, background: '#f1f5f9', fontSize: 12 }}>{g.header}</td>
              </tr>
              {g.rows.map((r, i) => (
                <TR key={r.param} stripe={i % 2 !== 0}>
                  <td style={TDLS}>{r.param}</td>
                  <td style={TDLS}>{r.ref}</td>
                </TR>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.1 ────────────────────────────────────────────────────────────────
function Table71() {
  const rows = [
    { hd: '5',     A10: '-1,2', A1: '-1,4', B10: '-0,8', B1: '-1,1', C10: '-0,5', C1: '—', D10: '+0,8', D1: '+1,0', E10: '-0,7', E1: '—' },
    { hd: '1',     A10: '-1,2', A1: '-1,4', B10: '-0,8', B1: '-1,1', C10: '-0,5', C1: '—', D10: '+0,8', D1: '+1,0', E10: '-0,5', E1: '—' },
    { hd: '≤ 0,25',A10: '-1,2', A1: '-1,4', B10: '-0,8', B1: '-1,1', C10: '-0,5', C1: '—', D10: '+0,7', D1: '+1,0', E10: '-0,3', E1: '—' },
  ]
  return (
    <TableBlock id="t7-1"
      title="Table 7.1 — Recommended values of external pressure coefficients for vertical walls of rectangular plan buildings"
      notes="NOTE 2  For buildings with h/d > 5, the total wind loading may be based on the provisions given in 7.6 to 7.8 and 7.9.2.">
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Zone</th>
            <th style={THS} colSpan={2}>A</th>
            <th style={THS} colSpan={2}>B</th>
            <th style={THS} colSpan={2}>C</th>
            <th style={THS} colSpan={2}>D</th>
            <th style={THS} colSpan={2}>E</th>
          </tr>
          <tr>
            {['A','B','C','D','E'].map(z => (
              <React.Fragment key={z}>
                <th style={THS}>c<sub>pe,10</sub></th>
                <th style={THS}>c<sub>pe,1</sub></th>
              </React.Fragment>
            ))}
          </tr>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }}>h/d</th>
            {Array(10).fill(null).map((_, i) => <th key={i} style={THS}></th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.hd} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700, textAlign: 'left' }}>{r.hd}</td>
              <td style={TDNS}>{r.A10}</td><td style={TDNS}>{r.A1}</td>
              <td style={TDNS}>{r.B10}</td><td style={TDNS}>{r.B1}</td>
              <td style={TDNS}>{r.C10}</td><td style={TDNS}>{r.C1}</td>
              <td style={TDNS}>{r.D10}</td><td style={TDNS}>{r.D1}</td>
              <td style={TDNS}>{r.E10}</td><td style={TDNS}>{r.E1}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.2 ────────────────────────────────────────────────────────────────
function Table72() {
  const rows = [
    { type: 'Sharp eaves',          param: '—',                F10: '-1,8', F1: '-2,5', G10: '-1,2', G1: '-2,0', H10: '-0,7', H1: '-1,2', Ip: '+0,2', In: '-0,2' },
    { type: 'With Parapets',        param: 'hₚ/h = 0,025', F10: '-1,6', F1: '-2,2', G10: '-1,1', G1: '-1,8', H10: '-0,7', H1: '-1,2', Ip: '+0,2', In: '-0,2' },
    { type: '',                     param: 'hₚ/h = 0,05',  F10: '-1,4', F1: '-2,0', G10: '-0,9', G1: '-1,6', H10: '-0,7', H1: '-1,2', Ip: '+0,2', In: '-0,2' },
    { type: '',                     param: 'hₚ/h = 0,10',  F10: '-1,2', F1: '-1,8', G10: '-0,8', G1: '-1,4', H10: '-0,7', H1: '-1,2', Ip: '+0,2', In: '-0,2' },
    { type: 'Curved Eaves',         param: 'r/h = 0,05',       F10: '-1,0', F1: '-1,5', G10: '-1,2', G1: '-1,8', H10: '-0,4', H1: '—',    Ip: '+0,2', In: '-0,2' },
    { type: '',                     param: 'r/h = 0,10',       F10: '-0,7', F1: '-1,2', G10: '-0,8', G1: '-1,4', H10: '-0,3', H1: '—',    Ip: '+0,2', In: '-0,2' },
    { type: '',                     param: 'r/h = 0,20',       F10: '-0,5', F1: '-0,8', G10: '-0,5', G1: '-0,8', H10: '-0,3', H1: '—',    Ip: '+0,2', In: '-0,2' },
    { type: 'Mansard Eaves',        param: 'α = 30°',          F10: '-1,0', F1: '-1,5', G10: '-1,0', G1: '-1,5', H10: '-0,3', H1: '—',    Ip: '+0,2', In: '-0,2' },
    { type: '',                     param: 'α = 45°',          F10: '-1,2', F1: '-1,8', G10: '-1,3', G1: '-1,9', H10: '-0,4', H1: '—',    Ip: '+0,2', In: '-0,2' },
    { type: '',                     param: 'α = 60°',          F10: '-1,3', F1: '-1,9', G10: '-1,3', G1: '-1,9', H10: '-0,5', H1: '—',    Ip: '+0,2', In: '-0,2' },
  ]
  return (
    <TableBlock id="t7-2" title="Table 7.2 — External pressure coefficients for flat roofs"
      notes={<>
        <div><strong>NOTE 1</strong>  For roofs with parapets or curved eaves, linear interpolation may be used for intermediate values of h<sub>p</sub>/h and r/h.</div>
        <div><strong>NOTE 2</strong>  For roofs with mansard eaves, linear interpolation between α = 30°, 45° and α = 60° may be used. For α &gt; 60° linear interpolation between the values for α = 60° and the values for flat roofs with sharp eaves may be used.</div>
        <div><strong>NOTE 3</strong>  In Zone I, where positive and negative values are given, both shall be considered.</div>
        <div><strong>NOTE 4</strong>  For the mansard eave itself, the external pressure coefficients are given in Table 7.4a "External pressure coefficients for duopitch roofs: wind direction 0°", Zone F and G, depending on the pitch angle of the mansard eave.</div>
        <div><strong>NOTE 5</strong>  For the curved eave itself, the external pressure coefficients are given by linear interpolation along the curve, between values on the wall and on the roof.</div>
      </>}>
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Roof type</th>
            <th style={THS} rowSpan={2}>Param.</th>
            <th style={THS} colSpan={2}>F</th>
            <th style={THS} colSpan={2}>G</th>
            <th style={THS} colSpan={2}>H</th>
            <th style={THS} colSpan={2}>I</th>
          </tr>
          <tr>
            {['F','G','H','I'].map(z => (
              <React.Fragment key={z}>
                <th style={THS}>c<sub>pe,10</sub></th>
                <th style={THS}>c<sub>pe,1</sub></th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={i} stripe={i % 2 !== 0}>
              <td style={{ ...TDLS, fontWeight: r.type ? 600 : 400, color: r.type ? '#1e293b' : '#1e293b' }}>{r.type || ''}</td>
              <td style={TDLS}>{r.param}</td>
              <td style={TDNS}>{r.F10}</td><td style={TDNS}>{r.F1}</td>
              <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td>
              <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td>
              <td style={TDNS}>{r.Ip}<br/>{r.In}</td><td style={TDNS}>—</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.3a ───────────────────────────────────────────────────────────────
function Table73a() {
  const rows0 = [
    { α: '5°',  F10: '-1,7', F1: '-2,5', G10: '-1,2', G1: '-2,0', H10: '-0,6', H1: '-1,2', Fp: '+0,0', Gp: '+0,0', Hp: '+0,0' },
    { α: '15°', F10: '-0,9', F1: '-2,0', G10: '-0,8', G1: '-1,5', H10: '-0,3', H1: '—',    Fp: '+0,2', Gp: '+0,2', Hp: '+0,2' },
    { α: '30°', F10: '-0,5', F1: '-1,5', G10: '-0,5', G1: '-1,5', H10: '-0,2', H1: '—',    Fp: '+0,7', Gp: '+0,7', Hp: '+0,4' },
    { α: '45°', F10: '-0,0', F1: '-0,0', G10: '-0,0', G1: '-0,0', H10: '-0,0', H1: '—',    Fp: '+0,7', Gp: '+0,7', Hp: '—'   },
    { α: '60°', F10: '+0,7', F1: '+0,7', G10: '+0,7', G1: '+0,7', H10: '+0,7', H1: '+0,7',  Fp: '—',   Gp: '—',   Hp: '—'   },
    { α: '75°', F10: '+0,8', F1: '+0,8', G10: '+0,8', G1: '+0,8', H10: '+0,8', H1: '+0,8',  Fp: '—',   Gp: '—',   Hp: '—'   },
  ]
  const rows180 = [
    { α: '5°',  F10: '-2,3', F1: '-2,5', G10: '-1,3', G1: '-2,0', H10: '-0,8', H1: '-1,2' },
    { α: '15°', F10: '-2,5', F1: '-2,8', G10: '-1,3', G1: '-2,0', H10: '-0,9', H1: '-1,2' },
    { α: '30°', F10: '-1,1', F1: '-2,3', G10: '-0,8', G1: '-1,5', H10: '-0,8', H1: '—'    },
    { α: '45°', F10: '-0,6', F1: '-1,3', G10: '-0,5', G1: '-1,0', H10: '-0,8', H1: '—'    },
    { α: '60°', F10: '-0,5', F1: '-1,0', G10: '-0,5', G1: '-1,0', H10: '-0,8', H1: '—'    },
    { α: '75°', F10: '-0,5', F1: '-1,0', G10: '-0,5', G1: '-1,0', H10: '-0,8', H1: '—'    },
  ]
  return (
    <TableBlock id="t7-3a" title="Table 7.3a — External pressure coefficients for monopitch roofs"
      notes={<>
        <div><strong>NOTE 1</strong>  At θ = 0° the pressure changes rapidly between positive and negative values around a pitch angle of α = +5° to +45°, so both positive and negative values are given. For those roofs, two cases should be considered: one with all positive values, and one with all negative values. No mixing of positive and negative values is allowed on the same face.</div>
        <div><strong>NOTE 2</strong>  Linear interpolation for intermediate pitch angles may be used between values of the same sign. The values equal to 0.0 are given for interpolation purposes.</div>
      </>}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...SUB, marginBottom: 4, fontWeight: 600 }}>Zone for wind direction θ = 0°</div>
          <Table>
            <thead>
              <tr>
                <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Pitch Angle α</th>
                <th style={THS} colSpan={3}>F</th>
                <th style={THS} colSpan={3}>G</th>
                <th style={THS} colSpan={3}>H</th>
              </tr>
              <tr>
                <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th><th style={THS}>+</th>
                <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th><th style={THS}>+</th>
                <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th><th style={THS}>+</th>
              </tr>
            </thead>
            <tbody>
              {rows0.map((r, i) => (
                <TR key={r.α} stripe={i % 2 !== 0}>
                  <td style={{ ...TDNS, fontWeight: 700 }}>{r.α}</td>
                  <td style={TDNS}>{r.F10}</td><td style={TDNS}>{r.F1}</td><td style={TDNS}>{r.Fp}</td>
                  <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td><td style={TDNS}>{r.Gp}</td>
                  <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td><td style={TDNS}>{r.Hp}</td>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
        <div>
          <div style={{ ...SUB, marginBottom: 4, fontWeight: 600 }}>Zone for wind direction θ = 180°</div>
          <Table>
            <thead>
              <tr>
                <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Pitch Angle α</th>
                <th style={THS} colSpan={2}>F</th>
                <th style={THS} colSpan={2}>G</th>
                <th style={THS} colSpan={2}>H</th>
              </tr>
              <tr>
                {['F','G','H'].map(z => (
                  <React.Fragment key={z}>
                    <th style={THS}>c<sub>pe,10</sub></th>
                    <th style={THS}>c<sub>pe,1</sub></th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows180.map((r, i) => (
                <TR key={r.α} stripe={i % 2 !== 0}>
                  <td style={{ ...TDNS, fontWeight: 700 }}>{r.α}</td>
                  <td style={TDNS}>{r.F10}</td><td style={TDNS}>{r.F1}</td>
                  <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td>
                  <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </TableBlock>
  )
}

// ─── Table 7.3b ───────────────────────────────────────────────────────────────
function Table73b() {
  const rows = [
    { α: '5°',  Fu10: '-2,1', Fu1: '-2,6', Fl10: '-2,1', Fl1: '-2,4', G10: '-1,8', G1: '-2,0', H10: '-0,6', H1: '-1,2', I10: '-0,5', I1: '—' },
    { α: '15°', Fu10: '-2,4', Fu1: '-2,9', Fl10: '-1,6', Fl1: '-2,4', G10: '-1,9', G1: '-2,5', H10: '-0,8', H1: '-1,2', I10: '-0,7', I1: '-1,2' },
    { α: '30°', Fu10: '-2,1', Fu1: '-2,9', Fl10: '-1,3', Fl1: '-2,0', G10: '-1,5', G1: '-2,0', H10: '-1,0', H1: '-1,3', I10: '-0,8', I1: '-1,2' },
    { α: '45°', Fu10: '-1,5', Fu1: '-2,4', Fl10: '-1,3', Fl1: '-2,0', G10: '-1,4', G1: '-2,0', H10: '-1,0', H1: '-1,3', I10: '-0,9', I1: '-1,2' },
    { α: '60°', Fu10: '-1,2', Fu1: '-2,0', Fl10: '-1,2', Fl1: '-2,0', G10: '-1,2', G1: '-2,0', H10: '-1,0', H1: '-1,3', I10: '-0,7', I1: '-1,2' },
    { α: '75°', Fu10: '-1,2', Fu1: '-2,0', Fl10: '-1,2', Fl1: '-2,0', G10: '-1,2', G1: '-2,0', H10: '-1,0', H1: '-1,3', I10: '-0,5', I1: '—'   },
  ]
  return (
    <TableBlock id="t7-3b" title="Table 7.3b — External pressure coefficients for monopitch roofs"
      notes={<>
        <div><strong>NOTE 1</strong>  At θ = 0° (see table a) the pressure changes rapidly between positive and negative values around a pitch angle of α = +5° to +45°, so both positive and negative values are given. For those roofs, two cases should be considered: one with all positive values, and one with all negative values. No mixing of positive and negative values is allowed on the same face.</div>
        <div><strong>NOTE 2</strong>  Linear interpolation for intermediate pitch angles may be used between values of the same sign. The values equal to 0.0 are given for interpolation purposes.</div>
      </>}>
      <div style={SUB}>Zone for wind direction θ = 90°</div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Pitch Angle α</th>
            <th style={THS} colSpan={2}>F<sub>up</sub></th>
            <th style={THS} colSpan={2}>F<sub>low</sub></th>
            <th style={THS} colSpan={2}>G</th>
            <th style={THS} colSpan={2}>H</th>
            <th style={THS} colSpan={2}>I</th>
          </tr>
          <tr>
            {['Fu','Fl','G','H','I'].map(z => (
              <React.Fragment key={z}>
                <th style={THS}>c<sub>pe,10</sub></th>
                <th style={THS}>c<sub>pe,1</sub></th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.α} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.α}</td>
              <td style={TDNS}>{r.Fu10}</td><td style={TDNS}>{r.Fu1}</td>
              <td style={TDNS}>{r.Fl10}</td><td style={TDNS}>{r.Fl1}</td>
              <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td>
              <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td>
              <td style={TDNS}>{r.I10}</td><td style={TDNS}>{r.I1}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.4a ───────────────────────────────────────────────────────────────
function Table74a() {
  const rows = [
    { α: '-45°', F10: '-0,6', F1: '—',    Fp: '—',    G10: '-0,6', G1: '—',    Gp: '—',    H10: '-0,8', H1: '—',    Hp: '—',    I10: '-0,7', I1: '—',    Ip: '—',    J10: '-1,0', J1: '-1,5', Jp: '—'    },
    { α: '-30°', F10: '-1,1', F1: '-2,0', Fp: '—',    G10: '-0,8', G1: '-1,5', Gp: '—',    H10: '-0,8', H1: '—',    Hp: '—',    I10: '-0,6', I1: '—',    Ip: '—',    J10: '-0,8', J1: '—',    Jp: '—'    },
    { α: '-15°', F10: '-2,5', F1: '-2,8', Fp: '—',    G10: '-1,3', G1: '-2,0', Gp: '—',    H10: '-0,9', H1: '-1,2', Hp: '—',    I10: '-0,5', I1: '—',    Ip: '—',    J10: '-0,7', J1: '-1,2', Jp: '—'    },
    { α: '-5°',  F10: '-2,3', F1: '-2,5', Fp: '—',    G10: '-1,2', G1: '-2,0', Gp: '—',    H10: '-0,8', H1: '-1,2', Hp: '—',    I10: '-0,6', I1: '—',    Ip: '—',    J10: '-0,6', J1: '—',    Jp: '—'    },
    { α: '5°',   F10: '-1,7', F1: '-2,5', Fp: '+0,0', G10: '-1,2', G1: '-2,0', Gp: '+0,0', H10: '-0,6', H1: '-1,2', Hp: '+0,0', I10: '-0,6', I1: '—',    Ip: '—',    J10: '+0,2', J1: '+0,2', Jp: '-0,6' },
    { α: '15°',  F10: '-0,9', F1: '-2,0', Fp: '+0,2', G10: '-0,8', G1: '-1,5', Gp: '+0,2', H10: '-0,3', H1: '—',    Hp: '+0,2', I10: '-0,4', I1: '—',    Ip: '+0,0', J10: '-1,0', J1: '-1,5', Jp: '+0,2' },
    { α: '30°',  F10: '-0,5', F1: '-1,5', Fp: '+0,7', G10: '-0,5', G1: '-1,5', Gp: '+0,7', H10: '-0,2', H1: '—',    Hp: '+0,4', I10: '-0,4', I1: '—',    Ip: '+0,0', J10: '-0,5', J1: '—',    Jp: '+0,5' },
    { α: '45°',  F10: '-0,0', F1: '—',    Fp: '+0,7', G10: '-0,0', G1: '—',    Gp: '+0,7', H10: '-0,0', H1: '—',    Hp: '+0,6', I10: '-0,2', I1: '—',    Ip: '+0,0', J10: '-0,3', J1: '—',    Jp: '+0,5' },
    { α: '60°',  F10: '+0,7', F1: '+0,7', Fp: '—',    G10: '+0,7', G1: '+0,7', Gp: '—',    H10: '+0,7', H1: '+0,7', Hp: '—',    I10: '-0,2', I1: '—',    Ip: '—',    J10: '-0,3', J1: '—',    Jp: '—'    },
    { α: '75°',  F10: '+0,8', F1: '+0,8', Fp: '—',    G10: '+0,8', G1: '+0,8', Gp: '—',    H10: '+0,8', H1: '+0,8', Hp: '—',    I10: '-0,2', I1: '—',    Ip: '—',    J10: '-0,3', J1: '—',    Jp: '—'    },
  ]
  return (
    <TableBlock id="t7-4a" title="Table 7.4a — External pressure coefficients for duopitch roofs"
      notes={<>
        <div><strong>NOTE 1</strong>  At θ = 0° the pressure changes rapidly between positive and negative values on the windward face around a pitch angle of α = -5° to +45°, so both positive and negative values are given. For those roofs, four cases should be considered where the largest or smallest values of all areas F, G and H are combined with the largest or smallest values in areas I and J. No mixing of positive and negative values is allowed on the same face.</div>
        <div><strong>NOTE 2</strong>  Linear interpolation for intermediate pitch angles of the same sign may be used between values of the same sign. (Do not interpolate between α = +5° and α = -5°, but use the data for flat roofs in 7.2.3). The values equal to 0.0 are given for interpolation purposes.</div>
      </>}>
      <div style={SUB}>Zone for wind direction θ = 0°</div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Pitch Angle α</th>
            <th style={THS} colSpan={3}>F</th>
            <th style={THS} colSpan={3}>G</th>
            <th style={THS} colSpan={3}>H</th>
            <th style={THS} colSpan={3}>I</th>
            <th style={THS} colSpan={3}>J</th>
          </tr>
          <tr>
            {['F','G','H','I','J'].map(z => (
              <React.Fragment key={z}>
                <th style={THS}>c<sub>pe,10</sub></th>
                <th style={THS}>c<sub>pe,1</sub></th>
                <th style={{ ...THS, color: '#059669' }}>+</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.α} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.α}</td>
              <td style={TDNS}>{r.F10}</td><td style={TDNS}>{r.F1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Fp}</td>
              <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Gp}</td>
              <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Hp}</td>
              <td style={TDNS}>{r.I10}</td><td style={TDNS}>{r.I1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Ip}</td>
              <td style={TDNS}>{r.J10}</td><td style={TDNS}>{r.J1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Jp}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.4b ───────────────────────────────────────────────────────────────
function Table74b() {
  const rows = [
    { α: '-45°', F10: '-1,4', F1: '-2,0', G10: '-1,2', G1: '-2,0', H10: '-1,0', H1: '-1,3', I10: '-0,9', I1: '-1,2' },
    { α: '-30°', F10: '-1,5', F1: '-2,1', G10: '-1,2', G1: '-2,0', H10: '-1,0', H1: '-1,3', I10: '-0,9', I1: '-1,2' },
    { α: '-15°', F10: '-1,9', F1: '-2,5', G10: '-1,2', G1: '-2,0', H10: '-0,8', H1: '-1,2', I10: '-0,8', I1: '-1,2' },
    { α: '-5°',  F10: '-1,8', F1: '-2,5', G10: '-1,2', G1: '-2,0', H10: '-0,7', H1: '-1,2', I10: '-0,6', I1: '-1,2' },
    { α: '5°',   F10: '-1,6', F1: '-2,2', G10: '-1,3', G1: '-2,0', H10: '-0,7', H1: '-1,2', I10: '-0,6', I1: '—'    },
    { α: '15°',  F10: '-1,3', F1: '-2,0', G10: '-1,3', G1: '-2,0', H10: '-0,6', H1: '-1,2', I10: '-0,5', I1: '—'    },
    { α: '30°',  F10: '-1,1', F1: '-1,5', G10: '-1,4', G1: '-2,0', H10: '-0,8', H1: '-1,2', I10: '-0,5', I1: '—'    },
    { α: '45°',  F10: '-1,1', F1: '-1,5', G10: '-1,4', G1: '-2,0', H10: '-0,9', H1: '-1,2', I10: '-0,5', I1: '—'    },
    { α: '60°',  F10: '-1,1', F1: '-1,5', G10: '-1,2', G1: '-2,0', H10: '-0,8', H1: '-1,0', I10: '-0,5', I1: '—'    },
    { α: '75°',  F10: '-1,1', F1: '-1,5', G10: '-1,2', G1: '-2,0', H10: '-0,8', H1: '-1,0', I10: '-0,5', I1: '—'    },
  ]
  return (
    <TableBlock id="t7-4b" title="Table 7.4b — External pressure coefficients for duopitch roofs">
      <div style={SUB}>Zone for wind direction θ = 90°</div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Pitch angle α</th>
            <th style={THS} colSpan={2}>F</th>
            <th style={THS} colSpan={2}>G</th>
            <th style={THS} colSpan={2}>H</th>
            <th style={THS} colSpan={2}>I</th>
          </tr>
          <tr>
            {['F','G','H','I'].map(z => (
              <React.Fragment key={z}>
                <th style={THS}>c<sub>pe,10</sub></th>
                <th style={THS}>c<sub>pe,1</sub></th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.α} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.α}</td>
              <td style={TDNS}>{r.F10}</td><td style={TDNS}>{r.F1}</td>
              <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td>
              <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td>
              <td style={TDNS}>{r.I10}</td><td style={TDNS}>{r.I1}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.5 ────────────────────────────────────────────────────────────────
function Table75() {
  const rows = [
    { α: '5°',   F10: '-1,7', F1: '-2,5', G10: '-1,2', G1: '-2,0', H10: '-0,6', H1: '-1,2', Fp: '+0,0', Gp: '+0,0', Hp: '+0,0', I10: '-0,3', J10: '-0,6', K10: '-0,6', L10: '-1,2', L1: '-2,0', M10: '-0,6', M1: '-1,2', N10: '-0,4', N1: '—' },
    { α: '15°',  F10: '-0,9', F1: '-2,0', G10: '-0,8', G1: '-1,5', H10: '-0,3', H1: '—',    Fp: '+0,2', Gp: '+0,2', Hp: '+0,2', I10: '-0,5', J10: '-1,0', K10: '-1,5', L10: '-1,2', L1: '-2,0', M10: '-0,6', M1: '-1,2', N10: '-0,3', N1: '—' },
    { α: '30°',  F10: '-0,5', F1: '-1,5', G10: '-0,5', G1: '-1,5', H10: '-0,2', H1: '—',    Fp: '+0,5', Gp: '+0,7', Hp: '+0,4', I10: '-0,4', J10: '-0,7', K10: '-1,2', L10: '-1,4', L1: '-2,0', M10: '-0,8', M1: '-1,2', N10: '-0,2', N1: '—' },
    { α: '45°',  F10: '-0,0', F1: '—',    G10: '-0,0', G1: '—',    H10: '-0,0', H1: '—',    Fp: '+0,7', Gp: '+0,7', Hp: '+0,6', I10: '-0,3', J10: '-0,6', K10: '-0,3', L10: '-1,3', L1: '-2,0', M10: '-0,8', M1: '-1,2', N10: '-0,2', N1: '—' },
    { α: '60°',  F10: '+0,7', F1: '+0,7', G10: '+0,7', G1: '+0,7', H10: '+0,7', H1: '+0,7',  Fp: '—',   Gp: '—',   Hp: '—',    I10: '-0,3', J10: '-0,6', K10: '-0,3', L10: '-1,2', L1: '-2,0', M10: '-0,4', M1: '—',    N10: '-0,2', N1: '—' },
    { α: '75°',  F10: '+0,8', F1: '+0,8', G10: '+0,8', G1: '+0,8', H10: '+0,8', H1: '+0,8',  Fp: '—',   Gp: '—',   Hp: '—',    I10: '-0,3', J10: '-0,6', K10: '-0,3', L10: '-1,2', L1: '-2,0', M10: '-0,4', M1: '—',    N10: '-0,2', N1: '—' },
  ]
  return (
    <TableBlock id="t7-5" title="Table 7.5 — External pressure coefficients for hipped roofs of buildings"
      notes={<>
        <div><strong>NOTE 1</strong>  At θ = 0° the pressures changes rapidly between positive and negative values on the windward face at pitch angle of α = +5° to +45°, so both positive and negative values are given. For those roofs, two cases should be considered: one with all positive values, and one with all negative values. No mixing of positive and negative values are allowed.</div>
        <div><strong>NOTE 2</strong>  Linear interpolation for intermediate pitch angles of the same sign may be used between values of the same sign. The values equal to 0.0 are given for interpolation purposes.</div>
        <div><strong>NOTE 3</strong>  The pitch angle of the windward face always will govern the pressure coefficients.</div>
      </>}>
      <div style={SUB}>Zone for wind direction θ = 0° and θ = 90°</div>
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Pitch angle α</th>
            <th style={THS} colSpan={3}>F</th>
            <th style={THS} colSpan={3}>G</th>
            <th style={THS} colSpan={3}>H</th>
            <th style={THS}>I</th>
            <th style={THS}>J</th>
            <th style={THS}>K</th>
            <th style={THS} colSpan={2}>L</th>
            <th style={THS} colSpan={2}>M</th>
            <th style={THS} colSpan={2}>N</th>
          </tr>
          <tr>
            <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th><th style={{ ...THS, color: '#059669' }}>+</th>
            <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th><th style={{ ...THS, color: '#059669' }}>+</th>
            <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th><th style={{ ...THS, color: '#059669' }}>+</th>
            <th style={THS}>c<sub>pe,10</sub></th>
            <th style={THS}>c<sub>pe,10</sub></th>
            <th style={THS}>c<sub>pe,10</sub></th>
            <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th>
            <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th>
            <th style={THS}>c<sub>pe,10</sub></th><th style={THS}>c<sub>pe,1</sub></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.α} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.α}</td>
              <td style={TDNS}>{r.F10}</td><td style={TDNS}>{r.F1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Fp}</td>
              <td style={TDNS}>{r.G10}</td><td style={TDNS}>{r.G1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Gp}</td>
              <td style={TDNS}>{r.H10}</td><td style={TDNS}>{r.H1}</td><td style={{ ...TDNS, color: '#059669' }}>{r.Hp}</td>
              <td style={TDNS}>{r.I10}</td>
              <td style={TDNS}>{r.J10}</td>
              <td style={TDNS}>{r.K10}</td>
              <td style={TDNS}>{r.L10}</td><td style={TDNS}>{r.L1}</td>
              <td style={TDNS}>{r.M10}</td><td style={TDNS}>{r.M1}</td>
              <td style={TDNS}>{r.N10}</td><td style={TDNS}>{r.N1}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.6 ────────────────────────────────────────────────────────────────
function Table76() {
  const rows = [
    { α: '0°',  blockage: 'Max all φ',   cf: '+0,2', A: '+0,5', B: '+1,8', C: '+1,1' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-0,5', A: '-0,6', B: '-1,3', C: '-1,4' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,5', B: '-1,8', C: '-2,2' },
    { α: '5°',  blockage: 'Max all φ',   cf: '+0,4', A: '+0,8', B: '+2,1', C: '+1,3' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-0,7', A: '-1,1', B: '-1,7', C: '-1,8' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,6', B: '-2,2', C: '-2,5' },
    { α: '10°', blockage: 'Max all φ',   cf: '+0,5', A: '+1,2', B: '+2,4', C: '+1,6' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-0,9', A: '-1,5', B: '-2,0', C: '-2,1' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,4', A: '-2,1', B: '-2,6', C: '-2,7' },
    { α: '15°', blockage: 'Max all φ',   cf: '+0,7', A: '+1,4', B: '+2,7', C: '+1,8' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-1,1', A: '-1,8', B: '-2,4', C: '-2,5' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,6', B: '-2,9', C: '-3,0' },
    { α: '20°', blockage: 'Max all φ',   cf: '+0,8', A: '+1,7', B: '+2,9', C: '+2,1' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-1,3', A: '-2,2', B: '-2,8', C: '-2,9' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,6', B: '-2,9', C: '-3,0' },
    { α: '25°', blockage: 'Max all φ',   cf: '+1,0', A: '+2,0', B: '+3,1', C: '+2,3' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-1,6', A: '-2,6', B: '-3,2', C: '-3,2' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,5', B: '-2,5', C: '-2,8' },
    { α: '30°', blockage: 'Max all φ',   cf: '+1,2', A: '+2,2', B: '+3,2', C: '+2,4' },
    { α: '',    blockage: 'Min φ = 0',   cf: '-1,8', A: '-3,0', B: '-3,8', C: '-3,6' },
    { α: '',    blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,5', B: '-2,2', C: '-2,7' },
  ]
  return (
    <TableBlock id="t7-6" title="Table 7.6 — cₚ,net and cₑ values for monopitch canopies"
      notes={<>
        <div>+ values indicate a net downward acting wind action</div>
        <div>- values represent a net upward acting wind action</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left' }}>Roof angle α</th>
          <th style={{ ...THS, textAlign: 'left' }}>Blockage φ</th>
          <th style={THS}>Overall Force c<sub>f</sub></th>
          <th style={THS}>Zone A</th>
          <th style={THS}>Zone B</th>
          <th style={THS}>Zone C</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={i} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: r.α ? 700 : 400, color: r.α ? '#3b82f6' : '#1e293b' }}>{r.α}</td>
              <td style={TDLS}>{r.blockage}</td>
              <td style={TDNS}>{r.cf}</td>
              <td style={TDNS}>{r.A}</td>
              <td style={TDNS}>{r.B}</td>
              <td style={TDNS}>{r.C}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.7 ────────────────────────────────────────────────────────────────
function Table77() {
  const rows = [
    { α: '-20°', blockage: 'Max all φ',   cf: '+0,7', A: '+0,8', B: '+1,6', C: '+0,6', D: '+1,7' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,7', A: '-0,9', B: '-1,3', C: '-1,6', D: '-0,6' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,5', B: '-2,4', C: '-2,4', D: '-0,6' },
    { α: '-15°', blockage: 'Max all φ',   cf: '+0,5', A: '+0,6', B: '+1,5', C: '+0,7', D: '+1,4' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,6', A: '-0,8', B: '-1,3', C: '-1,6', D: '-0,6' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,6', B: '-2,7', C: '-2,6', D: '-0,6' },
    { α: '-10°', blockage: 'Max all φ',   cf: '+0,4', A: '+0,6', B: '+1,4', C: '+0,8', D: '+1,1' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,6', A: '-0,8', B: '-1,3', C: '-1,5', D: '-0,6' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,6', B: '-2,7', C: '-2,6', D: '-0,6' },
    { α: '-5°',  blockage: 'Max all φ',   cf: '+0,3', A: '+0,5', B: '+1,5', C: '+0,8', D: '+0,8' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,5', A: '-0,7', B: '-1,3', C: '-1,6', D: '-0,6' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,5', B: '-2,4', C: '-2,4', D: '-0,6' },
    { α: '+5°',  blockage: 'Max all φ',   cf: '+0,3', A: '+0,6', B: '+1,8', C: '+1,3', D: '+0,4' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,6', A: '-0,6', B: '-1,4', C: '-1,4', D: '-1,1' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,3', B: '-2,0', C: '-1,8', D: '-1,5' },
    { α: '+10°', blockage: 'Max all φ',   cf: '+0,4', A: '+0,7', B: '+1,8', C: '+1,4', D: '+0,4' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,7', A: '-0,7', B: '-1,5', C: '-1,4', D: '-1,4' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,3', B: '-2,0', C: '-1,8', D: '-1,8' },
    { α: '+15°', blockage: 'Max all φ',   cf: '+0,4', A: '+0,9', B: '+1,9', C: '+1,4', D: '+0,4' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,8', A: '-0,9', B: '-1,7', C: '-1,4', D: '-1,8' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,3', B: '-2,2', C: '-1,6', D: '-2,1' },
    { α: '+20°', blockage: 'Max all φ',   cf: '+0,6', A: '+1,1', B: '+1,9', C: '+1,5', D: '+0,4' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-0,9', A: '-1,2', B: '-1,8', C: '-2,0', D: '-2,0' }, // corrected from screenshot
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,4', A: '-1,4', B: '-2,2', C: '-1,6', D: '-2,1' },
    { α: '+25°', blockage: 'Max all φ',   cf: '+0,7', A: '+1,2', B: '+1,9', C: '+1,6', D: '+0,5' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-1,0', A: '-1,4', B: '-1,9', C: '-1,4', D: '-2,0' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,4', B: '-2,0', C: '-1,5', D: '-2,0' },
    { α: '+30°', blockage: 'Max all φ',   cf: '+0,9', A: '+1,3', B: '+1,9', C: '+1,6', D: '+0,7' },
    { α: '',     blockage: 'Min φ = 0',   cf: '-1,0', A: '-1,4', B: '-1,9', C: '-1,4', D: '-2,0' },
    { α: '',     blockage: 'Min φ = 1',   cf: '-1,3', A: '-1,4', B: '-1,8', C: '-1,4', D: '-2,0' },
  ]
  return (
    <TableBlock id="t7-7" title="Table 7.7 — cₚ,net and cₑ values for duopitch canopies"
      notes={<>
        <div>+ values indicate a net downward acting wind action</div>
        <div>- values represent a net upward acting wind action</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left' }}>Roof angle α [°]</th>
          <th style={{ ...THS, textAlign: 'left' }}>Blockage φ</th>
          <th style={THS}>Overall Force c<sub>f</sub></th>
          <th style={THS}>Zone A</th>
          <th style={THS}>Zone B</th>
          <th style={THS}>Zone C</th>
          <th style={THS}>Zone D</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={i} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: r.α ? 700 : 400, color: r.α ? '#3b82f6' : '#1e293b' }}>{r.α}</td>
              <td style={TDLS}>{r.blockage}</td>
              <td style={TDNS}>{r.cf}</td>
              <td style={TDNS}>{r.A}</td>
              <td style={TDNS}>{r.B}</td>
              <td style={TDNS}>{r.C}</td>
              <td style={TDNS}>{r.D}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.8 ────────────────────────────────────────────────────────────────
function Table78() {
  const rows = [
    { bay: '1', loc: 'End bay',                   down: '1,0', up: '0,8' },
    { bay: '2', loc: 'Second bay',                down: '0,9', up: '0,7' },
    { bay: '3', loc: 'Third and subsequent bays', down: '0,7', up: '0,7' },
  ]
  return (
    <TableBlock id="t7-8" title="Table 7.8 — Reduction factors ψₘₙ for multibay canopies">
      <Table>
        <thead>
          <tr>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Bay</th>
            <th style={{ ...THS, textAlign: 'left' }} rowSpan={2}>Location</th>
            <th style={THS} colSpan={2}>ψ<sub>mc</sub> factors for all φ</th>
          </tr>
          <tr>
            <th style={{ ...THS, minWidth: 160 }}>on maximum (downward) force and pressure coefficients</th>
            <th style={{ ...THS, minWidth: 160 }}>on minimum (upward) force and pressure coefficients</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.bay} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.bay}</td>
              <td style={TDLS}>{r.loc}</td>
              <td style={TDNS}>{r.down}</td>
              <td style={TDNS}>{r.up}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.9 ────────────────────────────────────────────────────────────────
function Table79() {
  return (
    <TableBlock id="t7-9" title="Table 7.9 — Recommended pressure coefficients cₚ,net for free-standing walls and parapets"
      notes={<>
        <div><sup>a</sup>  Linear interpolation may be used for return corner lengths between 0,0 and h</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left' }}>Solidity</th>
          <th style={{ ...THS, textAlign: 'left', minWidth: 160 }}>Zone</th>
          <th style={THS}>A</th>
          <th style={THS}>B</th>
          <th style={THS}>C</th>
          <th style={THS}>D</th>
        </tr></thead>
        <tbody>
          <TR stripe={false}>
            <td style={{ ...TDLS, fontWeight: 700 }} rowSpan={4}>φ = 1</td>
            <td style={TDLS}>Without return corners — ℓ/h ≤ 3</td>
            <td style={TDNS}>2,3</td><td style={TDNS}>1,4</td><td style={TDNS}>1,2</td><td style={TDNS}>1,2</td>
          </TR>
          <TR stripe={true}>
            <td style={TDLS}>Without return corners — ℓ/h = 5</td>
            <td style={TDNS}>2,9</td><td style={TDNS}>1,8</td><td style={TDNS}>1,4</td><td style={TDNS}>1,2</td>
          </TR>
          <TR stripe={false}>
            <td style={TDLS}>Without return corners — ℓ/h ≥ 10</td>
            <td style={TDNS}>3,4</td><td style={TDNS}>2,1</td><td style={TDNS}>1,7</td><td style={TDNS}>1,2</td>
          </TR>
          <TR stripe={true}>
            <td style={TDLS}>With return corners of length ≥ h<sup>a</sup></td>
            <td style={TDNS}>2,1</td><td style={TDNS}>1,8</td><td style={TDNS}>1,4</td><td style={TDNS}>1,2</td>
          </TR>
          <TR stripe={false}>
            <td style={{ ...TDLS, fontWeight: 700 }}>φ = 0,8</td>
            <td style={TDLS}>—</td>
            <td style={TDNS}>1,2</td><td style={TDNS}>1,2</td><td style={TDNS}>1,2</td><td style={TDNS}>1,2</td>
          </TR>
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.10 ───────────────────────────────────────────────────────────────
function Table710() {
  const rows = [
    { surface: 'Smooth (i.e. steel, smooth concrete)',    cfr: '0,01' },
    { surface: 'Rough (i.e. rough concrete, tar-boards)', cfr: '0,02' },
    { surface: 'Very rough (i.e. ripples, ribs, folds)',  cfr: '0,04' },
  ]
  return (
    <TableBlock id="t7-10" title="Table 7.10 — Frictional coefficients cⁱᵣ for walls, parapets and roof surfaces">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', minWidth: 280 }}>Surface</th>
          <th style={THS}>Friction coefficient c<sub>fr</sub></th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.surface} stripe={i % 2 !== 0}>
              <td style={TDLS}>{r.surface}</td>
              <td style={TDNS}>{r.cfr}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.11 ───────────────────────────────────────────────────────────────
function Table711() {
  const rows = [
    { sides: '5',    section: 'Pentagon',    finish: 'all',                         re: 'All',                              cf0: '1,80' },
    { sides: '6',    section: 'Hexagon',     finish: 'all',                         re: 'All',                              cf0: '1,60' },
    { sides: '8',    section: 'Octagon',     finish: 'surface smooth r/b < 0,075',  re: 'Re ≤ 2,4·10⁵',                    cf0: '1,45' },
    { sides: '',     section: '',            finish: '',                             re: 'Re ≥ 3·10⁵',                      cf0: '1,30' },
    { sides: '',     section: '',            finish: 'surface smooth r/b ≥ 0,075',  re: 'Re ≤ 2·10⁵',                      cf0: '1,30' },
    { sides: '',     section: '',            finish: '',                             re: 'Re ≥ 7·10⁵',                      cf0: '1,10' },
    { sides: '10',   section: 'Decagon',     finish: 'all',                         re: 'All',                              cf0: '1,30' },
    { sides: '12',   section: 'Dodecagon',   finish: 'surface smooth corners rounded', re: '2·10⁵ < Re < 1,2·10⁶',         cf0: '0,90' },
    { sides: '',     section: '',            finish: 'all others',                  re: 'Re < 4·10⁵',                      cf0: '1,30' },
    { sides: '',     section: '',            finish: '',                             re: 'Re > 4·10⁵',                      cf0: '1,10' },
    { sides: '16-18',section: 'Hexdecagon', finish: 'surface smooth corners rounded', re: 'Re < 2·10⁵',                    cf0: 'treat as circular cylinder, see (7.9)' },
    { sides: '',     section: '',            finish: '',                             re: '2·10⁵ ≤ Re < 1,2·10⁶',           cf0: '0,70' },
  ]
  return (
    <TableBlock id="t7-11" title="Table 7.11 — Force coefficient cⁱ,₀ for regular polygonal sections"
      notes={<>
        <div>Reynolds number with v = v<sub>m</sub> and v<sub>m</sub> given in 4.3, Re, is defined in 7.9</div>
        <div>r = corner radius, b = diameter of circumscribed circumference, see Figure 7.26</div>
        <div>From wind tunnel tests on sectional models with galvanised steel surface and a section with b = 0,3 m and corner radius of 0,06·b</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left' }}>No. of sides</th>
          <th style={{ ...THS, textAlign: 'left' }}>Sections</th>
          <th style={{ ...THS, textAlign: 'left' }}>Finish of surface and of corners</th>
          <th style={{ ...THS, textAlign: 'left' }}>Reynolds number Re<sup>(1)</sup></th>
          <th style={THS}>c<sub>f,0</sub></th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={i} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: r.sides ? 700 : 400, color: r.sides ? '#1e293b' : '#1e293b' }}>{r.sides}</td>
              <td style={TDLS}>{r.section}</td>
              <td style={TDLS}>{r.finish}</td>
              <td style={TDLS}>{r.re}</td>
              <td style={TDNS}>{r.cf0}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.12 ───────────────────────────────────────────────────────────────
function Table712() {
  const rows = [
    { Re: '5·10⁵',  amin: '85', cpomin: '-2,2', aA: '135', cpoh: '-0,4' },
    { Re: '2·10⁶',  amin: '80', cpomin: '-1,9', aA: '120', cpoh: '-0,7' },
    { Re: '10⁷',    amin: '75', cpomin: '-1,5', aA: '105', cpoh: '-0,8' },
  ]
  return (
    <TableBlock id="t7-12"
      title="Table 7.12 — Typical values for the pressure distribution for circular cylinders for different Reynolds number ranges and without end-effects"
      notes={<>
        <div>α<sub>min</sub>  is the position of the minimum pressure in [°]</div>
        <div>c<sub>p0,min</sub>  is the value of the minimum pressure coefficient</div>
        <div>α<sub>A</sub>  is the position of the flow separation in [°]</div>
        <div>c<sub>p0,h</sub>  is the base pressure coefficient</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={THS}>Re</th>
          <th style={THS}>α<sub>min</sub> [°]</th>
          <th style={THS}>c<sub>p0,min</sub></th>
          <th style={THS}>α<sub>A</sub> [°]</th>
          <th style={THS}>c<sub>p0,h</sub></th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.Re} stripe={i % 2 !== 0}>
              <td style={{ ...TDNS, fontWeight: 700 }}>{r.Re}</td>
              <td style={TDNS}>{r.amin}</td>
              <td style={TDNS}>{r.cpomin}</td>
              <td style={TDNS}>{r.aA}</td>
              <td style={TDNS}>{r.cpoh}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.13 ───────────────────────────────────────────────────────────────
function Table713() {
  const rows = [
    { surf: 'glass',           k: '0,0015', surf2: 'smooth concrete', k2: '0,2' },
    { surf: 'polished metal',  k: '0,002',  surf2: 'planed wood',     k2: '0,5' },
    { surf: 'fine paint',      k: '0,006',  surf2: 'rough concrete',  k2: '1,0' },
    { surf: 'spray paint',     k: '0,02',   surf2: 'rough sawn wood', k2: '2,0' },
    { surf: 'bright steel',    k: '0,05',   surf2: 'rust',            k2: '2,0' },
    { surf: 'cast iron',       k: '0,2',    surf2: 'brickwork',       k2: '3,0' },
    { surf: 'galvanised steel',k: '0,2',    surf2: '',                k2: ''    },
  ]
  return (
    <TableBlock id="t7-13" title="Table 7.13 — Equivalent surface roughness k">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', minWidth: 140 }}>Type of surface</th>
          <th style={THS}>Equiv. roughness k (mm)</th>
          <th style={{ ...THS, textAlign: 'left', minWidth: 140 }}>Type of surface</th>
          <th style={THS}>Equiv. roughness k (mm)</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.surf} stripe={i % 2 !== 0}>
              <td style={TDLS}>{r.surf}</td>
              <td style={TDNS}>{r.k}</td>
              <td style={TDLS}>{r.surf2}</td>
              <td style={TDNS}>{r.k2}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.14 ───────────────────────────────────────────────────────────────
function Table714() {
  return (
    <TableBlock id="t7-14" title="Table 7.14 — Factor κ for vertical cylinders in a row arrangement"
      notes={<>
        <div>a: distance between cylinder centres</div>
        <div>b: cylinder diameter</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', minWidth: 140 }}>a/b</th>
          <th style={THS}>κ</th>
        </tr></thead>
        <tbody>
          <TR stripe={false}>
            <td style={TDLS}>a/b &lt; 3,5</td>
            <td style={TDNS}>1,15</td>
          </TR>
          <TR stripe={true}>
            <td style={TDLS}>3,5 &lt; a/b &lt; 30</td>
            <td style={TDLS}>κ = (210 − a/b) / 180</td>
          </TR>
          <TR stripe={false}>
            <td style={TDLS}>a/b &gt; 30</td>
            <td style={TDNS}>1,00</td>
          </TR>
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 7.15 ───────────────────────────────────────────────────────────────
function Table715() {
  return (
    <TableBlock id="t7-15" title="Table 7.15 — Force coefficients cⁱ for flags"
      notes="NOTE  The equation for free flags includes dynamic forces from the flag flutter effect.">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', minWidth: 200 }}>Flags</th>
          <th style={THS}>A<sub>ref</sub></th>
          <th style={THS}>c<sub>f</sub></th>
        </tr></thead>
        <tbody>
          <TR stripe={false}>
            <td style={TDLS}>Fixed Flags — Force normal to the plane</td>
            <td style={TDLS}>h · ℓ</td>
            <td style={TDNS}>1,8</td>
          </TR>
          <TR stripe={true}>
            <td style={TDLS}>Free Flags a) — Force in the plane</td>
            <td style={TDLS}>h · ℓ</td>
            <td style={TDLS}>0,02 + 0,7 · (m<sub>f</sub> / (ρ · h²)) · (A<sub>ref</sub> / h²)⁻¹·²⁵</td>
          </TR>
          <TR stripe={false}>
            <td style={TDLS}>Free Flags b) — Force in the plane</td>
            <td style={TDLS}>0,5 · h · ℓ</td>
            <td style={TDLS}>0,02 + 0,7 · (m<sub>f</sub> / (ρ · h²)) · (A<sub>ref</sub> / h²)⁻¹·²⁵</td>
          </TR>
        </tbody>
      </Table>
      <div style={{ fontSize: 11, color: '#1e293b', marginTop: 6 }}>
        where: m<sub>f</sub> = mass per unit area of the flag; ρ = air density (see 7.1); z<sub>e</sub> = height of the flag above ground
      </div>
    </TableBlock>
  )
}

// ─── Table 7.16 ───────────────────────────────────────────────────────────────
function Table716() {
  return (
    <TableBlock id="t7-16"
      title="Table 7.16 — Recommended values of λ for cylinders, polygonal sections, rectangular sections, sharp edged structural sections and lattice structures"
      notes="For intermediate values of ℓ, linear interpolation should be used.">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', width: 50 }}>No.</th>
          <th style={{ ...THS, textAlign: 'left', minWidth: 200 }}>Position of the structure (wind normal to plane)</th>
          <th style={{ ...THS, textAlign: 'left', minWidth: 280 }}>Effective slenderness λ</th>
        </tr></thead>
        <tbody>
          <TR stripe={false}>
            <td style={{ ...TDNS, fontWeight: 700 }}>1</td>
            <td style={TDLS}>Structure on ground, z<sub>g</sub> ≥ b, for b ≤ ℓ</td>
            <td style={TDLS}>
              Polygonal, rectangular, sharp edged &amp; lattice:<br/>
              · for ℓ ≥ 50 m: λ = 1,4 ℓ/b or λ = 70, whichever is smaller<br/>
              · for ℓ &lt; 15 m: λ = 2 ℓ/b or λ = 70, whichever is smaller
            </td>
          </TR>
          <TR stripe={true}>
            <td style={{ ...TDNS, fontWeight: 700 }}>2</td>
            <td style={TDLS}>Structure on ground with adjacent structures, b<sub>1</sub> ≤ 1,5b, b ≤ ℓ, b<sub>0</sub> ≥ 2,5b</td>
            <td style={TDLS}>
              Circular cylinders:<br/>
              · for ℓ ≥ 50 m: λ = 0,7 ℓ/b or λ = 70, whichever is smaller<br/>
              · for ℓ &lt; 15 m: λ = ℓ/b or λ = 70, whichever is smaller
            </td>
          </TR>
          <TR stripe={false}>
            <td style={{ ...TDNS, fontWeight: 700 }}>3</td>
            <td style={TDLS}>Structure free at top, b/2 extension at base</td>
            <td style={TDLS}>Same as No. 1 (polygonal/rectangular)</td>
          </TR>
          <TR stripe={true}>
            <td style={{ ...TDNS, fontWeight: 700 }}>4</td>
            <td style={TDLS}>Structure free at top with b<sub>1</sub> ≥ 2,5b and z<sub>g</sub> ≥ 2b</td>
            <td style={TDLS}>
              · for ℓ ≥ 50 m: λ = 0,7 ℓ/b or λ = 70, whichever is larger<br/>
              · for ℓ &lt; 15 m: λ = ℓ/b or λ = 70, whichever is larger
            </td>
          </TR>
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 8.1 ────────────────────────────────────────────────────────────────
function Table81() {
  const rows = [
    { system: 'Open parapet or open safety barrier',    one: 'd + 0,3 m', both: 'd + 0,6 m' },
    { system: 'Solid parapet or solid safety barrier',  one: 'd + d₁',   both: 'd + 2d₁'  },
    { system: 'Open parapet and open safety barrier',   one: 'd + 0,6 m', both: 'd + 1,2 m' },
  ]
  return (
    <TableBlock id="t8-1" title="Table 8.1 — Depth to be used for Aᵣef,x">
      <Table>
        <thead><tr>
          <th style={{ ...THS, textAlign: 'left', minWidth: 240 }}>Road restraint system</th>
          <th style={THS}>on one side</th>
          <th style={THS}>on both sides</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <TR key={r.system} stripe={i % 2 !== 0}>
              <td style={TDLS}>{r.system}</td>
              <td style={TDNS}>{r.one}</td>
              <td style={TDNS}>{r.both}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Table 8.2 ────────────────────────────────────────────────────────────────
function Table82() {
  return (
    <TableBlock id="t8-2" title="Table 8.2 — Recommended values of the force factor C for bridges"
      notes={<>
        <div>This table is based on the following assumptions:</div>
        <div>– terrain category II according to Table 4.1</div>
        <div>– force coefficient c<sub>f,x</sub> according to 8.3.1 (1)</div>
        <div>– c<sub>o</sub> = 1,0</div>
        <div>– k<sub>i</sub> = 1,0</div>
        <div>For intermediate values of b/d<sub>tot</sub>, and of z<sub>e</sub> linear interpolation may be used.</div>
      </>}>
      <Table>
        <thead><tr>
          <th style={THS}>b/d<sub>tot</sub></th>
          <th style={THS}>z<sub>e</sub> ≤ 20 m</th>
          <th style={THS}>z<sub>e</sub> = 50 m</th>
        </tr></thead>
        <tbody>
          <TR stripe={false}>
            <td style={TDNS}>≤ 0,5</td>
            <td style={TDNS}>6,7</td>
            <td style={TDNS}>8,3</td>
          </TR>
          <TR stripe={true}>
            <td style={TDNS}>≥ 4,0</td>
            <td style={TDNS}>3,6</td>
            <td style={TDNS}>4,5</td>
          </TR>
        </tbody>
      </Table>
    </TableBlock>
  )
}

// ─── Search + index ───────────────────────────────────────────────────────────
const ALL_TABLES = [
  { id: 't4-1',  label: 'Table 4.1',  title: 'Terrain categories and terrain parameters',                                  section: 'Chapter 4' },
  { id: 't5-1',  label: 'Table 5.1',  title: 'Calculation procedures for the determination of wind actions',               section: 'Chapter 5' },
  { id: 't7-1',  label: 'Table 7.1',  title: 'Recommended values of external pressure coefficients for vertical walls',    section: 'Section 7' },
  { id: 't7-2',  label: 'Table 7.2',  title: 'External pressure coefficients for flat roofs',                             section: 'Section 7' },
  { id: 't7-3a', label: 'Table 7.3a', title: 'External pressure coefficients for monopitch roofs',                        section: 'Section 7' },
  { id: 't7-3b', label: 'Table 7.3b', title: 'External pressure coefficients for monopitch roofs (θ = 90°)',              section: 'Section 7' },
  { id: 't7-4a', label: 'Table 7.4a', title: 'External pressure coefficients for duopitch roofs (θ = 0°)',                section: 'Section 7' },
  { id: 't7-4b', label: 'Table 7.4b', title: 'External pressure coefficients for duopitch roofs (θ = 90°)',               section: 'Section 7' },
  { id: 't7-5',  label: 'Table 7.5',  title: 'External pressure coefficients for hipped roofs',                           section: 'Section 7' },
  { id: 't7-6',  label: 'Table 7.6',  title: 'cp,net and cf values for monopitch canopies',                               section: 'Section 7' },
  { id: 't7-7',  label: 'Table 7.7',  title: 'cp,net and cf values for duopitch canopies',                                section: 'Section 7' },
  { id: 't7-8',  label: 'Table 7.8',  title: 'Reduction factors ψmc for multibay canopies',                               section: 'Section 7' },
  { id: 't7-9',  label: 'Table 7.9',  title: 'Recommended pressure coefficients cp,net for free-standing walls and parapets', section: 'Section 7' },
  { id: 't7-10', label: 'Table 7.10', title: 'Frictional coefficients cfr for walls, parapets and roof surfaces',         section: 'Section 7' },
  { id: 't7-11', label: 'Table 7.11', title: 'Force coefficient cf,0 for regular polygonal sections',                     section: 'Section 7' },
  { id: 't7-12', label: 'Table 7.12', title: 'Pressure distribution for circular cylinders (Reynolds number)',            section: 'Section 7' },
  { id: 't7-13', label: 'Table 7.13', title: 'Equivalent surface roughness k',                                            section: 'Section 7' },
  { id: 't7-14', label: 'Table 7.14', title: 'Factor κ for vertical cylinders in a row arrangement',                      section: 'Section 7' },
  { id: 't7-15', label: 'Table 7.15', title: 'Force coefficients cf for flags',                                           section: 'Section 7' },
  { id: 't7-16', label: 'Table 7.16', title: 'Recommended values of λ for cylinders, polygonal, rectangular sections',    section: 'Section 7' },
  { id: 't8-1',  label: 'Table 8.1',  title: 'Depth to be used for Aref,x',                                               section: 'Chapter 8' },
  { id: 't8-2',  label: 'Table 8.2',  title: 'Recommended values of the force factor C for bridges',                      section: 'Chapter 8' },
]

// ─── Exported table renderers ────────────────────────────────────────────────
export { Table41, Table51, Table71, Table72, Table73a, Table73b, Table74a, Table74b, Table75, Table76, Table77, Table78, Table79, Table710, Table711, Table712, Table713, Table714, Table715, Table716, Table81, Table82 }

const TABLE_COMPONENTS: Record<string, () => React.ReactElement> = {
  't4-1':  Table41,  't5-1':  Table51,
  't7-1':  Table71,  't7-2':  Table72,
  't7-3a': Table73a, 't7-3b': Table73b,
  't7-4a': Table74a, 't7-4b': Table74b,
  't7-5':  Table75,  't7-6':  Table76,
  't7-7':  Table77,  't7-8':  Table78,
  't7-9':  Table79,  't7-10': Table710,
  't7-11': Table711, 't7-12': Table712,
  't7-13': Table713, 't7-14': Table714,
  't7-15': Table715, 't7-16': Table716,
  't8-1':  Table81,  't8-2':  Table82,
}

const GROUPED = [
  { section: 'Chapter 4', label: 'Ch. 4 — Wind climate' },
  { section: 'Chapter 5', label: 'Ch. 5 — Wind actions' },
  { section: 'Section 7', label: 'Sec. 7 — Pressure / force coefficients' },
  { section: 'Chapter 8', label: 'Ch. 8 — Bridges' },
]

const PANEL_MIN = 40
const PANEL_MAX = 480
const PANEL_DEFAULT = 240

export default function WindTables() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT)
  const [collapsed, setCollapsed] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = collapsed ? 0 : panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const next = startW.current + ev.clientX - startX.current
      if (next > PANEL_MIN) {
        setCollapsed(false)
        setPanelWidth(Math.min(PANEL_MAX, next))
      } else {
        setCollapsed(true)
      }
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [collapsed, panelWidth])

  const q = query.toLowerCase().trim()
  const filtered = q
    ? ALL_TABLES.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q)
      )
    : ALL_TABLES

  const ActiveComp = active ? TABLE_COMPONENTS[active] : null
  const effectiveW = collapsed ? PANEL_MIN : panelWidth

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── left panel ── */}
      <div style={{ width: effectiveW, flexShrink: 0, background: '#fafafa', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: collapsed ? 'width 0.18s' : 'none' }}>
        {collapsed
          ? (
            /* collapsed: show only icon buttons */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 4 }}>
              <div style={{ fontSize: 14, marginBottom: 4 }} title="EN 1991-1-4 Tables">📋</div>
              {ALL_TABLES.slice(0, 5).map(t => (
                <button key={t.id} onClick={() => { setCollapsed(false); setActive(t.id) }} title={t.label}
                  style={{ width: 32, height: 24, fontSize: 9, fontWeight: 700, color: active === t.id ? '#1d4ed8' : '#1e293b', background: active === t.id ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}>
                  {t.label.replace('Table ', 'T')}
                </button>
              ))}
            </div>
          )
          : (
            <>
              {/* fixed header */}
              <div style={{ padding: '12px 12px 10px', flexShrink: 0, background: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  EN 1991-1-4 Tables
                </div>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActive(null) }}
                  placeholder="Search tables…"
                  style={{ width: '100%', padding: '6px 9px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, background: '#fff', boxSizing: 'border-box' as const, outline: 'none' }}
                />
              </div>
              {/* scrollable list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {q
                  ? (
                    <div>
                      {filtered.length === 0 && (
                        <div style={{ padding: '8px 14px', fontSize: 12, color: '#1e293b' }}>No results</div>
                      )}
                      {filtered.map(t => (
                        <button key={t.id} onClick={() => setActive(t.id)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: active === t.id ? '#eff6ff' : 'transparent', border: 'none', borderLeft: `3px solid ${active === t.id ? '#3b82f6' : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: active === t.id ? '#1d4ed8' : '#3b82f6', whiteSpace: 'nowrap' }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4, marginTop: 2, wordBreak: 'break-word' as const }}>{t.title}</div>
                        </button>
                      ))}
                    </div>
                  )
                  : GROUPED.map(g => {
                      const items = ALL_TABLES.filter(t => t.section === g.section)
                      return (
                        <div key={g.section}>
                          <div style={{ padding: '6px 12px 4px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', background: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {g.label}
                          </div>
                          {items.map(t => (
                            <button key={t.id} onClick={() => setActive(t.id)}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: active === t.id ? '#eff6ff' : 'transparent', border: 'none', borderLeft: `3px solid ${active === t.id ? '#3b82f6' : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                              onMouseEnter={e => { if (active !== t.id) e.currentTarget.style.background = '#f0f9ff' }}
                              onMouseLeave={e => { if (active !== t.id) e.currentTarget.style.background = 'transparent' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: active === t.id ? '#1d4ed8' : '#3b82f6', whiteSpace: 'nowrap' }}>{t.label}</div>
                              <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4, marginTop: 2, wordBreak: 'break-word' as const }}>{t.title}</div>
                            </button>
                          ))}
                        </div>
                      )
                    })
                }
              </div>
            </>
          )
        }
      </div>

      {/* ── drag handle + collapse toggle ── */}
      <div
        onMouseDown={onMouseDown}
        style={{ width: 4, flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        onMouseEnter={e => { if (!collapsed) e.currentTarget.style.background = '#93c5fd' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 24, background: '#cbd5e1', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1e293b', padding: 0, zIndex: 1 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* ── right panel ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', minWidth: 0 }}>
        {ActiveComp
          ? <ActiveComp />
          : (
            <div style={{ color: '#1e293b', fontSize: 13, marginTop: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>SS EN 1991-1-4 : 2009</div>
              <div>Select a table from the left panel, or search by name.</div>
              <div style={{ marginTop: 8, fontSize: 11 }}>{ALL_TABLES.length} tables available</div>
            </div>
          )
        }
      </div>
    </div>
  )
}

