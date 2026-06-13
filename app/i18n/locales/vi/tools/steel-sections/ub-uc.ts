// Chuỗi riêng cho UB/UC: nhãn bảng khả năng, tiêu đề chi tiết, mô tả công thức
const ssUbUc = {
  // Thẻ tiêu đề
  bbuc_header_class:          'Nhóm',
  bbuc_header_class4_note:    'yêu cầu tiết diện hữu hiệu',
  bbuc_header_ref:            'BS EN 1993-1-1:2005 + BS 4-1:2005 · γ_M0 = γ_M1 = 1.0 (UK NA)',

  // Bộ chọn mác thép
  bbuc_grade_label:           'Mác thép',

  // Viên chuyển Kết quả / Chi tiết
  bbuc_tab_results:           'Kết quả',
  bbuc_tab_details:           'Chi tiết',

  // Tìm kiếm tiết diện
  bbuc_search_placeholder:    'Tìm tiết diện (vd. UB 406×178)…',
  bbuc_search_hint:           'hoặc nhấn "Khả năng →" trên bất kỳ hàng nào ở tab Đặc trưng',

  // Sức kháng mặt cắt ngang
  bbuc_cs_title:              'Sức kháng mặt cắt ngang',
  bbuc_cs_ref:                '§6.2',

  // Uốn
  bbuc_bend_title:            'Uốn — Mô men uốn chống oằn ngang',
  bbuc_bend_ref:              '§6.3.2.2',
  bbuc_bend_c1_col:           'C₁',

  // Lực dọc + Uốn
  bbuc_axbend_title:          'Lực dọc & Uốn — Mô men chịu uốn giảm',
  bbuc_axbend_ref:            '§6.2.9',

  // Nén
  bbuc_comp_title:            'Nén — Sức kháng oằn',
  bbuc_comp_ref:              '§6.3.1',
  bbuc_comp_axis_col:         'Trục',
  bbuc_comp_footer:           'Chiều dài oằn (m)',

  // Modal xuất file
  bbuc_exp_title:              'In / Lưu PDF — Tiết diện UB & UC',
  bbuc_exp_default_report:     'Khả năng chịu lực tiết diện thép',
  bbuc_exp_bend_label:         'Uốn',
  bbuc_exp_bend_desc:          'Bảng M_b,Rd — mô men chống oằn theo L và C₁',
  bbuc_exp_bend_detdesc:       'Khai triển OLN theo C₁ và L đã chọn',
  bbuc_exp_axbend_label:       'Lực dọc + Uốn',
  bbuc_exp_axbend_desc:        'Bảng M_N,Rd — mô men giảm theo n',
  bbuc_exp_axbend_detdesc:     'Khai triển tương tác theo n đã chọn',
  bbuc_exp_comp_label:         'Nén',
  bbuc_exp_comp_desc:          'Bảng N_b,Rd — sức kháng oằn theo L (y-y, z-z, xoắn)',
  bbuc_exp_comp_detdesc:       'Khai triển oằn uốn & oằn xoắn theo L đã chọn',
  bbuc_exp_btn:                'In / Lưu PDF',

  // Nhãn tab chi tiết
  bbuc_det_results:           'Kết quả',
  bbuc_det_details:           'Chi tiết',

  // Chi tiết — Vật liệu
  bbuc_det_material_title:    'Vật liệu — Bảng 3.1',
  bbuc_det_fy_label:          'Cường độ chảy',
  bbuc_det_eps_label:         'Hệ số ε',

  // Chi tiết — Phân nhóm mặt cắt
  bbuc_det_class_title:       'Phân nhóm tiết diện — §5.5.2',
  bbuc_det_web_d_label:       'Chiều cao bụng giữa hai góc lượn',
  bbuc_det_web_slend_label:   'Độ mảnh bụng',
  bbuc_det_flange_out_label:  'Phần cánh nhô ra',
  bbuc_det_flange_slend_label:'Độ mảnh cánh',
  bbuc_det_section_class:     'Nhóm tiết diện',

  // Chi tiết — Sức kháng mặt cắt
  bbuc_det_cs_title:          'Sức kháng mặt cắt ngang — §6.2',
  bbuc_det_nplrd_label:       'Lực dọc — §6.2.4',
  bbuc_det_mcrd_label:        'Mô men — §6.2.5',
  bbuc_det_av_label:          'Diện tích chịu cắt',
  bbuc_det_vplrd_label:       'Sức kháng cắt — §6.2.6',

  // Chi tiết — Uốn (oằn ngang)
  bbuc_det_ltb_curve_title:   'Đường cong oằn ngang — EC3 Bảng 6.4',
  bbuc_det_hb_label:          'Tỉ số h/b',
  bbuc_det_W_label:           'Mô men chống uốn W',
  bbuc_det_consts_title:      'Hằng số tiết diện',
  bbuc_det_Iw_label:          'Hằng số vênh',
  bbuc_det_It_label:          'Hằng số xoắn',
  bbuc_det_Iz_label:          'Mô men quán tính trục yếu',
  bbuc_det_mcr_title:         'Mô men tới hạn đàn hồi — §6.3.2.2',
  bbuc_det_mcr_formula_label: 'Công thức',
  bbuc_det_c1_note_label:     'Giá trị C₁',
  bbuc_det_lam_title:         'Độ mảnh không thứ nguyên — §6.3.2.2',
  bbuc_det_lam_label:         'Độ mảnh',
  bbuc_det_lam_plateau:       'Không có ngưỡng LTB (UK NA)',
  bbuc_det_chi_title:         'Hệ số giảm oằn ngang — §6.3.2.3 + UK NA',
  bbuc_det_phi_label:         'Φ_LT',
  bbuc_det_chi_label:         'χ_LT',
  bbuc_det_f_label:           'Hệ số hiệu chỉnh f (UK NA)',
  bbuc_det_chimod_label:      'χ_LT,mod đã hiệu chỉnh',
  bbuc_det_mbrd_label:        'Mô men uốn chống oằn',

  // Chi tiết — Lực dọc + Uốn
  bbuc_det_n_title:           'Hệ số sử dụng lực dọc',
  bbuc_det_n_label:           'Tỉ số n',
  bbuc_det_a_title:           'Tỉ số diện tích bụng a — §6.2.9.1(c)',
  bbuc_det_a_label:           'a',
  bbuc_det_mny_title:         'Trục chính M_N,y,Rd — §6.2.9.1 Eq (6.36)',
  bbuc_det_mny_when_ok:       'Khi n < 1 − 0.5a',
  bbuc_det_mny_values:        'Giá trị',
  bbuc_det_mny_when_zero:     'Khi n ≥ 1 − 0.5a',
  bbuc_det_mnz_title:         'Trục phụ M_N,z,Rd — §6.2.9.1 Eq (6.37/6.38)',
  bbuc_det_mnz_when_a:        'Khi n ≤ a',
  bbuc_det_mnz_when_gt:       'Khi n > a',
  bbuc_det_mnz_values:        'Giá trị',
  bbuc_det_interact_title:    'Kiểm tra tương tác mặt cắt — §6.2.1(7) Eq (6.2)',
  bbuc_det_interact_label:    'Điều kiện bảo thủ',
  bbuc_det_cls3_title:        'Nhóm 3 — tương tác đàn hồi tuyến tính',
  bbuc_det_cls3_major:        'Trục chính',
  bbuc_det_cls3_minor:        'Trục phụ',

  // Chi tiết — Nén
  bbuc_det_buck_title:        'Đường cong oằn — EC3 Bảng 6.2 (tiết diện I/H cán nóng)',
  bbuc_det_hb_comp_label:     'Tỉ số h/b',
  bbuc_det_yy_label:          'Trục y-y',
  bbuc_det_zz_label:          'Trục z-z',
  bbuc_det_T_label:           'Trục xoắn',
  bbuc_det_lam_flex_title:    'Độ mảnh không thứ nguyên — §6.3.1.3 (ký hiệu Blue Book)',
  bbuc_det_eps_comp_label:    'Hệ số ε',
  bbuc_det_lam_flex_label:    'Độ mảnh (uốn dọc)',
  bbuc_det_lam_no_buck:       'Không có ngưỡng oằn',
  bbuc_det_flex_title:        'Sức kháng oằn uốn dọc — §6.3.1.2 Eq (6.49)',
  bbuc_det_phi_comp_label:    'Hệ số Φ',
  bbuc_det_chi_comp_label:    'Hệ số χ',
  bbuc_det_nbrd_label:        'Sức kháng oằn',
  bbuc_det_tors_title:        'Oằn xoắn — §6.3.1.4 (Blue Book §6.1)',
  bbuc_det_i0_label:          'Bán kính quán tính cực',
  bbuc_det_ncrt_label:        'Lực tới hạn xoắn',
  bbuc_det_consts_comp:       'Hằng số',
  bbuc_det_lam_T_label:       'Độ mảnh xoắn',

  // Cảnh báo nhóm 4
  bbuc_class4_warning:        'Tiết diện nhóm 4 — cần dùng đặc trưng hữu hiệu theo §6.2.2.5. Giá trị sức kháng chưa được tính.',
}

export default ssUbUc
