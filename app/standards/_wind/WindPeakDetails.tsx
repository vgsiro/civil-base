'use client'
import { DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef } from '../_lib/ui'
import { TERRAIN_CATS } from '../_lib/wind-types'
import { calcPeakPressure } from '../_lib/wind-helpers'
import { Table41 } from './WindTables'

const PROSE = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' } as const

export default function WindPeakDetails({ vb, cat, z, c0, rho, id }: { vb: number; cat: string; z: number; c0: number; rho: number; id: string }) {
  const r = calcPeakPressure(vb, z, cat, c0, rho)
  const catData = TERRAIN_CATS.find(c => c.id === cat)!
  const z0 = catData.z0
  const zmin = catData.zmin
  const qb = 0.5 * rho * vb * vb / 1000   // basic velocity pressure in kPa

  return (
    <DetailsSection id={id}>
      <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
        <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §4.3, §4.4, §4.5
      </p>

      <DetailGroup title="Input Data">
        <InputDataTable>
          <InputDataRow
            param={<>Basic wind velocity</>}
            symbol={<Tex>{'v_b'}</Tex>}
            value={vb.toFixed(2)} unit="m/s"
          />
          <InputDataRow
            param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>}
            symbol={<Tex>{'\\text{Cat.}'}</Tex>}
            value={`Cat. ${cat}`}
          />
          <InputDataRow
            param="Reference height of the examined part"
            symbol={<Tex>{'z_e'}</Tex>}
            value={z.toFixed(2)} unit="m"
          />
          <InputDataRow
            param="Orography factor at reference height ze"
            symbol={<Tex>{'c_0(z_e)'}</Tex>}
            value={c0.toFixed(2)}
          />
          <InputDataRow
            param="Air density"
            symbol={<Tex>{'\\rho'}</Tex>}
            value={rho.toFixed(2)} unit="kg/m³"
          />
        </InputDataTable>
      </DetailGroup>

      <DetailGroup title="Basic wind velocity">
        <p style={PROSE}>
          The basic wind velocity v<sub>b</sub> is defined in EN 1991-1-4 §4.2(2)P as a function of wind direction and time of year at 10 m above ground of terrain Category II. The value of v<sub>b</sub> includes the effects of the directional factor c<sub>dir</sub> and the seasonal factor c<sub>season</sub> and is provided in the National Annex. In these calculations the basic wind velocity is taken as:
        </p>
        <CalcStep
          label="Basic wind velocity"
          formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`}
          result={<></>}
        />
      </DetailGroup>

      <DetailGroup title="Terrain roughness">
        <p style={PROSE}>
          The roughness length z<sub>0</sub> and the minimum height z<sub>min</sub> are specified in EN 1991-1-4 Table 4.1 as a function of the terrain category. For terrain category <strong>{cat}</strong> the corresponding values are: z<sub>0</sub> = {z0} m and z<sub>min</sub> = {zmin} m.
        </p>
        <p style={PROSE}>
          The terrain factor k<sub>r</sub> depending on the roughness length z<sub>0</sub> = {z0} m is calculated in accordance with EN 1991-1-4 equation (4.5):
        </p>
        <CalcStep
          label={<>Terrain factor <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
          formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${r.kr.toFixed(4)}`}
          result={<></>}
          note={`The terrain factor kr depends solely on the roughness length z₀ for the chosen terrain category, normalised against the reference roughness length z₀,II = 0.05 m (Category II). It scales the logarithmic wind profile to the appropriate roughness class.`}
        />
        <p style={PROSE}>
          The roughness factor c<sub>r</sub>(z<sub>e</sub>) at the reference height z<sub>e</sub> accounts for the variability of the mean wind velocity at the site. It is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {z >= zmin ? '≥' : '<'} z<sub>min</sub>:
        </p>
        <CalcStep
          label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
          formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${r.kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${r.cr.toFixed(4)}`}
          result={<></>}
          note="The roughness factor cr(z) describes the variability of mean wind velocity with height due to ground roughness. It is based on a logarithmic wind profile valid for z_min ≤ z ≤ 200 m."
        />
      </DetailGroup>

      <DetailGroup title="Orography factor">
        <p style={PROSE}>
          Where orography (e.g. hills, cliffs, escarpments) is significant, its effect on wind velocities should be taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) different from 1.0, as specified in EN 1991-1-4 §4.3.3. The recommended procedure for calculating c<sub>0</sub>(z<sub>e</sub>) is described in EN 1991-1-4 Annex A.3.
        </p>
        <CalcStep
          label="Orography factor"
          formula={`c_0(z_e) = ${c0.toFixed(3)}`}
          result={<></>}
          note={c0 === 1.0 ? "c₀ = 1.0 — flat terrain, no orography correction applied." : `c₀ = ${c0.toFixed(3)} — site-specific orography correction applied per EN 1991-1-4 §4.3.3.`}
        />
      </DetailGroup>

      <DetailGroup title="Mean wind velocity">
        <p style={PROSE}>
          The mean wind velocity v<sub>m</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> depends on the terrain roughness, terrain orography and the basic wind velocity v<sub>b</sub>. It is determined using EN 1991-1-4 equation (4.3):
        </p>
        <CalcStep
          label={<>Mean wind velocity <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
          formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${r.cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${r.vm.toFixed(2)}\\ \\mathrm{m/s}`}
          result={<></>}
          note="The mean wind velocity vm(ze) is the 10-minute mean at height ze. The orography factor c₀ accounts for speed-up over hills. On flat terrain c₀ = 1.0."
        />
      </DetailGroup>

      <DetailGroup title="Wind turbulence">
        <p style={PROSE}>
          The turbulence intensity I<sub>v</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> is defined as the standard deviation of the turbulence divided by the mean wind velocity. It is calculated in accordance with EN 1991-1-4 equation (4.7). For the examined case z<sub>e</sub> {z >= zmin ? '≥' : '<'} z<sub>min</sub>:
        </p>
        <CalcStep
          label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
          formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${r.Iv.toFixed(4)}`}
          result={<></>}
          note="kI = 1.0 is the turbulence factor (recommended value per EN 1991-1-4 §4.4). Higher turbulence intensity — rougher terrain or lower height — increases the gust factor (1 + 7·Iv) and therefore increases qp."
        />
      </DetailGroup>

      <DetailGroup title="Basic velocity pressure">
        <p style={PROSE}>
          The basic velocity pressure q<sub>b</sub> is the pressure corresponding to the wind momentum determined at the basic wind velocity v<sub>b</sub>. It is calculated according to the fundamental relation specified in EN 1991-1-4 §4.5(1):
        </p>
        <CalcStep
          label={<>Basic velocity pressure <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
          formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
          result={<></>}
          note="The basic velocity pressure qb is a reference value used to understand the energy content of the wind. Note that by definition 1 N = 1 kg·m/s². The design pressure qp(ze) is higher than qb because it includes the gust factor."
        />
      </DetailGroup>

      <DetailGroup title="Peak velocity pressure">
        <p style={PROSE}>
          The peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> includes mean and short-term velocity fluctuations. It is determined according to EN 1991-1-4 equation (4.8):
        </p>
        <CalcStep
          label={<>Peak velocity pressure <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
          formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${r.Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${r.vm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(r.qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
          result={<></>}
          note="Note that by definition 1 N = 1 kg·m/s²."
        />
        <CalcStep
          label=""
          formula={`\\Rightarrow q_p(z_e) = ${r.qp.toFixed(4)}\\ \\mathrm{kN/m^2}`}
          result={<></>}
        />
      </DetailGroup>

      <DetailGroup title="Calculation of wind forces and pressures on the structure">
        <p style={PROSE}>
          The wind actions on the structure (forces and pressures) depend on q<sub>p</sub>(z<sub>e</sub>) as follows.
        </p>
        <p style={{ ...PROSE, fontWeight: 600 }}>Wind pressures on surfaces</p>
        <p style={PROSE}>
          The wind pressure on surfaces is derived from q<sub>p</sub>(z<sub>e</sub>) = {r.qp.toFixed(4)} kN/m² by application of the appropriate pressure coefficient, as specified in EN 1991-1-4 §5.2.
        </p>
        <p style={PROSE}>
          For <strong>external surfaces</strong> the wind pressure w<sub>e</sub> is:
        </p>
        <CalcStep
          label=""
          formula={`w_e = q_p(z_e) \\cdot c_{pe}`}
          result={<></>}
          note="where cpe is the external pressure coefficient from EN 1991-1-4 Section 7, depending on the structure type and zone."
        />
        <p style={PROSE}>
          For <strong>internal surfaces</strong> the wind pressure w<sub>i</sub> is:
        </p>
        <CalcStep
          label=""
          formula={`w_i = q_p(z_i) \\cdot c_{pi}`}
          result={<></>}
          note="where cpi is the internal pressure coefficient from EN 1991-1-4 Section 7, and zi is the reference height for the internal surface."
        />
        <p style={{ ...PROSE, fontWeight: 600 }}>Total wind force on structure or structural element</p>
        <p style={PROSE}>
          The overall wind force F<sub>w</sub> on the total structure or a structural element is estimated by application of the appropriate force coefficient, as specified in EN 1991-1-4 §5.3:
        </p>
        <CalcStep
          label=""
          formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}}`}
          result={<></>}
          note="cscd = structural factor (size and dynamic effects, §6). cf = force coefficient (§7–8). Aref = reference area (§7–8). cscd = 1.0 is generally conservative for buildings under 15 m height."
        />
      </DetailGroup>
    </DetailsSection>
  )
}
