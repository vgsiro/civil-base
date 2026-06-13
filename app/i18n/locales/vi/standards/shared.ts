const shared = {
  // Page header
  std_page_label: 'QUY CHUẨN & TIÊU CHUẨN',
  std_page_title: 'THƯ VIỆN TIÊU CHUẨN THIẾT KẾ',
  std_back: 'Civil Base',

  // Tab labels
  std_tab_eurocode_subtitle: 'EN 1990 – EN 1999',
  std_tab_tcvn_subtitle: 'Tiêu chuẩn Việt Nam',

  // EC dropdown
  std_ec_dropdown_header: 'Tiêu chuẩn Eurocode',
  std_ec_dropdown_btn: 'Eurocode',
  std_ec0_subtitle: 'EN 1990 · Cơ sở thiết kế',
  std_ec1_subtitle: 'EN 1991 · Tác động',
  std_ec2_subtitle: 'EN 1992 · Kết cấu bê tông',
  std_ec3_subtitle: 'EN 1993 · Kết cấu thép',

  // Tools library page
  std_tools_label: 'CÔNG CỤ KỸ THUẬT',
  std_tools_title: 'Thư viện công cụ thiết kế',

  // General tools
  std_general_tools_label: 'CÔNG CỤ CHUNG',
  std_unit_converter_label: 'Đổi đơn vị',
  std_unit_converter_desc: 'Chiều dài · Diện tích · Lực · Áp suất · Mô men · Khối lượng · Nhiệt độ · Góc',

  // Sub-tabs
  std_subtab_pdfs_ec: 'Tiêu chuẩn PDF',
  std_subtab_pdfs_tcvn: 'Tiêu chuẩn PDF',
  std_subtab_ref_ec: 'Công Cụ Thiết Kế',
  std_subtab_ref_tcvn: 'Công Cụ Thiết Kế',
  std_subtab_overview: 'Tổng quan',
  std_subtab_tables: 'Bảng EC',
  std_subtab_na: 'Phụ lục quốc gia',

  // EC Tables sidebar UI strings
  std_tbl_parts_label: 'Phần',
  std_tbl_tables_label: 'Bảng',
  std_tbl_search_placeholder: 'Tìm kiếm…',
  std_tbl_no_results: 'Không có kết quả',
  std_tbl_no_tables: 'Chưa có bảng',
  std_tbl_no_tables_desc: 'Chưa có bảng nào cho phần này.',

  // EC Overview table columns
  std_overview_col_standard: 'Tiêu chuẩn',
  std_overview_col_title: 'Tên tiêu chuẩn',
  std_overview_col_ref_tools: 'Công cụ tham chiếu',
  std_overview_col_ref_table: 'Bảng tham chiếu',

  // Shared tool UI
  std_ui_tab_results: 'Kết quả',
  std_ui_tab_details: 'Chi tiết',
  std_ui_show_zone_diagram: 'Hiển thị sơ đồ vùng',
  std_ui_hide: 'Ẩn sơ đồ',

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

  // Blue Book — SCI P363 bảng tra tiết diện thép
  bb_title: 'Tra cứu đặc trưng tiết diện thép',
  bb_subtitle: 'SCI P363 · BS EN 10365:2017 — kích thước và đặc trưng tiết diện',
  bb_search_placeholder: 'Tìm theo ký hiệu (ví dụ: UB 406×178…)',
  bb_col_designation: 'Ký hiệu',
  bb_col_mass: 'Khối lượng',
  bb_col_h: 'h',
  bb_col_b: 'b',
  bb_col_tw: 'tw',
  bb_col_tf: 'tf',
  bb_col_r: 'r',
  bb_col_A: 'A',
  bb_col_Ix: 'Ix',
  bb_col_Iy: 'Iy',
  bb_col_Wx: 'Wx',
  bb_col_Wy: 'Wy',
  bb_col_Zx: 'Zx',
  bb_col_Zy: 'Zy',
  bb_col_ix: 'ix',
  bb_col_iy: 'iy',
  bb_col_J: 'J',
  bb_col_Cw: 'Cw',
  bb_copy_done: 'Đã sao chép!',
  bb_no_results: 'Không tìm thấy tiết diện phù hợp',
  bb_ref_label: 'Tham chiếu',
} as const

export default shared
