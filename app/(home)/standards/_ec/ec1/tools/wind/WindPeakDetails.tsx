'use client'
import { DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef, Sub } from '@/app/(home)/standards/_lib/ui'
import { TERRAIN_CATS } from './wind-types'
import { calcPeakPressure } from './wind-helpers'
import { Table41 } from './WindTables'
import { useTranslation } from '@/app/i18n/LanguageContext'

const PROSE = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' } as const

export default function WindPeakDetails({ vb, cat, z, c0, rho, id }: { vb: number; cat: string; z: number; c0: number; rho: number; id: string }) {
  const { t } = useTranslation()
  const r = calcPeakPressure(vb, z, cat, c0, rho)
  const catData = TERRAIN_CATS.find(c => c.id === cat)!
  const z0 = catData.z0
  const zmin = catData.zmin
  const qb = 0.5 * rho * vb * vb / 1000   // basic velocity pressure in kPa

  return (
    <DetailsSection id={id}>
      <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
        <strong>{t('std_ec1w_det_according_to')}</strong> EN 1991-1-4:2005+A1:2010 §4.3, §4.4, §4.5
      </p>

      <DetailGroup title={t('std_ec1w_det_input_data')}>
        <InputDataTable>
          <InputDataRow
            param={<>{t('std_ec1w_det_param_vb')}</>}
            symbol={<Tex>{'v_b'}</Tex>}
            value={vb.toFixed(2)} unit="m/s"
          />
          <InputDataRow
            param={<>{t('std_ec1w_terrain_category')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>}
            symbol={<Tex>{'\\text{Cat.}'}</Tex>}
            value={`Cat. ${cat}`}
          />
          <InputDataRow
            param={t('std_ec1w_det_param_ze')}
            symbol={<Tex>{'z_e'}</Tex>}
            value={z.toFixed(2)} unit="m"
          />
          <InputDataRow
            param={t('std_ec1w_det_param_c0')}
            symbol={<Tex>{'c_0(z_e)'}</Tex>}
            value={c0.toFixed(2)}
          />
          <InputDataRow
            param={t('std_ec1w_det_param_rho')}
            symbol={<Tex>{'\\rho'}</Tex>}
            value={rho.toFixed(2)} unit="kg/m³"
          />
        </InputDataTable>
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_basic_vb')}>
        <p style={PROSE}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
        <CalcStep
          label={t('std_ec1w_det_basic_vb')}
          formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`}
          result={<></>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
        <p style={PROSE}>
          <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> {t('std_ec1w_det_z0_prose_post')} z<sub>0</sub> = {z0} m, z<sub>min</sub> = {zmin} m.
        </p>
        <p style={PROSE}>
          <Sub>{t('std_ec1w_det_kr_prose_pre')}</Sub> {z0} <Sub>{t('std_ec1w_det_kr_prose_post')}</Sub>
        </p>
        <CalcStep
          label={<>{t('std_ec1w_res_kr')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
          formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${r.kr.toFixed(4)}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_kr')}</Sub>}
        />
        <p style={PROSE}>
          <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {z >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
        </p>
        <CalcStep
          label={<>{t('std_ec1w_res_cr')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
          formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${r.kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${r.cr.toFixed(4)}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_cr')}</Sub>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_orography')}>
        <p style={PROSE}><Sub>{t('std_ec1w_det_c0_prose')}</Sub></p>
        <CalcStep
          label={t('std_ec1w_det_orography')}
          formula={`c_0(z_e) = ${c0.toFixed(3)}`}
          result={<></>}
          note={c0 === 1.0 ? <Sub>{t('std_ec1w_det_note_c0_flat')}</Sub> : <>c₀ = {c0.toFixed(3)} — <Sub>{t('std_ec1w_det_note_c0_site')}</Sub></>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_mean_vm')}>
        <p style={PROSE}><Sub>{t('std_ec1w_det_vm_prose')}</Sub></p>
        <CalcStep
          label={<>{t('std_ec1w_res_vm')} <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
          formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${r.cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${r.vm.toFixed(2)}\\ \\mathrm{m/s}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_vm')}</Sub>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_turbulence')}>
        <p style={PROSE}>
          <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {z >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
        </p>
        <CalcStep
          label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
          formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${r.Iv.toFixed(4)}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_iv')}</Sub>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_basic_qb')}>
        <p style={PROSE}><Sub>{t('std_ec1w_det_qb_prose')}</Sub></p>
        <CalcStep
          label={<>{t('std_ec1w_det_basic_qb')} <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
          formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_qb')}</Sub>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_peak_qp')}>
        <p style={PROSE}><Sub>{t('std_ec1w_det_qp_prose')}</Sub></p>
        <CalcStep
          label={<>{t('std_ec1w_det_peak_qp')} <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
          formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${r.Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${r.vm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(r.qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_qp')}</Sub>}
        />
        <CalcStep
          label=""
          formula={`\\Rightarrow q_p(z_e) = ${r.qp.toFixed(4)}\\ \\mathrm{kN/m^2}`}
          result={<></>}
        />
      </DetailGroup>

      <DetailGroup title={t('std_ec1w_det_wind_forces')}>
        <p style={PROSE}><Sub>{t('std_ec1w_det_forces_prose')}</Sub></p>
        <p style={{ ...PROSE, fontWeight: 600 }}>{t('std_ec1w_det_pressures_heading')}</p>
        <p style={PROSE}>
          <Sub>{t('std_ec1w_det_we_prose_pre')}</Sub> {r.qp.toFixed(4)} <Sub>{t('std_ec1w_det_we_prose_post')}</Sub>
        </p>
        <p style={PROSE}><strong>{t('std_ec1w_det_external')}</strong></p>
        <CalcStep
          label=""
          formula={`w_e = q_p(z_e) \\cdot c_{pe}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_cpe')}</Sub>}
        />
        <p style={PROSE}><strong>{t('std_ec1w_det_internal')}</strong></p>
        <CalcStep
          label=""
          formula={`w_i = q_p(z_i) \\cdot c_{pi}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_cpi')}</Sub>}
        />
        <p style={{ ...PROSE, fontWeight: 600 }}>{t('std_ec1w_det_total_force_heading')}</p>
        <p style={PROSE}><Sub>{t('std_ec1w_det_fw_prose')}</Sub></p>
        <CalcStep
          label=""
          formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}}`}
          result={<></>}
          note={<Sub>{t('std_ec1w_det_note_fw')}</Sub>}
        />
      </DetailGroup>
    </DetailsSection>
  )
}
