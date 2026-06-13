const steelSections = {
  // Detail card group labels
  bb_grp_dimensions:  'Dimensions',
  bb_grp_mass_area:   'Mass & Area',
  bb_grp_major_axis:  'Major axis',
  bb_grp_minor_axis:  'Minor axis',
  bb_grp_torsion:     'Torsion',

  // Column tooltip descriptions
  bb_tip_mass: 'Mass per unit length',
  bb_tip_h:    'Overall depth of section',
  bb_tip_b:    'Overall width of flange',
  bb_tip_tw:   'Web thickness',
  bb_tip_tf:   'Flange thickness',
  bb_tip_r:    'Root radius — fillet between flange and web',
  bb_tip_A:    'Cross-sectional area',
  bb_tip_Ix:   'Second moment of area about major axis y-y',
  bb_tip_Iy:   'Second moment of area about minor axis z-z',
  bb_tip_Wx:   'Elastic section modulus, major axis y-y',
  bb_tip_Wy:   'Elastic section modulus, minor axis z-z',
  bb_tip_Zx:   'Plastic section modulus, major axis y-y',
  bb_tip_Zy:   'Plastic section modulus, minor axis z-z',
  bb_tip_ix:   'Radius of gyration about major axis y-y',
  bb_tip_iy:   'Radius of gyration about minor axis z-z',
  bb_tip_J:    'Torsion constant — St Venant torsion',
  bb_tip_Cw:   'Warping constant — used in LTB calculations',
  bb_tip_surfacePerM:     'Surface area per metre length',
  bb_tip_surfacePerTonne: 'Surface area per tonne',
  bb_tip_t:    'Wall thickness',
  bb_tip_Wt:   'Torsional section modulus',

  // PFC-specific column tooltips
  bb_tip_U:    'Buckling parameter',
  bb_tip_X:    'Torsional index',
  bb_tip_Iw:   'Warping constant (cm⁶)',
  bb_tip_e0:   'End clearance — distance from inner web face to flange tip',
  bb_tip_y0:   'Distance from shear centre to section centroid',
  bb_tip_s:    'Space between backs of webs (paired section)',

  // PFC detail card group labels
  bb_grp_buckling: 'Buckling parameters',
  bb_grp_section_props: 'Section properties',

  // Angle-specific column tooltips
  bb_tip_Iu:     'Second moment of area about major principal axis u-u',
  bb_tip_Iv:     'Second moment of area about minor principal axis v-v',
  bb_tip_iu:     'Radius of gyration about major principal axis u-u',
  bb_tip_iv:     'Radius of gyration about minor principal axis v-v',
  bb_tip_Wu:     'Elastic section modulus about u-u axis',
  bb_tip_Wv:     'Elastic section modulus about v-v axis',
  bb_tip_vs:     'Monosymmetry index',
  bb_tip_tanA:   'Tangent of angle between v-v and z-z axes',
  bb_tip_phiMin: 'Equivalent slenderness coefficient — minimum',
  bb_tip_phiMax: 'Equivalent slenderness coefficient — maximum',
  bb_tip_cy:     'Distance from centroid to back of long leg',
  bb_tip_cz:     'Distance from centroid to back of short leg',

  // Angle detail card group labels
  bb_grp_yy_axis: 'Axis y-y',
  bb_grp_zz_axis: 'Axis z-z',
  bb_grp_uu_axis: 'Axis u-u (major principal)',
  bb_grp_vv_axis: 'Axis v-v (minor principal)',
  bb_grp_surface: 'Surface area',
}

export default steelSections
