// Hollow section (hot-finished RHS + SHS) capacity panel strings
const ssHollow = {
  // Header card
  bbhs_header_class:          'Class',
  bbhs_header_class4_note:    'effective section required',
  bbhs_header_ref:            'BS EN 1993-1-1:2005 + BS EN 10210-2:2006 · γ_M0 = γ_M1 = 1.0 (UK NA)',
  bbhs_header_s355_only:      'S355 only — no S275 hollow section capacity tables in Blue Book',

  // Grade selector
  bbhs_grade_label:           'Grade',

  // Results / Details tab pills
  bbhs_tab_results:           'Results',
  bbhs_tab_details:           'Details',

  // Section search
  bbhs_search_placeholder:    'Search section (e.g. RHS 200×100)…',
  bbhs_search_hint:           'or click "Capacity →" on any row in Properties tab',

  // Cross-section resistances
  bbhs_cs_title:              'Cross-Section Resistances',
  bbhs_cs_ref:                '§6.2',

  // Bending
  bbhs_bend_title:            'Bending — Buckling Resistance Moment',
  bbhs_bend_ref:              '§6.3.2.2',
  bbhs_bend_c1_col:           'C₁',
  bbhs_bend_lc_note:          'No reduction for L ≤ Lc (M_b,Rd = M_c,Rd)',

  // Axial + Bending
  bbhs_axbend_title:          'Axial Force & Bending — Reduced Moment Resistance',
  bbhs_axbend_ref:            '§6.2.9',

  // Compression
  bbhs_comp_title:            'Compression — Buckling Resistance',
  bbhs_comp_ref:              '§6.3.1',
  bbhs_comp_axis_col:         'Length (m)',
  bbhs_comp_footer:           'Buckling lengths (m)',
  bbhs_comp_curve:            'Buckling curve a (α = 0.21) — hot-finished hollow sections',

  // Export modal
  bbhs_exp_title:              'Print / Save PDF — Hot-finished Hollow Sections',
  bbhs_exp_default_report:     'Steel Section Capacity (Hollow)',
  bbhs_exp_bend_label:         'Bending',
  bbhs_exp_bend_desc:          'M_b,Rd table — buckling resistance moment vs L and C₁',
  bbhs_exp_bend_detdesc:       'LTB derivation at selected C₁ and L',
  bbhs_exp_axbend_label:       'Axial + Bending',
  bbhs_exp_axbend_desc:        'M_N,Rd table — reduced moment resistance vs n',
  bbhs_exp_axbend_detdesc:     'Interaction derivation at selected n',
  bbhs_exp_comp_label:         'Compression',
  bbhs_exp_comp_desc:          'N_b,Rd table — buckling resistance vs L (y-y and z-z)',
  bbhs_exp_comp_detdesc:       'Flexural buckling derivation at selected L',
  bbhs_exp_btn:                'Print / Save PDF',

  // CHS-specific strings
  bbchs_no_ltb_title:   'No Lateral-Torsional Buckling',
  bbchs_no_ltb_note:    'CHS sections are symmetric — LTB does not apply. M_b,Rd = M_c,Rd.',
  bbchs_class_label:    'Class (d/t ratio)',
  bbchs_search_placeholder: 'Search section (e.g. CHS 139.7×5.0)…',

  // Detail section titles
  bbhs_det_class_title:        'Classification',
  bbhs_det_cs_title:           'Cross-Section Resistances',
  bbhs_det_ltb_title:          'Lateral-Torsional Buckling',
  bbhs_det_mnrd_title:         'Reduced Moment (Axial + Bending)',
  bbhs_det_nbrd_title:         'Column Buckling',
  bbhs_det_lc_title:           'Limiting Length Lc',

  // CalcStep labels
  bbhs_det_eps_label:           'Imperfection factor ε',
  bbhs_det_cw_label:            'Web c/t ratio (c = h − 3t)',
  bbhs_det_cf_label:            'Flange c/t ratio (c = b − 3t)',
  bbhs_det_class_web_label:     'Web class',
  bbhs_det_class_fl_label:      'Flange class',
  bbhs_det_npl_label:           'Plastic resistance Npl,Rd',
  bbhs_det_mcy_label:           'Cross-section moment Mc,y,Rd',
  bbhs_det_mcz_label:           'Cross-section moment Mc,z,Rd',
  bbhs_det_mcr_label:           'Elastic critical moment Mcr',
  bbhs_det_lam_lt_label:        'LTB slenderness λ̄_LT',
  bbhs_det_phi_lt_label:        'LTB Φ_LT',
  bbhs_det_chi_lt_label:        'LTB factor χ_LT',
  bbhs_det_f_label:             'Modification factor f',
  bbhs_det_chi_lt_mod_label:    'Modified χ_LT,mod',
  bbhs_det_mbrd_label:          'Buckling resistance Mb,Rd',
  bbhs_det_aw_label:            'aw = (A − 2bt)/A',
  bbhs_det_af_label:            'af = (A − 2ht)/A',
  bbhs_det_mny_label:           'MN,y,Rd',
  bbhs_det_mnz_label:           'MN,z,Rd',
  bbhs_det_lam_y_label:         'Non-dim. slenderness λ̄y',
  bbhs_det_lam_z_label:         'Non-dim. slenderness λ̄z',
  bbhs_det_chi_y_label:         'Buckling factor χy',
  bbhs_det_chi_z_label:         'Buckling factor χz',
  bbhs_det_nby_label:           'Buckling resistance Nb,y,Rd',
  bbhs_det_nbz_label:           'Buckling resistance Nb,z,Rd',
}

export default ssHollow
