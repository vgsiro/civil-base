const standards = {
  // Page header
  std_page_label: 'QUY CHUẨN & TIÊU CHUẨN',
  std_page_title: 'THƯ VIỆN TIÊU CHUẨN THIẾT KẾ',
  std_back: 'Civil Base',

  // Tab labels
  std_tab_eurocode_subtitle: 'EN 1990 – EN 1999',
  std_tab_tcvn_subtitle: 'Tiêu chuẩn Việt Nam',

  // Sub-tabs
  std_subtab_pdfs_ec: 'Tiêu chuẩn PDF',
  std_subtab_pdfs_tcvn: 'Tiêu chuẩn PDF',
  std_subtab_ref_ec: 'Bảng tra cứu',
  std_subtab_ref_tcvn: 'Bảng tra cứu',

  // PDF library
  std_search_ec: 'Tìm kiếm tiêu chuẩn…',
  std_search_tcvn: 'Tìm kiếm tiêu chuẩn…',
  std_category_all: 'Tất cả',
  std_upload_btn: '+ Tải lên PDF',
  std_uploading: 'Đang tải lên…',
  std_loading: 'Đang tải…',
  std_empty_pdfs: 'Chưa có tiêu chuẩn nào được tải lên',
  std_empty_results: 'Không tìm thấy kết quả',
  std_empty_hint: 'Nhấn Tải lên PDF để thêm tài liệu tiêu chuẩn',
  std_view_only: 'Chỉ xem',
  std_viewer_badge: 'Chỉ xem — không sao chép & tải xuống',
  std_delete_confirm: 'Xoá',

  // Secure viewer
  std_viewer_default_cat_ec: 'Chung',
  std_viewer_default_cat_tcvn: 'Chung',

  // EC ref — sidebar labels
  std_ec_nav_overview: 'Tổng quan',
  std_ec_nav_load: 'Tổ hợp tải trọng',
  std_ec_nav_steel: 'Thép (EC3)',
  std_ec_nav_concrete: 'Bê tông (EC2)',

  // EC ref — overview
  std_ec_overview_title: 'Bộ Eurocode — EN 1990 đến EN 1999',
  std_ec_overview_sub: 'Tiêu chuẩn châu Âu về thiết kế kết cấu do CEN ban hành',
  std_ec_col_standard: 'Tiêu chuẩn',
  std_ec_col_abbr: 'Viết tắt',
  std_ec_col_title: 'Tên tiêu chuẩn',

  // EC parts titles
  std_ec_en1990_title: 'Cơ sở thiết kế kết cấu',
  std_ec_en1991_title: 'Tác động lên kết cấu',
  std_ec_en1992_title: 'Thiết kế kết cấu bê tông',
  std_ec_en1993_title: 'Thiết kế kết cấu thép',
  std_ec_en1994_title: 'Thiết kế kết cấu liên hợp thép-bê tông',
  std_ec_en1995_title: 'Thiết kế kết cấu gỗ',
  std_ec_en1996_title: 'Thiết kế kết cấu gạch đá',
  std_ec_en1997_title: 'Thiết kế địa kỹ thuật',
  std_ec_en1998_title: 'Thiết kế công trình chịu động đất',
  std_ec_en1999_title: 'Thiết kế kết cấu nhôm',

  // EC ref — load combinations
  std_ec_load_title: 'Hệ số riêng cho tác động — EN 1990 Bảng A1.2(B)',
  std_ec_load_sub: 'TTGH bền — tình huống thiết kế STR/GEO',
  std_ec_load_col_action: 'Tác động',
  std_ec_load_col_note: 'Ghi chú',
  std_ec_load_perm_unfav: 'Tĩnh tải (bất lợi)',
  std_ec_load_perm_fav: 'Tĩnh tải (có lợi)',
  std_ec_load_var_unfav: 'Hoạt tải (bất lợi)',
  std_ec_load_var_fav: 'Hoạt tải (có lợi)',

  std_ec_psi_title: 'Hệ số tổ hợp ψ — EN 1990 Bảng A1.1',
  std_ec_psi_sub: 'Dùng để giảm hoạt tải trong các tổ hợp',
  std_ec_psi_col_action: 'Hoạt tải biến đổi',
  std_ec_psi_imposed_a: 'Hoạt tải — Nhóm A: Nhà ở',
  std_ec_psi_imposed_b: 'Hoạt tải — Nhóm B: Văn phòng',
  std_ec_psi_imposed_c: 'Hoạt tải — Nhóm C: Hội họp',
  std_ec_psi_imposed_d: 'Hoạt tải — Nhóm D: Thương mại',
  std_ec_psi_imposed_e: 'Hoạt tải — Nhóm E: Kho',
  std_ec_psi_wind: 'Tải gió',
  std_ec_psi_snow: 'Tải tuyết (≤1000 m)',
  std_ec_psi_temp: 'Nhiệt độ (không cháy)',
  std_ec_load_combo_note: 'Tổ hợp cơ bản (STR):',

  // EC ref — steel
  std_ec_steel_title: 'Cường độ danh nghĩa của thép — EN 1993-1-1 Bảng 3.1',
  std_ec_steel_sub: 'Giới hạn chảy fy và giới hạn bền fu',
  std_ec_steel_col_grade: 'Mác thép',
  std_ec_steel_note: 'γM0 = 1,00 · γM1 = 1,00 · γM2 = 1,25 (giá trị khuyến nghị)',

  // EC ref — concrete
  std_ec_concrete_title: 'Cấp độ bền bê tông — EN 1992-1-1 Bảng 3.1',
  std_ec_concrete_sub: 'Giá trị tính toán với γc = 1,5 (tình huống thường/tạm thời)',
  std_ec_concrete_col_class: 'Cấp độ bền',
  std_ec_concrete_note: 'fcd = αcc·fck/γc = 0,85·fck/1,5 · γc = 1,5 · γs = 1,15',

  // TCVN ref — sidebar labels
  std_vn_nav_overview: 'Tổng quan',
  std_vn_nav_load: 'Hệ số tải trọng',
  std_vn_nav_concrete: 'Bê tông',
  std_vn_nav_rebar: 'Cốt thép',

  // TCVN ref — overview
  std_vn_overview_title: 'Tiêu chuẩn Xây dựng Việt Nam (TCVN)',
  std_vn_overview_sub: 'Các tiêu chuẩn thiết kế kết cấu chính đang áp dụng tại Việt Nam',
  std_vn_col_standard: 'Tiêu chuẩn',
  std_vn_col_title: 'Tên tiêu chuẩn',
  std_vn_col_field: 'Lĩnh vực',

  // TCVN parts titles
  std_vn_2737_title: 'Tải trọng và tác động — Tiêu chuẩn thiết kế',
  std_vn_5574_title: 'Kết cấu bê tông và bê tông cốt thép',
  std_vn_5575_title: 'Kết cấu thép — Tiêu chuẩn thiết kế',
  std_vn_9386_title: 'Thiết kế công trình chịu động đất',
  std_vn_10304_title: 'Móng cọc — Tiêu chuẩn thiết kế',
  std_vn_9362_title: 'Tiêu chuẩn thiết kế nền nhà và công trình',
  std_vn_5472_title: 'Kết cấu xây dựng — Ký hiệu',
  std_vn_4453_title: 'Kết cấu bê tông và BTCT toàn khối',

  // TCVN parts categories
  std_vn_cat_load: 'Tải trọng',
  std_vn_cat_concrete: 'Bê tông',
  std_vn_cat_steel: 'Thép',
  std_vn_cat_seismic: 'Động đất',
  std_vn_cat_foundation: 'Móng',
  std_vn_cat_soil: 'Nền móng',
  std_vn_cat_general: 'Chung',

  // TCVN ref — load factors
  std_vn_load_title: 'Hệ số vượt tải — TCVN 2737:1995',
  std_vn_load_sub: 'Hệ số n dùng để tính tải trọng tính toán',
  std_vn_load_col_load: 'Loại tải trọng',
  std_vn_load_col_factor: 'Hệ số n',
  std_vn_load_col_note: 'Ghi chú',
  std_vn_load_perm_unfav: 'Tĩnh tải (bất lợi)',
  std_vn_load_perm_fav: 'Tĩnh tải (có lợi)',
  std_vn_load_imposed_res: 'Hoạt tải sàn nhà ở',
  std_vn_load_imposed_off: 'Hoạt tải sàn văn phòng',
  std_vn_load_imposed_conc: 'Hoạt tải tập trung',
  std_vn_load_wind: 'Tải gió',
  std_vn_load_seismic: 'Tải động đất',
  std_vn_load_note_mat: 'Phụ thuộc loại vật liệu',
  std_vn_load_note_stab: 'Kiểm tra ổn định',
  std_vn_load_note_q2: 'q ≤ 2 kN/m²',
  std_vn_load_note_p1: 'P ≤ 1 kN',
  std_vn_load_note_2737: 'Theo TCVN 2737',
  std_vn_load_note_9386: 'Theo TCVN 9386',
  std_vn_load_combo_label: 'Tải trọng tính toán:',
  std_vn_load_combo_note: 'F = Ftc × n  trong đó Ftc là tải trọng tiêu chuẩn',

  // TCVN ref — concrete
  std_vn_concrete_title: 'Cường độ bê tông — TCVN 5574:2018',
  std_vn_concrete_sub: 'Cường độ tính toán chịu nén và chịu kéo (MPa)',
  std_vn_concrete_col_grade: 'Cấp độ bền',
  std_vn_concrete_note: 'Rb = cường độ tính toán chịu nén · Rbn = cường độ tiêu chuẩn · Rbt = cường độ tính toán chịu kéo',

  // TCVN ref — rebar
  std_vn_rebar_title: 'Cường độ cốt thép — TCVN 5574:2018',
  std_vn_rebar_sub: 'Cường độ tính toán cốt thép dọc và cốt thép đai (MPa)',
  std_vn_rebar_col_grade: 'Loại thép',
  std_vn_rebar_col_note: 'Ghi chú',
  std_vn_rebar_note_plain: 'Thép tròn trơn',
  std_vn_rebar_note_deformed: 'Thép gai',
  std_vn_rebar_note_high: 'Thép gai cường độ cao',
  std_vn_rebar_note_vhigh: 'Thép gai cường độ rất cao',
  std_vn_rebar_note: 'Rs = cốt thép dọc chịu kéo · Rsc = cốt thép dọc chịu nén · Rsw = cốt thép đai chịu kéo',
} as const

export default standards
