// Hollow section (hot-finished RHS + SHS) capacity panel strings — Vietnamese
const ssHollow = {
  // Header card
  bbhs_header_class:          'Loại tiết diện',
  bbhs_header_class4_note:    'cần dùng tiết diện hiệu dụng',
  bbhs_header_ref:            'BS EN 1993-1-1:2005 + BS EN 10210-2:2006 · γ_M0 = γ_M1 = 1,0 (UK NA)',
  bbhs_header_s355_only:      'Chỉ S355 — Blue Book không có bảng tra S275 cho tiết diện rỗng',

  // Grade selector
  bbhs_grade_label:           'Mác thép',

  // Results / Details tab pills
  bbhs_tab_results:           'Kết quả',
  bbhs_tab_details:           'Chi tiết',

  // Section search
  bbhs_search_placeholder:    'Tìm tiết diện (VD: RHS 200×100)…',
  bbhs_search_hint:           'hoặc nhấn "Sức kháng →" ở tab Thuộc tính',

  // Cross-section resistances
  bbhs_cs_title:              'Sức Kháng Tiết Diện',
  bbhs_cs_ref:                '§6.2',

  // Bending
  bbhs_bend_title:            'Uốn — Moment Kháng Uốn Ổn Định',
  bbhs_bend_ref:              '§6.3.2.2',
  bbhs_bend_c1_col:           'C₁',
  bbhs_bend_lc_note:          'Không giảm khi L ≤ Lc (M_b,Rd = M_c,Rd)',

  // Axial + Bending
  bbhs_axbend_title:          'Lực Dọc & Uốn — Moment Kháng Giảm',
  bbhs_axbend_ref:            '§6.2.9',

  // Compression
  bbhs_comp_title:            'Nén — Sức Kháng Oằn',
  bbhs_comp_ref:              '§6.3.1',
  bbhs_comp_axis_col:         'Chiều dài (m)',
  bbhs_comp_footer:           'Chiều dài tính toán (m)',
  bbhs_comp_curve:            'Đường cong oằn a (α = 0,21) — tiết diện rỗng cán nóng',

  // Export modal
  bbhs_exp_title:              'In / Lưu PDF — Tiết Diện Rỗng Cán Nóng',
  bbhs_exp_default_report:     'Sức kháng tiết diện thép (Rỗng)',
  bbhs_exp_bend_label:         'Uốn',
  bbhs_exp_bend_desc:          'Bảng M_b,Rd — moment kháng uốn theo L và C₁',
  bbhs_exp_bend_detdesc:       'Tính toán chi tiết LTB tại C₁ và L đã chọn',
  bbhs_exp_axbend_label:       'Lực dọc + Uốn',
  bbhs_exp_axbend_desc:        'Bảng M_N,Rd — moment kháng giảm theo n',
  bbhs_exp_axbend_detdesc:     'Tính toán chi tiết tương tác tại n đã chọn',
  bbhs_exp_comp_label:         'Nén',
  bbhs_exp_comp_desc:          'Bảng N_b,Rd — sức kháng oằn theo L (trục y-y và z-z)',
  bbhs_exp_comp_detdesc:       'Tính toán chi tiết oằn uốn tại L đã chọn',
  bbhs_exp_btn:                'In / Lưu PDF',

  // Chuỗi riêng cho CHS
  bbchs_no_ltb_title:   'Không có oằn ngang - xoắn',
  bbchs_no_ltb_note:    'Tiết diện CHS đối xứng tròn — không xảy ra LTB. M_b,Rd = M_c,Rd.',
  bbchs_class_label:    'Loại (tỉ số d/t)',
  bbchs_search_placeholder: 'Tìm tiết diện (VD: CHS 139.7×5.0)…',

  // Detail section titles
  bbhs_det_class_title:        'Phân Loại Tiết Diện',
  bbhs_det_cs_title:           'Sức Kháng Tiết Diện',
  bbhs_det_ltb_title:          'Oằn Ngang — Vặn (LTB)',
  bbhs_det_mnrd_title:         'Moment Giảm (Lực Dọc + Uốn)',
  bbhs_det_nbrd_title:         'Oằn Cột',
  bbhs_det_lc_title:           'Chiều Dài Giới Hạn Lc',

  // CalcStep labels
  bbhs_det_eps_label:           'Hệ số hình học ε',
  bbhs_det_cw_label:            'Tỉ số bụng c/t (c = h − 3t)',
  bbhs_det_cf_label:            'Tỉ số cánh c/t (c = b − 3t)',
  bbhs_det_class_web_label:     'Loại bụng',
  bbhs_det_class_fl_label:      'Loại cánh',
  bbhs_det_npl_label:           'Sức kháng dẻo Npl,Rd',
  bbhs_det_mcy_label:           'Moment tiết diện Mc,y,Rd',
  bbhs_det_mcz_label:           'Moment tiết diện Mc,z,Rd',
  bbhs_det_mcr_label:           'Moment tới hạn đàn hồi Mcr',
  bbhs_det_lam_lt_label:        'Độ mảnh LTB λ̄_LT',
  bbhs_det_phi_lt_label:        'Hệ số Φ_LT',
  bbhs_det_chi_lt_label:        'Hệ số giảm LTB χ_LT',
  bbhs_det_f_label:             'Hệ số hiệu chỉnh f',
  bbhs_det_chi_lt_mod_label:    'Hệ số hiệu chỉnh χ_LT,mod',
  bbhs_det_mbrd_label:          'Moment kháng oằn Mb,Rd',
  bbhs_det_aw_label:            'aw = (A − 2bt)/A',
  bbhs_det_af_label:            'af = (A − 2ht)/A',
  bbhs_det_mny_label:           'MN,y,Rd',
  bbhs_det_mnz_label:           'MN,z,Rd',
  bbhs_det_lam_y_label:         'Độ mảnh không thứ nguyên λ̄y',
  bbhs_det_lam_z_label:         'Độ mảnh không thứ nguyên λ̄z',
  bbhs_det_chi_y_label:         'Hệ số giảm χy',
  bbhs_det_chi_z_label:         'Hệ số giảm χz',
  bbhs_det_nby_label:           'Sức kháng oằn Nb,y,Rd',
  bbhs_det_nbz_label:           'Sức kháng oằn Nb,z,Rd',
}

export default ssHollow
