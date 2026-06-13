const steelSections = {
  // Detail card group labels
  bb_grp_dimensions:  'Kích thước',
  bb_grp_mass_area:   'Khối lượng & Diện tích',
  bb_grp_major_axis:  'Trục chính',
  bb_grp_minor_axis:  'Trục phụ',
  bb_grp_torsion:     'Xoắn',

  // Column tooltip descriptions
  bb_tip_mass: 'Khối lượng trên một đơn vị chiều dài',
  bb_tip_h:    'Chiều cao tổng thể của tiết diện',
  bb_tip_b:    'Chiều rộng tổng thể của cánh',
  bb_tip_tw:   'Chiều dày bụng',
  bb_tip_tf:   'Chiều dày cánh',
  bb_tip_r:    'Bán kính góc lượn — góc tiếp giáp giữa cánh và bụng',
  bb_tip_A:    'Diện tích mặt cắt ngang',
  bb_tip_Ix:   'Mô men quán tính đối với trục chính y-y',
  bb_tip_Iy:   'Mô men quán tính đối với trục phụ z-z',
  bb_tip_Wx:   'Mô đun chống uốn đàn hồi, trục chính y-y',
  bb_tip_Wy:   'Mô đun chống uốn đàn hồi, trục phụ z-z',
  bb_tip_Zx:   'Mô đun chống uốn dẻo, trục chính y-y',
  bb_tip_Zy:   'Mô đun chống uốn dẻo, trục phụ z-z',
  bb_tip_ix:   'Bán kính quán tính đối với trục chính y-y',
  bb_tip_iy:   'Bán kính quán tính đối với trục phụ z-z',
  bb_tip_J:    'Hằng số xoắn — xoắn St Venant',
  bb_tip_Cw:   'Hằng số vênh — dùng trong tính toán oằn ngang xoắn',
  bb_tip_surfacePerM:     'Diện tích bề mặt trên một mét dài',
  bb_tip_surfacePerTonne: 'Diện tích bề mặt trên một tấn',
  bb_tip_t:    'Chiều dày thành',
  bb_tip_Wt:   'Mô đun chống xoắn',

  // PFC-specific column tooltips
  bb_tip_U:    'Tham số oằn',
  bb_tip_X:    'Chỉ số xoắn',
  bb_tip_Iw:   'Hằng số vênh (cm⁶)',
  bb_tip_e0:   'Khoảng hở đầu — khoảng cách từ mặt trong bụng đến mép cánh',
  bb_tip_y0:   'Khoảng cách từ tâm cắt đến trọng tâm tiết diện',
  bb_tip_s:    'Khoảng cách giữa mặt sau hai bụng (tiết diện đôi)',

  // PFC detail card group labels
  bb_grp_buckling: 'Thông số oằn',
  bb_grp_section_props: 'Đặc trưng hình học',

  // Angle-specific column tooltips
  bb_tip_Iu:     'Mô men quán tính đối với trục chính u-u',
  bb_tip_Iv:     'Mô men quán tính đối với trục chính v-v',
  bb_tip_iu:     'Bán kính quán tính đối với trục chính u-u',
  bb_tip_iv:     'Bán kính quán tính đối với trục chính v-v',
  bb_tip_Wu:     'Mô đun chống uốn đàn hồi trục u-u',
  bb_tip_Wv:     'Mô đun chống uốn đàn hồi trục v-v',
  bb_tip_vs:     'Chỉ số bất đối xứng',
  bb_tip_tanA:   'Tang của góc giữa trục v-v và z-z',
  bb_tip_phiMin: 'Hệ số độ mảnh tương đương — nhỏ nhất',
  bb_tip_phiMax: 'Hệ số độ mảnh tương đương — lớn nhất',
  bb_tip_cy:     'Khoảng cách từ trọng tâm đến mặt sau của cánh dài',
  bb_tip_cz:     'Khoảng cách từ trọng tâm đến mặt sau của cánh ngắn',

  // Angle detail card group labels
  bb_grp_yy_axis: 'Trục y-y',
  bb_grp_zz_axis: 'Trục z-z',
  bb_grp_uu_axis: 'Trục u-u (trục chính lớn)',
  bb_grp_vv_axis: 'Trục v-v (trục chính nhỏ)',
  bb_grp_surface: 'Diện tích bề mặt',
}

export default steelSections
