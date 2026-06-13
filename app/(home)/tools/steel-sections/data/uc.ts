import type { SectionRow } from '../_shared/types'

// Hot-rolled UC — BS 4-1:2005 / SCI P363 Blue Book
// All section properties read directly from Blue Book screenshots.
// Units: mass kg/m, h/b/tw/tf/r mm, A cm², I cm⁴, W/Z cm³, i cm, J cm⁴, Cw dm⁶
export const UC_SECTIONS: SectionRow[] = [
  // 76×76 series
  { designation:'UC 76×76×15',    mass:15,  h:76.2,  b:76.2,  tw:5.1,  tf:8.4,  r:8.9,  A:19.1,  Ix:172,    Iy:60.8,   Wx:45.2,  Wy:15.9,  Zx:51.8,  Zy:24.5,  ix:3.00, iy:1.79, J:11.7,   Cw:0.00700, surfacePerM:0.419, surfacePerTonne:27.9 },

  // 102×102 series
  { designation:'UC 102×102×23',  mass:23,  h:101.6, b:101.0, tw:5.8,  tf:9.5,  r:11.4, A:29.4,  Ix:486,    Iy:154,    Wx:95.8,  Wy:30.5,  Zx:110,   Zy:46.7,  ix:4.07, iy:2.29, J:21.4,   Cw:0.0347,  surfacePerM:0.536, surfacePerTonne:23.3 },

  // 127×76 series — open section (not 127×127)
  { designation:'UC 127×76×13',   mass:13,  h:127.0, b:76.2,  tw:4.0,  tf:7.6,  r:7.6,  A:16.5,  Ix:473,    Iy:55.7,   Wx:74.5,  Wy:14.6,  Zx:84.2,  Zy:22.6,  ix:5.35, iy:1.84, J:2.85,   Cw:0.00568, surfacePerM:0.512, surfacePerTonne:39.4 },

  // 152×152 series
  { designation:'UC 152×152×23',  mass:23,  h:152.4, b:152.2, tw:5.8,  tf:6.8,  r:7.6,  A:29.2,  Ix:1263,   Iy:403,    Wx:165,   Wy:52.9,  Zx:185,   Zy:80.1,  ix:6.57, iy:3.72, J:6.52,   Cw:0.0986,  surfacePerM:0.689, surfacePerTonne:30.0 },
  { designation:'UC 152×152×30',  mass:30,  h:157.6, b:152.9, tw:6.5,  tf:9.4,  r:7.6,  A:38.3,  Ix:1748,   Iy:560,    Wx:222,   Wy:73.3,  Zx:248,   Zy:111,   ix:6.75, iy:3.82, J:16.6,   Cw:0.139,   surfacePerM:0.697, surfacePerTonne:23.2 },
  { designation:'UC 152×152×37',  mass:37,  h:161.8, b:154.4, tw:8.0,  tf:11.5, r:7.6,  A:47.1,  Ix:2210,   Iy:706,    Wx:273,   Wy:91.5,  Zx:309,   Zy:140,   ix:6.85, iy:3.87, J:31.3,   Cw:0.176,   surfacePerM:0.706, surfacePerTonne:19.1 },

  // 203×203 series
  { designation:'UC 203×203×46',  mass:46,  h:203.2, b:203.6, tw:7.2,  tf:11.0, r:10.2, A:58.8,  Ix:4568,   Iy:1548,   Wx:450,   Wy:152,   Zx:497,   Zy:231,   ix:8.82, iy:5.13, J:22.2,   Cw:0.562,   surfacePerM:0.897, surfacePerTonne:19.5 },
  { designation:'UC 203×203×52',  mass:52,  h:206.2, b:203.9, tw:7.9,  tf:12.5, r:10.2, A:66.4,  Ix:5259,   Iy:1778,   Wx:510,   Wy:174,   Zx:567,   Zy:265,   ix:8.90, iy:5.17, J:33.2,   Cw:0.651,   surfacePerM:0.903, surfacePerTonne:17.4 },
  { designation:'UC 203×203×60',  mass:60,  h:209.6, b:205.8, tw:9.4,  tf:14.2, r:10.2, A:76.4,  Ix:6088,   Iy:2065,   Wx:581,   Wy:201,   Zx:652,   Zy:308,   ix:8.93, iy:5.20, J:51.7,   Cw:0.764,   surfacePerM:0.912, surfacePerTonne:15.2 },
  { designation:'UC 203×203×71',  mass:71,  h:215.8, b:206.4, tw:10.0, tf:17.3, r:10.2, A:90.4,  Ix:7618,   Iy:2537,   Wx:706,   Wy:246,   Zx:799,   Zy:378,   ix:9.18, iy:5.30, J:89.0,   Cw:0.967,   surfacePerM:0.924, surfacePerTonne:13.0 },
  { designation:'UC 203×203×86',  mass:86,  h:222.2, b:209.1, tw:12.7, tf:20.5, r:10.2, A:110,   Ix:9449,   Iy:3119,   Wx:851,   Wy:298,   Zx:977,   Zy:462,   ix:9.27, iy:5.34, J:154,    Cw:1.21,    surfacePerM:0.937, surfacePerTonne:10.9 },
  { designation:'UC 203×203×100', mass:100, h:228.6, b:210.7, tw:14.5, tf:23.7, r:10.2, A:127,   Ix:11340,  Iy:3735,   Wx:992,   Wy:355,   Zx:1148,  Zy:553,   ix:9.43, iy:5.42, J:244,    Cw:1.48,    surfacePerM:0.949, surfacePerTonne: 9.49 },

  // 254×254 series
  { designation:'UC 254×254×73',  mass:73,  h:254.1, b:254.6, tw:8.6,  tf:14.2, r:12.7, A:93.1,  Ix:11360,  Iy:3873,   Wx:894,   Wy:305,   Zx:990,   Zy:465,   ix:11.1, iy:6.46, J:57.6,   Cw:1.69,    surfacePerM:1.12,  surfacePerTonne:15.3 },
  { designation:'UC 254×254×89',  mass:89,  h:260.3, b:255.9, tw:10.3, tf:17.3, r:12.7, A:114,   Ix:14270,  Iy:4857,   Wx:1097,  Wy:380,   Zx:1224,  Zy:582,   ix:11.2, iy:6.53, J:102,    Cw:2.15,    surfacePerM:1.13,  surfacePerTonne:12.7 },
  { designation:'UC 254×254×107', mass:107, h:266.7, b:258.8, tw:12.8, tf:20.5, r:12.7, A:136,   Ix:17510,  Iy:5928,   Wx:1310,  Wy:458,   Zx:1480,  Zy:706,   ix:11.3, iy:6.59, J:172,    Cw:2.69,    surfacePerM:1.14,  surfacePerTonne:10.7 },
  { designation:'UC 254×254×132', mass:132, h:276.3, b:261.3, tw:15.3, tf:25.3, r:12.7, A:168,   Ix:22530,  Iy:7531,   Wx:1630,  Wy:577,   Zx:1870,  Zy:895,   ix:11.6, iy:6.69, J:325,    Cw:3.53,    surfacePerM:1.16,  surfacePerTonne: 8.79 },
  { designation:'UC 254×254×167', mass:167, h:289.1, b:265.2, tw:19.2, tf:31.7, r:12.7, A:212,   Ix:29940,  Iy:9870,   Wx:2070,  Wy:745,   Zx:2420,  Zy:1170,  ix:11.9, iy:6.83, J:641,    Cw:4.79,    surfacePerM:1.19,  surfacePerTonne: 7.13 },

  // 305×305 series
  { designation:'UC 305×305×97',  mass:97,  h:307.9, b:304.8, tw:9.9,  tf:15.4, r:15.2, A:123,   Ix:22250,  Iy:7268,   Wx:1440,  Wy:477,   Zx:1590,  Zy:728,   ix:13.4, iy:7.69, J:94.7,   Cw:3.77,    surfacePerM:1.35,  surfacePerTonne:13.9 },
  { designation:'UC 305×305×118', mass:118, h:314.5, b:306.8, tw:11.9, tf:18.7, r:15.2, A:150,   Ix:27690,  Iy:9059,   Wx:1760,  Wy:591,   Zx:1960,  Zy:906,   ix:13.6, iy:7.77, J:165,    Cw:4.79,    surfacePerM:1.36,  surfacePerTonne:11.5 },
  { designation:'UC 305×305×137', mass:137, h:320.5, b:308.7, tw:13.8, tf:21.7, r:15.2, A:174,   Ix:32810,  Iy:10700,  Wx:2050,  Wy:693,   Zx:2300,  Zy:1060,  ix:13.7, iy:7.83, J:263,    Cw:5.78,    surfacePerM:1.37,  surfacePerTonne:10.0 },
  { designation:'UC 305×305×158', mass:158, h:327.1, b:310.6, tw:15.8, tf:25.0, r:15.2, A:201,   Ix:38750,  Iy:12570,  Wx:2370,  Wy:810,   Zx:2680,  Zy:1240,  ix:13.9, iy:7.90, J:406,    Cw:6.97,    surfacePerM:1.39,  surfacePerTonne: 8.80 },
  { designation:'UC 305×305×198', mass:198, h:339.9, b:314.5, tw:19.1, tf:31.4, r:15.2, A:252,   Ix:50900,  Iy:16300,  Wx:2990,  Wy:1040,  Zx:3440,  Zy:1600,  ix:14.2, iy:8.04, J:793,    Cw:9.34,    surfacePerM:1.42,  surfacePerTonne: 7.17 },
  { designation:'UC 305×305×240', mass:240, h:352.5, b:318.4, tw:23.0, tf:37.7, r:15.2, A:305,   Ix:64200,  Iy:20310,  Wx:3640,  Wy:1280,  Zx:4250,  Zy:1980,  ix:14.5, iy:8.15, J:1400,   Cw:12.1,    surfacePerM:1.45,  surfacePerTonne: 6.04 },
  { designation:'UC 305×305×283', mass:283, h:365.3, b:322.2, tw:26.8, tf:44.1, r:15.2, A:360,   Ix:78870,  Iy:24630,  Wx:4320,  Wy:1530,  Zx:5110,  Zy:2380,  ix:14.8, iy:8.27, J:2260,   Cw:15.1,    surfacePerM:1.48,  surfacePerTonne: 5.23 },

  // 356×368 series
  { designation:'UC 356×368×129', mass:129, h:355.6, b:368.6, tw:10.4, tf:17.5, r:15.2, A:164,   Ix:40250,  Iy:14610,  Wx:2260,  Wy:793,   Zx:2480,  Zy:1210,  ix:15.7, iy:9.44, J:177,    Cw:9.81,    surfacePerM:1.63,  surfacePerTonne:12.6 },
  { designation:'UC 356×368×153', mass:153, h:362.0, b:370.5, tw:12.3, tf:20.7, r:15.2, A:195,   Ix:48590,  Iy:17550,  Wx:2680,  Wy:947,   Zx:2970,  Zy:1450,  ix:15.8, iy:9.49, J:295,    Cw:12.0,    surfacePerM:1.65,  surfacePerTonne:10.8 },
  { designation:'UC 356×368×177', mass:177, h:368.2, b:372.6, tw:14.4, tf:23.8, r:15.2, A:225,   Ix:57150,  Iy:20530,  Wx:3100,  Wy:1100,  Zx:3460,  Zy:1700,  ix:15.9, iy:9.54, J:456,    Cw:14.3,    surfacePerM:1.66,  surfacePerTonne: 9.38 },
  { designation:'UC 356×368×202', mass:202, h:374.6, b:374.7, tw:16.5, tf:27.0, r:15.2, A:257,   Ix:66260,  Iy:23690,  Wx:3540,  Wy:1270,  Zx:3970,  Zy:1950,  ix:16.1, iy:9.61, J:672,    Cw:16.8,    surfacePerM:1.68,  surfacePerTonne: 8.32 },

  // 356×406 series
  { designation:'UC 356×406×235', mass:235, h:381.0, b:394.8, tw:18.4, tf:30.2, r:15.2, A:299,   Ix:79080,  Iy:31010,  Wx:4150,  Wy:1570,  Zx:4690,  Zy:2440,  ix:16.3, iy:10.2, J:1010,   Cw:26.4,    surfacePerM:1.76,  surfacePerTonne: 7.49 },
  { designation:'UC 356×406×287', mass:287, h:393.6, b:399.0, tw:22.6, tf:36.5, r:15.2, A:366,   Ix:99880,  Iy:39160,  Wx:5080,  Wy:1960,  Zx:5810,  Zy:3070,  ix:16.5, iy:10.3, J:1880,   Cw:34.3,    surfacePerM:1.79,  surfacePerTonne: 6.24 },
  { designation:'UC 356×406×340', mass:340, h:406.4, b:403.0, tw:26.0, tf:42.9, r:15.2, A:433,   Ix:122500, Iy:47350,  Wx:6030,  Wy:2350,  Zx:7000,  Zy:3690,  ix:16.8, iy:10.5, J:3150,   Cw:43.4,    surfacePerM:1.82,  surfacePerTonne: 5.35 },
  { designation:'UC 356×406×393', mass:393, h:419.0, b:407.0, tw:30.6, tf:49.2, r:15.2, A:500,   Ix:147200, Iy:55370,  Wx:7030,  Wy:2720,  Zx:8220,  Zy:4300,  ix:17.1, iy:10.5, J:4850,   Cw:53.5,    surfacePerM:1.86,  surfacePerTonne: 4.73 },
  { designation:'UC 356×406×467', mass:467, h:436.6, b:412.2, tw:35.8, tf:58.0, r:15.2, A:595,   Ix:183000, Iy:67830,  Wx:8380,  Wy:3290,  Zx:9960,  Zy:5240,  ix:17.5, iy:10.7, J:8170,   Cw:68.0,    surfacePerM:1.92,  surfacePerTonne: 4.11 },
  { designation:'UC 356×406×551', mass:551, h:455.6, b:418.5, tw:42.0, tf:67.5, r:15.2, A:701,   Ix:226900, Iy:82670,  Wx:9960,  Wy:3950,  Zx:11990, Zy:6340,  ix:18.0, iy:10.9, J:14200,  Cw:86.2,    surfacePerM:1.99,  surfacePerTonne: 3.61 },
  { designation:'UC 356×406×634', mass:634, h:474.6, b:424.0, tw:47.6, tf:77.0, r:15.2, A:808,   Ix:274800, Iy:98130,  Wx:11600, Wy:4630,  Zx:14200, Zy:7470,  ix:18.4, iy:11.0, J:22300,  Cw:106,     surfacePerM:2.06,  surfacePerTonne: 3.25 },
]
