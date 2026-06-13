'use client'
import { useRef } from 'react'
import type { SectionRow } from '../_shared/types'
import type { SteelGrade, CrossSectionResult, MNrdRow, NbRdRow } from './ec3-engine'
import { ExportModal, type SectionGroup } from '../../../standards/_lib/print-engine'
import { useTranslation } from '../../../../i18n/LanguageContext'
import { CrossSectionDetails, BendingSection, AxialBendingSection, CompressionSection } from './CapacityPanel'

export type { ReportMeta } from '../../../standards/_lib/print-engine'

const noOp = () => {}

export function SteelSectionsExportModal({
  row, grade, cs, mbRd, mNRd, nbRd,
  selC1, selL, selN, selLcomp,
  onClose,
}: {
  row: SectionRow
  grade: SteelGrade
  cs: CrossSectionResult
  mbRd: number[][]
  mNRd: MNrdRow[]
  nbRd: NbRdRow[]
  selC1: number; selL: number
  selN: number; selLcomp: number
  onClose: () => void
}) {
  const { t } = useTranslation()

  const bendRef    = useRef<HTMLDivElement>(null)
  const bendDetRef = useRef<HTMLDivElement>(null)
  const axRef      = useRef<HTMLDivElement>(null)
  const axDetRef   = useRef<HTMLDivElement>(null)
  const compRef    = useRef<HTMLDivElement>(null)
  const compDetRef = useRef<HTMLDivElement>(null)

  const groups: SectionGroup[] = [
    {
      color: '#1d4ed8',
      label: t('bbuc_exp_bend_label'),
      desc: t('bbuc_exp_bend_desc'),
      detDesc: t('bbuc_exp_bend_detdesc'),
      refs: [bendRef, bendDetRef],
      defaultOn: true,
    },
    {
      color: '#0d9488',
      label: t('bbuc_exp_axbend_label'),
      desc: t('bbuc_exp_axbend_desc'),
      detDesc: t('bbuc_exp_axbend_detdesc'),
      refs: [axRef, axDetRef],
      defaultOn: true,
    },
    {
      color: '#b45309',
      label: t('bbuc_exp_comp_label'),
      desc: t('bbuc_exp_comp_desc'),
      detDesc: t('bbuc_exp_comp_detdesc'),
      refs: [compRef, compDetRef],
      defaultOn: true,
    },
  ]

  return (
    <ExportModal
      title={t('bbuc_exp_title')}
      defaultReport={t('bbuc_exp_default_report')}
      groups={groups}
      onClose={onClose}
    >
      {() => (
        <>
          {/* Bending results: cross-section summary + M_b,Rd table */}
          <div ref={bendRef} style={{ fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 11 }}>
            <CrossSectionDetails row={row} grade={grade} cs={cs} />
            <BendingSection
              row={row} grade={grade} mbRd={mbRd} cs={cs}
              showDetails={false} selC1={selC1} selL={selL}
              onSelC1={noOp} onSelL={noOp}
            />
          </div>

          {/* Bending details: LTB derivation at selected C1/L */}
          <div ref={bendDetRef} style={{ fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 11 }}>
            <BendingSection
              row={row} grade={grade} mbRd={mbRd} cs={cs}
              showDetails selC1={selC1} selL={selL}
              onSelC1={noOp} onSelL={noOp}
            />
          </div>

          {/* Axial+Bending results */}
          <div ref={axRef} style={{ fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 11 }}>
            <AxialBendingSection
              row={row} grade={grade} mNRd={mNRd} cs={cs}
              showDetails={false} selN={selN} onSelN={noOp}
            />
          </div>

          {/* Axial+Bending details */}
          <div ref={axDetRef} style={{ fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 11 }}>
            <AxialBendingSection
              row={row} grade={grade} mNRd={mNRd} cs={cs}
              showDetails selN={selN} onSelN={noOp}
            />
          </div>

          {/* Compression results */}
          <div ref={compRef} style={{ fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 11 }}>
            <CompressionSection
              row={row} grade={grade} nbRd={nbRd} cs={cs}
              showDetails={false} selLcomp={selLcomp} onSelLcomp={noOp}
            />
          </div>

          {/* Compression details */}
          <div ref={compDetRef} style={{ fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 11 }}>
            <CompressionSection
              row={row} grade={grade} nbRd={nbRd} cs={cs}
              showDetails selLcomp={selLcomp} onSelLcomp={noOp}
            />
          </div>
        </>
      )}
    </ExportModal>
  )
}
