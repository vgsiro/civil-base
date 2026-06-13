// UB/UC-specific strings: capacity panel labels, detail section titles, formula descriptions
const ssUbUc = {
  // Header card
  bbuc_header_class:          'Class',
  bbuc_header_class4_note:    'effective section required',
  bbuc_header_ref:            'BS EN 1993-1-1:2005 + BS 4-1:2005 · γ_M0 = γ_M1 = 1.0 (UK NA)',

  // Grade selector
  bbuc_grade_label:           'Grade',

  // Results / Details tab pills
  bbuc_tab_results:           'Results',
  bbuc_tab_details:           'Details',

  // Section search placeholder
  bbuc_search_placeholder:    'Search section (e.g. UB 406×178)…',
  bbuc_search_hint:           'or click "Capacity →" on any row in Properties tab',

  // Cross-section resistances
  bbuc_cs_title:              'Cross-Section Resistances',
  bbuc_cs_ref:                '§6.2',

  // Bending
  bbuc_bend_title:            'Bending — Buckling Resistance Moment',
  bbuc_bend_ref:              '§6.3.2.2',
  bbuc_bend_c1_col:           'C₁',

  // Axial + Bending
  bbuc_axbend_title:          'Axial Force & Bending — Reduced Moment Resistance',
  bbuc_axbend_ref:            '§6.2.9',

  // Compression
  bbuc_comp_title:            'Compression — Buckling Resistance',
  bbuc_comp_ref:              '§6.3.1',
  bbuc_comp_axis_col:         'Length (m)',
  bbuc_comp_footer:           'Buckling lengths (m)',

  // Export modal
  bbuc_exp_title:              'Print / Save PDF — UB & UC Sections',
  bbuc_exp_default_report:     'Steel Section Capacity',
  bbuc_exp_bend_label:         'Bending',
  bbuc_exp_bend_desc:          'M_b,Rd table — buckling resistance moment vs L and C₁',
  bbuc_exp_bend_detdesc:       'LTB derivation at selected C₁ and L',
  bbuc_exp_axbend_label:       'Axial + Bending',
  bbuc_exp_axbend_desc:        'M_N,Rd table — reduced moment resistance vs n',
  bbuc_exp_axbend_detdesc:     'Interaction derivation at selected n',
  bbuc_exp_comp_label:         'Compression',
  bbuc_exp_comp_desc:          'N_b,Rd table — buckling resistance vs L (y-y, z-z, torsional)',
  bbuc_exp_comp_detdesc:       'Flexural & torsional buckling derivation at selected L',
  bbuc_exp_btn:                'Print / Save PDF',

  // Detail section — tab labels
  bbuc_det_results:           'Results',
  bbuc_det_details:           'Details',

  // Detail — Material
  bbuc_det_material_title:    'Material — Table 3.1',
  bbuc_det_fy_label:          'Yield strength',
  bbuc_det_eps_label:         'Epsilon factor',

  // Detail — Classification
  bbuc_det_class_title:       'Cross-section classification — §5.5.2',
  bbuc_det_web_d_label:       'Web depth between fillets',
  bbuc_det_web_slend_label:   'Web slenderness',
  bbuc_det_flange_out_label:  'Flange outstand',
  bbuc_det_flange_slend_label:'Flange slenderness',
  bbuc_det_section_class:     'Section class',

  // Detail — Cross-section resistances
  bbuc_det_cs_title:          'Cross-section resistances — §6.2',
  bbuc_det_nplrd_label:       'Axial — §6.2.4',
  bbuc_det_mcrd_label:        'Moment — §6.2.5',
  bbuc_det_av_label:          'Shear area',
  bbuc_det_vplrd_label:       'Shear resistance — §6.2.6',

  // Detail — Bending (LTB)
  bbuc_det_ltb_curve_title:   'LTB buckling curve — EC3 Table 6.4',
  bbuc_det_hb_label:          'h/b ratio',
  bbuc_det_W_label:           'Section modulus W',
  bbuc_det_consts_title:      'Section constants',
  bbuc_det_Iw_label:          'Warping constant',
  bbuc_det_It_label:          'Torsion constant',
  bbuc_det_Iz_label:          'Weak-axis second moment',
  bbuc_det_mcr_title:         'Elastic critical moment — §6.3.2.2',
  bbuc_det_mcr_formula_label: 'Formula',
  bbuc_det_c1_note_label:     'C₁ values',
  bbuc_det_lam_title:         'Non-dimensional slenderness — §6.3.2.2',
  bbuc_det_lam_label:         'Slenderness',
  bbuc_det_lam_plateau:       'No LTB plateau (UK NA)',
  bbuc_det_chi_title:         'LTB reduction factor — §6.3.2.3 + UK NA',
  bbuc_det_phi_label:         'Φ_LT',
  bbuc_det_chi_label:         'χ_LT',
  bbuc_det_f_label:           'Modification factor f (UK NA)',
  bbuc_det_chimod_label:      'Modified χ_LT,mod',
  bbuc_det_mbrd_label:        'Buckling resistance moment',

  // Detail — Axial + Bending
  bbuc_det_n_title:           'Axial utilisation ratio',
  bbuc_det_n_label:           'n ratio',
  bbuc_det_a_title:           'Web area ratio a — §6.2.9.1(c)',
  bbuc_det_a_label:           'a',
  bbuc_det_mny_title:         'Major axis M_N,y,Rd — §6.2.9.1 Eq (6.36)',
  bbuc_det_mny_when_ok:       'When n < 1 − 0.5a',
  bbuc_det_mny_values:        'Values',
  bbuc_det_mny_when_zero:     'When n ≥ 1 − 0.5a',
  bbuc_det_mnz_title:         'Minor axis M_N,z,Rd — §6.2.9.1 Eq (6.37/6.38)',
  bbuc_det_mnz_when_a:        'When n ≤ a',
  bbuc_det_mnz_when_gt:       'When n > a',
  bbuc_det_mnz_values:        'Values',
  bbuc_det_interact_title:    'Cross-section interaction check — §6.2.1(7) Eq (6.2)',
  bbuc_det_interact_label:    'Conservative criterion',
  bbuc_det_cls3_title:        'Class 3 — linear elastic interaction',
  bbuc_det_cls3_major:        'Major axis',
  bbuc_det_cls3_minor:        'Minor axis',

  // Detail — Compression
  bbuc_det_buck_title:        'Buckling curves — EC3 Table 6.2 (rolled I/H sections)',
  bbuc_det_hb_comp_label:     'h/b ratio',
  bbuc_det_yy_label:          'y-y axis',
  bbuc_det_zz_label:          'z-z axis',
  bbuc_det_T_label:           'Torsional axis',
  bbuc_det_lam_flex_title:    'Non-dimensional slenderness — §6.3.1.3 (Blue Book notation)',
  bbuc_det_eps_comp_label:    'ε factor',
  bbuc_det_lam_flex_label:    'Slenderness (flexural)',
  bbuc_det_lam_no_buck:       'No buckling plateau',
  bbuc_det_flex_title:        'Flexural buckling resistance — §6.3.1.2 Eq (6.49)',
  bbuc_det_phi_comp_label:    'Φ factor',
  bbuc_det_chi_comp_label:    'χ factor',
  bbuc_det_nbrd_label:        'Buckling resistance',
  bbuc_det_tors_title:        'Torsional buckling — §6.3.1.4 (Blue Book §6.1)',
  bbuc_det_i0_label:          'Polar radius of gyration',
  bbuc_det_ncrt_label:        'Critical torsional force',
  bbuc_det_consts_comp:       'Constants',
  bbuc_det_lam_T_label:       'Torsional slenderness',

  // Class 4 warning
  bbuc_class4_warning:        'Class 4 section — effective section properties required per §6.2.2.5. Resistance values not computed.',
}

export default ssUbUc
