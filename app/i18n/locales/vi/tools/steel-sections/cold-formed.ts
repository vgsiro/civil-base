// Cold-formed hollow section (SHS + RHS) capacity panel strings — Vietnamese
const ssColdFormed = {
  // Header card
  bbcf_header_class:          'Loại tiết diện',
  bbcf_header_class4_note:    'cần dùng tiết diện hiệu dụng',
  bbcf_header_ref:            'BS EN 1993-1-1:2005 + BS EN 10219-2:2006 · γ_M0 = γ_M1 = 1,0 (UK NA)',
  bbcf_header_s355_only:      'Chỉ S355 — Blue Book không có bảng tra S275 cho tiết diện rỗng tạo hình nguội',

  // Grade selector
  bbcf_grade_label:           'Mác thép',

  // Results / Details tab pills
  bbcf_tab_results:           'Kết quả',
  bbcf_tab_details:           'Chi tiết',

  // Section search
  bbcf_search_placeholder:    'Tìm tiết diện (VD: CF RHS 200×100)…',
  bbcf_search_hint:           'hoặc nhấn "Sức kháng →" ở tab Thuộc tính',

  // Cross-section resistances
  bbcf_cs_title:              'Sức Kháng Tiết Diện',
  bbcf_cs_ref:                '§6.2',

  // Bending
  bbcf_bend_title:            'Uốn — Moment Kháng Uốn Ổn Định',
  bbcf_bend_ref:              '§6.3.2.2',
  bbcf_bend_c1_col:           'C₁',
  bbcf_bend_lc_note:          'Không giảm khi L ≤ Lc (M_b,Rd = M_c,Rd)',

  // Axial + Bending
  bbcf_axbend_title:          'Lực Dọc & Uốn — Moment Kháng Giảm',
  bbcf_axbend_ref:            '§6.2.9',

  // Compression
  bbcf_comp_title:            'Nén — Sức Kháng Oằn',
  bbcf_comp_ref:              '§6.3.1',
  bbcf_comp_axis_col:         'Chiều dài (m)',
  bbcf_comp_footer:           'Chiều dài tính toán (m)',
  bbcf_comp_curve:            'Đường cong oằn c (α = 0,49) — tiết diện rỗng tạo hình nguội',

  // Export modal
  bbcf_exp_title:              'In / Lưu PDF — Tiết Diện Rỗng Tạo Hình Nguội',
  bbcf_exp_default_report:     'Sức kháng tiết diện thép (Rỗng tạo hình nguội)',
  bbcf_exp_bend_label:         'Uốn',
  bbcf_exp_bend_desc:          'Bảng M_b,Rd — moment kháng uốn theo L và C₁',
  bbcf_exp_bend_detdesc:       'Tính toán chi tiết LTB tại C₁ và L đã chọn',
  bbcf_exp_axbend_label:       'Lực dọc + Uốn',
  bbcf_exp_axbend_desc:        'Bảng M_N,Rd — moment kháng giảm theo n',
  bbcf_exp_axbend_detdesc:     'Tính toán chi tiết tương tác tại n đã chọn',
  bbcf_exp_comp_label:         'Nén',
  bbcf_exp_comp_desc:          'Bảng N_b,Rd — sức kháng oằn theo L (trục y-y và z-z)',
  bbcf_exp_comp_detdesc:       'Tính toán chi tiết oằn uốn tại L đã chọn',
  bbcf_exp_btn:                'In / Lưu PDF',

  // Detail section titles
  bbcf_det_class_title:        'Phân Loại Tiết Diện',
  bbcf_det_cs_title:           'Sức Kháng Tiết Diện',
  bbcf_det_ltb_title:          'Oằn Ngang — Vặn (LTB)',
  bbcf_det_mnrd_title:         'Moment Giảm (Lực Dọc + Uốn)',
  bbcf_det_nbrd_title:         'Oằn Cột',
  bbcf_det_lc_title:           'Chiều Dài Giới Hạn Lc',

  // CHS-specific
  bbchs_no_ltb_title:           'Không Có Oằn Ngang–Vặn',
  bbchs_no_ltb_note:            'Tiết diện CHS đối xứng tròn — LTB không áp dụng. M_b,Rd = M_c,Rd.',
  bbchs_class_label:            'Loại tiết diện (tỉ số d/t)',

  // CalcStep labels
  bbcf_det_eps_label:           'Hệ số hình học ε',
  bbcf_det_cw_label:            'Tỉ số bụng c/t (c = h − 3t)',
  bbcf_det_cf_label:            'Tỉ số cánh c/t (c = b − 3t)',
  bbcf_det_class_web_label:     'Loại bụng',
  bbcf_det_class_fl_label:      'Loại cánh',
  bbcf_det_npl_label:           'Sức kháng dẻo Npl,Rd',
  bbcf_det_mcy_label:           'Moment tiết diện Mc,y,Rd',
  bbcf_det_mcz_label:           'Moment tiết diện Mc,z,Rd',
  bbcf_det_mcr_label:           'Moment tới hạn đàn hồi Mcr',
  bbcf_det_lam_lt_label:        'Độ mảnh LTB λ̄_LT',
  bbcf_det_phi_lt_label:        'Hệ số Φ_LT',
  bbcf_det_chi_lt_label:        'Hệ số giảm LTB χ_LT',
  bbcf_det_f_label:             'Hệ số hiệu chỉnh f',
  bbcf_det_chi_lt_mod_label:    'Hệ số hiệu chỉnh χ_LT,mod',
  bbcf_det_mbrd_label:          'Moment kháng oằn Mb,Rd',
  bbcf_det_aw_label:            'aw = (A − 2bt)/A',
  bbcf_det_af_label:            'af = (A − 2ht)/A',
  bbcf_det_mny_label:           'MN,y,Rd',
  bbcf_det_mnz_label:           'MN,z,Rd',
  bbcf_det_lam_y_label:         'Độ mảnh không thứ nguyên λ̄y',
  bbcf_det_lam_z_label:         'Độ mảnh không thứ nguyên λ̄z',
  bbcf_det_chi_y_label:         'Hệ số giảm χy',
  bbcf_det_chi_z_label:         'Hệ số giảm χz',
  bbcf_det_nby_label:           'Sức kháng oằn Nb,y,Rd',
  bbcf_det_nbz_label:           'Sức kháng oằn Nb,z,Rd',
}

export default ssColdFormed
