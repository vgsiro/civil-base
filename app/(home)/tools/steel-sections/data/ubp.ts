import type { SectionRow } from '../_shared/types'

// Universal Bearing Piles (UBP) — BS 4-1:2005 / SCI P363 Blue Book
// All section properties read directly from Blue Book screenshots.
// Units: mass kg/m, h/b/tw/tf/r mm, A cm², I cm⁴, W/Z cm³, i cm, J cm⁴, Cw dm⁶
export const UBP_SECTIONS: SectionRow[] = [
  // 356×368 series
  { designation:'UBP 356×368×174', mass:174, h:361.4, b:378.0, tw:20.3, tf:20.4, r:15.2, A:221,  Ix:51000, Iy:19100, Wx:2820, Wy:1010, Zx:3190, Zy:1540, ix:15.2, iy:9.29, J:313,   Cw:15.8,  surfacePerM:1.65, surfacePerTonne:9.48 },
  { designation:'UBP 356×368×152', mass:152, h:356.4, b:376.0, tw:17.9, tf:17.9, r:15.2, A:194,  Ix:44000, Iy:15900, Wx:2470, Wy:845,  Zx:2770, Zy:1290, ix:15.1, iy:9.05, J:211,   Cw:13.1,  surfacePerM:1.64, surfacePerTonne:10.8 },
  { designation:'UBP 356×368×133', mass:133, h:352.0, b:373.8, tw:15.6, tf:15.6, r:15.2, A:169,  Ix:38000, Iy:11000, Wx:2160, Wy:734,  Zx:2420, Zy:1120, ix:15.0, iy:8.07, J:140,   Cw:9.81,  surfacePerM:1.62, surfacePerTonne:12.2 },
  { designation:'UBP 356×368×109', mass:109, h:346.4, b:371.0, tw:12.9, tf:12.9, r:15.2, A:139,  Ix:30600, Iy:11000, Wx:1770, Wy:592,  Zx:1980, Zy:903,  ix:14.8, iy:8.87, J:78.6,  Cw:8.18,  surfacePerM:1.61, surfacePerTonne:14.8 },
  // 305×305 series
  { designation:'UBP 305×305×223', mass:223, h:337.9, b:316.6, tw:30.4, tf:30.4, r:15.2, A:284,  Ix:54900, Iy:17600, Wx:3250, Wy:1110, Zx:3820, Zy:1720, ix:13.9, iy:7.88, J:1630,  Cw:16.0,  surfacePerM:1.33, surfacePerTonne:5.96 },
  { designation:'UBP 305×305×186', mass:186, h:328.3, b:312.9, tw:25.2, tf:25.2, r:15.2, A:237,  Ix:44600, Iy:14300, Wx:2720, Wy:915,  Zx:3150, Zy:1410, ix:13.7, iy:7.78, J:937,   Cw:12.6,  surfacePerM:1.30, surfacePerTonne:6.99 },
  { designation:'UBP 305×305×149', mass:149, h:318.5, b:309.2, tw:20.6, tf:20.6, r:15.2, A:190,  Ix:34900, Iy:11200, Wx:2190, Wy:727,  Zx:2510, Zy:1110, ix:13.6, iy:7.69, J:496,   Cw:9.81,  surfacePerM:1.28, surfacePerTonne:8.59 },
  { designation:'UBP 305×305×126', mass:126, h:312.3, b:307.1, tw:17.3, tf:17.3, r:15.2, A:161,  Ix:29000, Iy:9240,  Wx:1860, Wy:602,  Zx:2110, Zy:921,  ix:13.4, iy:7.57, J:293,   Cw:7.98,  surfacePerM:1.27, surfacePerTonne:10.1 },
  { designation:'UBP 305×305×110', mass:110, h:307.9, b:305.9, tw:15.4, tf:15.4, r:15.2, A:140,  Ix:25200, Iy:8060,  Wx:1640, Wy:527,  Zx:1840, Zy:805,  ix:13.4, iy:7.59, J:202,   Cw:6.89,  surfacePerM:1.26, surfacePerTonne:11.5 },
  { designation:'UBP 305×305×88',  mass:88,  h:301.7, b:303.7, tw:12.3, tf:12.3, r:15.2, A:112,  Ix:19800, Iy:6330,  Wx:1310, Wy:417,  Zx:1470, Zy:636,  ix:13.3, iy:7.51, J:103,   Cw:5.32,  surfacePerM:1.24, surfacePerTonne:14.1 },
  { designation:'UBP 305×305×79',  mass:79,  h:299.3, b:306.4, tw:11.1, tf:11.1, r:15.2, A:100,  Ix:17600, Iy:5700,  Wx:1180, Wy:372,  Zx:1320, Zy:567,  ix:13.3, iy:7.55, J:75.2,  Cw:4.77,  surfacePerM:1.24, surfacePerTonne:15.7 },
  // 254×254 series
  { designation:'UBP 254×254×85',  mass:85,  h:254.0, b:260.0, tw:14.4, tf:14.4, r:12.7, A:108,  Ix:12400, Iy:4350,  Wx:976,  Wy:335,  Zx:1100, Zy:511,  ix:10.7, iy:6.35, J:147,   Cw:2.94,  surfacePerM:1.06, surfacePerTonne:12.5 },
  { designation:'UBP 254×254×63',  mass:63,  h:247.1, b:256.6, tw:10.6, tf:10.6, r:12.7, A:80.3, Ix:8860,  Iy:3020,  Wx:717,  Wy:235,  Zx:799,  Zy:358,  ix:10.5, iy:6.13, J:58.9,  Cw:2.00,  surfacePerM:1.04, surfacePerTonne:16.5 },
  // 203×203 series
  { designation:'UBP 203×203×54',  mass:54,  h:204.0, b:207.7, tw:11.0, tf:11.0, r:10.2, A:68.7, Ix:5180,  Iy:1770,  Wx:508,  Wy:170,  Zx:574,  Zy:260,  ix:8.68, iy:5.07, J:59.5,  Cw:0.693, surfacePerM:0.878, surfacePerTonne:16.3 },
  { designation:'UBP 203×203×45',  mass:45,  h:200.2, b:205.9, tw:9.5,  tf:9.5,  r:10.2, A:57.2, Ix:4100,  Iy:1390,  Wx:410,  Wy:135,  Zx:459,  Zy:206,  ix:8.46, iy:4.92, J:37.0,  Cw:0.536, surfacePerM:0.867, surfacePerTonne:19.3 },
]
