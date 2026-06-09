const standards = {
  // Page header
  std_page_label: 'CODE & STANDARDS',
  std_page_title: 'DESIGN STANDARDS LIBRARY',
  std_back: 'Civil Base',

  // Tab labels
  std_tab_eurocode_subtitle: 'EN 1990 – EN 1999',
  std_tab_tcvn_subtitle: 'Vietnamese Standard',

  // Sub-tabs
  std_subtab_pdfs_ec: 'Standard PDFs',
  std_subtab_pdfs_tcvn: 'Standard PDFs',
  std_subtab_ref_ec: 'Reference Tools',
  std_subtab_ref_tcvn: 'Reference Tools',

  // PDF library
  std_search_ec: 'Search standards…',
  std_search_tcvn: 'Search standards…',
  std_category_all: 'All',
  std_upload_btn: '+ Upload PDF',
  std_uploading: 'Uploading…',
  std_loading: 'Loading…',
  std_empty_pdfs: 'No standards uploaded yet',
  std_empty_results: 'No results found',
  std_empty_hint: 'Click Upload PDF to add standard documents',
  std_view_only: 'View only',
  std_viewer_badge: 'View only — copy & download disabled',
  std_delete_confirm: 'Delete',

  // Secure viewer
  std_viewer_default_cat_ec: 'General',
  std_viewer_default_cat_tcvn: 'General',

  // EC ref — sidebar labels
  std_ec_nav_overview: 'Overview',
  std_ec_nav_load: 'Load Combinations',
  std_ec_nav_steel: 'Steel (EC3)',
  std_ec_nav_concrete: 'Concrete (EC2)',
  std_ec_nav_wind: 'Wind (EC1)',

  // EC ref — overview
  std_ec_overview_title: 'Eurocode Suite — EN 1990 to EN 1999',
  std_ec_overview_sub: 'European Standard for structural design published by CEN',
  std_ec_col_standard: 'Standard',
  std_ec_col_abbr: 'Abbr.',
  std_ec_col_title: 'Title',

  // EC parts titles
  std_ec_en1990_title: 'Basis of structural design',
  std_ec_en1991_title: 'Actions on structures',
  std_ec_en1992_title: 'Design of concrete structures',
  std_ec_en1993_title: 'Design of steel structures',
  std_ec_en1994_title: 'Design of composite steel-concrete structures',
  std_ec_en1995_title: 'Design of timber structures',
  std_ec_en1996_title: 'Design of masonry structures',
  std_ec_en1997_title: 'Geotechnical design',
  std_ec_en1998_title: 'Design of structures for earthquake resistance',
  std_ec_en1999_title: 'Design of aluminium structures',

  // EC ref — load combinations
  std_ec_load_title: 'Partial Factors for Actions — EN 1990 Table A1.2(B)',
  std_ec_load_sub: 'ULS — STR/GEO design situation',
  std_ec_load_col_action: 'Action',
  std_ec_load_col_note: 'Note',
  std_ec_load_perm_unfav: 'Permanent (unfavourable)',
  std_ec_load_perm_fav: 'Permanent (favourable)',
  std_ec_load_var_unfav: 'Variable (unfavourable)',
  std_ec_load_var_fav: 'Variable (favourable)',

  std_ec_psi_title: 'ψ Combination Factors — EN 1990 Table A1.1',
  std_ec_psi_sub: 'Used to reduce variable actions in combinations',
  std_ec_psi_col_action: 'Variable Action',
  std_ec_psi_imposed_a: 'Imposed — Cat. A: Domestic',
  std_ec_psi_imposed_b: 'Imposed — Cat. B: Office',
  std_ec_psi_imposed_c: 'Imposed — Cat. C: Congregation',
  std_ec_psi_imposed_d: 'Imposed — Cat. D: Shopping',
  std_ec_psi_imposed_e: 'Imposed — Cat. E: Storage',
  std_ec_psi_wind: 'Wind',
  std_ec_psi_snow: 'Snow (≤1000 m)',
  std_ec_psi_temp: 'Temperature (non-fire)',
  std_ec_load_combo_note: 'Fundamental combination (STR):',

  // EC ref — steel
  std_ec_steel_title: 'Nominal Values of Steel — EN 1993-1-1 Table 3.1',
  std_ec_steel_sub: 'Yield strength fy and ultimate tensile strength fu',
  std_ec_steel_col_grade: 'Grade',
  std_ec_steel_note: 'γM0 = 1.00 · γM1 = 1.00 · γM2 = 1.25 (recommended values)',

  // EC ref — concrete
  std_ec_concrete_title: 'Concrete Strength Classes — EN 1992-1-1 Table 3.1',
  std_ec_concrete_sub: 'Design values with γc = 1.5 (persistent/transient)',
  std_ec_concrete_col_class: 'Class',
  std_ec_concrete_note: 'fcd = αcc·fck/γc = 0.85·fck/1.5 · γc = 1.5 · γs = 1.15',

  // TCVN ref — sidebar labels
  std_vn_nav_overview: 'Overview',
  std_vn_nav_load: 'Load Factors',
  std_vn_nav_concrete: 'Concrete',
  std_vn_nav_rebar: 'Rebar',

  // TCVN ref — overview
  std_vn_overview_title: 'Vietnamese Construction Standards (TCVN)',
  std_vn_overview_sub: 'Main structural design standards currently applied in Vietnam',
  std_vn_col_standard: 'Standard',
  std_vn_col_title: 'Title',
  std_vn_col_field: 'Field',

  // TCVN parts titles
  std_vn_2737_title: 'Loads and actions — Design standard',
  std_vn_5574_title: 'Concrete and reinforced concrete structures',
  std_vn_5575_title: 'Steel structures — Design standard',
  std_vn_9386_title: 'Design of structures for earthquake resistance',
  std_vn_10304_title: 'Pile foundations — Design standard',
  std_vn_9362_title: 'Design standard for building and structure foundations',
  std_vn_5472_title: 'Building structures — Notation',
  std_vn_4453_title: 'Monolithic concrete and RC structures',

  // TCVN parts categories
  std_vn_cat_load: 'Loads',
  std_vn_cat_concrete: 'Concrete',
  std_vn_cat_steel: 'Steel',
  std_vn_cat_seismic: 'Seismic',
  std_vn_cat_foundation: 'Foundation',
  std_vn_cat_soil: 'Soil & Foundation',
  std_vn_cat_general: 'General',

  // TCVN ref — load factors
  std_vn_load_title: 'Load Factors — TCVN 2737:1995',
  std_vn_load_sub: 'Factor n used to calculate design loads',
  std_vn_load_col_load: 'Load type',
  std_vn_load_col_factor: 'Factor n',
  std_vn_load_col_note: 'Note',
  std_vn_load_perm_unfav: 'Permanent load (unfavourable)',
  std_vn_load_perm_fav: 'Permanent load (favourable)',
  std_vn_load_imposed_res: 'Imposed — residential floor',
  std_vn_load_imposed_off: 'Imposed — office floor',
  std_vn_load_imposed_conc: 'Concentrated imposed load',
  std_vn_load_wind: 'Wind load',
  std_vn_load_seismic: 'Seismic load',
  std_vn_load_note_mat: 'Depends on material type',
  std_vn_load_note_stab: 'Stability check',
  std_vn_load_note_q2: 'q ≤ 2 kN/m²',
  std_vn_load_note_p1: 'P ≤ 1 kN',
  std_vn_load_note_2737: 'Per TCVN 2737',
  std_vn_load_note_9386: 'Per TCVN 9386',
  std_vn_load_combo_label: 'Design load:',
  std_vn_load_combo_note: 'F = Ftc × n  where Ftc is the characteristic load',

  // TCVN ref — concrete
  std_vn_concrete_title: 'Concrete Strength — TCVN 5574:2018',
  std_vn_concrete_sub: 'Design compressive and tensile strength (MPa)',
  std_vn_concrete_col_grade: 'Strength class',
  std_vn_concrete_note: 'Rb = design compressive strength · Rbn = characteristic compressive strength · Rbt = design tensile strength',

  // TCVN ref — rebar
  std_vn_rebar_title: 'Rebar Strength — TCVN 5574:2018',
  std_vn_rebar_sub: 'Design strength of longitudinal and transverse reinforcement (MPa)',
  std_vn_rebar_col_grade: 'Steel grade',
  std_vn_rebar_col_note: 'Note',
  std_vn_rebar_note_plain: 'Plain round bar',
  std_vn_rebar_note_deformed: 'Deformed bar',
  std_vn_rebar_note_high: 'High-strength deformed bar',
  std_vn_rebar_note_vhigh: 'Very high-strength deformed bar',
  std_vn_rebar_note: 'Rs = longitudinal tension · Rsc = longitudinal compression · Rsw = transverse tension',
} as const

export default standards
