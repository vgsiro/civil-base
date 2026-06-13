// Cold-formed hollow section (SHS + RHS) capacity panel strings
const ssColdFormed = {
  // Header card
  bbcf_header_class:          'Class',
  bbcf_header_class4_note:    'effective section required',
  bbcf_header_ref:            'BS EN 1993-1-1:2005 + BS EN 10219-2:2006 · γ_M0 = γ_M1 = 1.0 (UK NA)',
  bbcf_header_s355_only:      'S355 only — no S275 cold-formed capacity tables in Blue Book',

  // Grade selector
  bbcf_grade_label:           'Grade',

  // Results / Details tab pills
  bbcf_tab_results:           'Results',
  bbcf_tab_details:           'Details',

  // Section search
  bbcf_search_placeholder:    'Search section (e.g. CF RHS 200×100)…',
  bbcf_search_hint:           'or click "Capacity →" on any row in Properties tab',

  // Cross-section resistances
  bbcf_cs_title:              'Cross-Section Resistances',
  bbcf_cs_ref:                '§6.2',

  // Bending
  bbcf_bend_title:            'Bending — Buckling Resistance Moment',
  bbcf_bend_ref:              '§6.3.2.2',
  bbcf_bend_c1_col:           'C₁',
  bbcf_bend_lc_note:          'No reduction for L ≤ Lc (M_b,Rd = M_c,Rd)',

  // Axial + Bending
  bbcf_axbend_title:          'Axial Force & Bending — Reduced Moment Resistance',
  bbcf_axbend_ref:            '§6.2.9',

  // Compression
  bbcf_comp_title:            'Compression — Buckling Resistance',
  bbcf_comp_ref:              '§6.3.1',
  bbcf_comp_axis_col:         'Length (m)',
  bbcf_comp_footer:           'Buckling lengths (m)',
  bbcf_comp_curve:            'Buckling curve c (α = 0.49) — cold-formed hollow sections',

  // Export modal
  bbcf_exp_title:              'Print / Save PDF — Cold-formed Hollow Sections',
  bbcf_exp_default_report:     'Steel Section Capacity (Cold-formed Hollow)',
  bbcf_exp_bend_label:         'Bending',
  bbcf_exp_bend_desc:          'M_b,Rd table — buckling resistance moment vs L and C₁',
  bbcf_exp_bend_detdesc:       'LTB derivation at selected C₁ and L',
  bbcf_exp_axbend_label:       'Axial + Bending',
  bbcf_exp_axbend_desc:        'M_N,Rd table — reduced moment resistance vs n',
  bbcf_exp_axbend_detdesc:     'Interaction derivation at selected n',
  bbcf_exp_comp_label:         'Compression',
  bbcf_exp_comp_desc:          'N_b,Rd table — buckling resistance vs L (y-y and z-z)',
  bbcf_exp_comp_detdesc:       'Flexural buckling derivation at selected L',
  bbcf_exp_btn:                'Print / Save PDF',

  // Detail section titles
  bbcf_det_class_title:        'Classification',
  bbcf_det_cs_title:           'Cross-Section Resistances',
  bbcf_det_ltb_title:          'Lateral-Torsional Buckling',
  bbcf_det_mnrd_title:         'Reduced Moment (Axial + Bending)',
  bbcf_det_nbrd_title:         'Column Buckling',
  bbcf_det_lc_title:           'Limiting Length Lc',

  // CHS-specific
  bbchs_no_ltb_title:           'No Lateral-Torsional Buckling',
  bbchs_no_ltb_note:            'CHS sections are symmetric — LTB does not apply. M_b,Rd = M_c,Rd.',
  bbchs_class_label:            'Class (d/t ratio)',

  // CalcStep labels
  bbcf_det_eps_label:           'Imperfection factor ε',
  bbcf_det_cw_label:            'Web c/t ratio (c = h − 3t)',
  bbcf_det_cf_label:            'Flange c/t ratio (c = b − 3t)',
  bbcf_det_class_web_label:     'Web class',
  bbcf_det_class_fl_label:      'Flange class',
  bbcf_det_npl_label:           'Plastic resistance Npl,Rd',
  bbcf_det_mcy_label:           'Cross-section moment Mc,y,Rd',
  bbcf_det_mcz_label:           'Cross-section moment Mc,z,Rd',
  bbcf_det_mcr_label:           'Elastic critical moment Mcr',
  bbcf_det_lam_lt_label:        'LTB slenderness λ̄_LT',
  bbcf_det_phi_lt_label:        'LTB Φ_LT',
  bbcf_det_chi_lt_label:        'LTB factor χ_LT',
  bbcf_det_f_label:             'Modification factor f',
  bbcf_det_chi_lt_mod_label:    'Modified χ_LT,mod',
  bbcf_det_mbrd_label:          'Buckling resistance Mb,Rd',
  bbcf_det_aw_label:            'aw = (A − 2bt)/A',
  bbcf_det_af_label:            'af = (A − 2ht)/A',
  bbcf_det_mny_label:           'MN,y,Rd',
  bbcf_det_mnz_label:           'MN,z,Rd',
  bbcf_det_lam_y_label:         'Non-dim. slenderness λ̄y',
  bbcf_det_lam_z_label:         'Non-dim. slenderness λ̄z',
  bbcf_det_chi_y_label:         'Buckling factor χy',
  bbcf_det_chi_z_label:         'Buckling factor χz',
  bbcf_det_nby_label:           'Buckling resistance Nb,y,Rd',
  bbcf_det_nbz_label:           'Buckling resistance Nb,z,Rd',
}

export default ssColdFormed
