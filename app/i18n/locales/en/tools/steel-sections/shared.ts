// Shared strings for all steel section types (column tooltips, group labels, UI chrome)
const ssShard = {
  // Sidebar / UI chrome
  bb_section_type:     'Section type',
  bb_sections_count:   'sections',
  bb_tab_properties:   'Properties',
  bb_tab_capacity:     'Capacity',
  bb_search_label:     'Search by designation',
  bb_no_results:       'No sections match your search',
  bb_capacity_btn:     'Capacity →',
  bb_copy_title:       'Copy designation',
  bb_ref_label:        'Ref',

  // Detail card group headings
  bb_grp_dimensions:  'Dimensions',
  bb_grp_mass_area:   'Mass & Area',
  bb_grp_major_axis:  'Major axis',
  bb_grp_minor_axis:  'Minor axis',
  bb_grp_torsion:     'Torsion',

  // Column tooltip descriptions (symbol prefix is added programmatically)
  bb_tip_mass: 'Mass per unit length',
  bb_tip_h:    'Overall depth of section',
  bb_tip_b:    'Overall width of flange',
  bb_tip_tw:   'Web thickness',
  bb_tip_tf:   'Flange thickness',
  bb_tip_r:    'Root radius — fillet between flange and web',
  bb_tip_A:    'Cross-sectional area',
  bb_tip_Ix:   'Second moment of area about major axis x-x',
  bb_tip_Iy:   'Second moment of area about minor axis y-y',
  bb_tip_Wx:   'Elastic section modulus, major axis',
  bb_tip_Wy:   'Elastic section modulus, minor axis',
  bb_tip_Zx:   'Plastic section modulus, major axis',
  bb_tip_Zy:   'Plastic section modulus, minor axis',
  bb_tip_ix:   'Radius of gyration about major axis',
  bb_tip_iy:   'Radius of gyration about minor axis',
  bb_tip_J:    'Torsion constant — St Venant torsion',
  bb_tip_Cw:   'Warping constant — used in LTB calculations',

  // Extra group headings (hollow / CHS)
  bb_grp_section_props: 'Section Properties',
  bb_grp_surface:       'Surface Area',

  // Extra column tooltips (hollow / CHS)
  bb_tip_t:             'Wall thickness',
  bb_tip_Wt:            'Torsion section modulus',
  bb_tip_surfacePerM:   'Surface area per metre length',
  bb_tip_surfacePerTonne: 'Surface area per tonne',

  // Tier gating
  bb_upgrade_details:  'Upgrade to Pro to view calculation details',
  bb_export_premium:   'Premium — upgrade to export',
}

export default ssShard
