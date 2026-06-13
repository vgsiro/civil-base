import type { SectionRow } from '../_shared/types'

export const UB_SECTIONS: SectionRow[] = [
  // 127×76 series
  { designation:'UB 127×76×13',   mass:13,  h:127.0, b:76.0,  tw:4.0,  tf:7.6,  r:7.6,  A:16.5,  Ix:473,    Iy:55.7,   Wx:74.5,  Wy:14.7,  Zx:84.2,  Zy:22.8,  ix:5.35, iy:1.84, J:2.85,  Cw:0.00568, surfacePerM:0.395, surfacePerTonne:30.4 },

  // 152×89 series
  { designation:'UB 152×89×16',   mass:16,  h:152.4, b:88.7,  tw:4.5,  tf:7.7,  r:7.6,  A:20.3,  Ix:834,    Iy:89.8,   Wx:109,   Wy:20.2,  Zx:123,   Zy:31.2,  ix:6.41, iy:2.10, J:3.56,  Cw:0.0152,  surfacePerM:0.469, surfacePerTonne:29.3 },

  // 178×102 series
  { designation:'UB 178×102×19',  mass:19,  h:177.8, b:101.2, tw:4.8,  tf:7.9,  r:7.6,  A:24.3,  Ix:1360,   Iy:137,    Wx:153,   Wy:27.0,  Zx:171,   Zy:41.6,  ix:7.48, iy:2.37, J:4.41,  Cw:0.0333,  surfacePerM:0.547, surfacePerTonne:28.8 },

  // 203×102 series
  { designation:'UB 203×102×23',  mass:23,  h:203.2, b:101.8, tw:5.4,  tf:9.3,  r:7.6,  A:29.4,  Ix:2105,   Iy:163,    Wx:207,   Wy:32.0,  Zx:234,   Zy:49.7,  ix:8.46, iy:2.35, J:7.02,  Cw:0.0605,  surfacePerM:0.599, surfacePerTonne:26.0 },

  // 203×133 series
  { designation:'UB 203×133×25',  mass:25,  h:203.2, b:133.2, tw:5.7,  tf:7.8,  r:7.6,  A:32.2,  Ix:2340,   Iy:308,    Wx:230,   Wy:46.2,  Zx:258,   Zy:70.9,  ix:8.52, iy:3.09, J:6.34,  Cw:0.103,   surfacePerM:0.663, surfacePerTonne:26.5 },
  { designation:'UB 203×133×30',  mass:30,  h:206.8, b:133.9, tw:6.4,  tf:9.6,  r:7.6,  A:38.0,  Ix:2900,   Iy:385,    Wx:280,   Wy:57.5,  Zx:314,   Zy:88.0,  ix:8.73, iy:3.18, J:10.3,  Cw:0.131,   surfacePerM:0.669, surfacePerTonne:22.3 },

  // 254×102 series
  { designation:'UB 254×102×22',  mass:22,  h:254.0, b:101.6, tw:5.8,  tf:6.8,  r:7.6,  A:28.0,  Ix:2840,   Iy:119,    Wx:224,   Wy:23.5,  Zx:259,   Zy:36.5,  ix:10.1, iy:2.06, J:5.11,  Cw:0.0680,  surfacePerM:0.697, surfacePerTonne:31.7 },
  { designation:'UB 254×102×25',  mass:25,  h:257.2, b:101.9, tw:6.1,  tf:8.4,  r:7.6,  A:32.2,  Ix:3415,   Iy:149,    Wx:266,   Wy:29.2,  Zx:306,   Zy:45.2,  ix:10.3, iy:2.15, J:8.55,  Cw:0.0847,  surfacePerM:0.701, surfacePerTonne:28.0 },
  { designation:'UB 254×102×28',  mass:28,  h:260.4, b:102.2, tw:6.4,  tf:10.0, r:7.6,  A:36.1,  Ix:4005,   Iy:178,    Wx:308,   Wy:34.9,  Zx:354,   Zy:54.0,  ix:10.5, iy:2.22, J:13.3,  Cw:0.103,   surfacePerM:0.707, surfacePerTonne:25.2 },

  // 254×146 series
  { designation:'UB 254×146×31',  mass:31,  h:251.4, b:146.1, tw:6.0,  tf:8.6,  r:7.6,  A:39.7,  Ix:4410,   Iy:448,    Wx:351,   Wy:61.3,  Zx:393,   Zy:94.1,  ix:10.5, iy:3.36, J:9.74,  Cw:0.190,   surfacePerM:0.778, surfacePerTonne:25.1 },
  { designation:'UB 254×146×37',  mass:37,  h:256.0, b:146.4, tw:6.3,  tf:10.9, r:7.6,  A:47.2,  Ix:5540,   Iy:571,    Wx:433,   Wy:78.0,  Zx:484,   Zy:119,   ix:10.8, iy:3.48, J:17.6,  Cw:0.243,   surfacePerM:0.784, surfacePerTonne:21.2 },
  { designation:'UB 254×146×43',  mass:43,  h:259.6, b:147.3, tw:7.2,  tf:12.7, r:7.6,  A:54.8,  Ix:6540,   Iy:677,    Wx:504,   Wy:92.0,  Zx:566,   Zy:141,   ix:10.9, iy:3.52, J:28.0,  Cw:0.291,   surfacePerM:0.791, surfacePerTonne:18.4 },

  // 305×102 series
  { designation:'UB 305×102×25',  mass:25,  h:304.8, b:101.6, tw:5.8,  tf:6.8,  r:7.6,  A:31.4,  Ix:4455,   Iy:116,    Wx:292,   Wy:22.9,  Zx:342,   Zy:35.7,  ix:11.9, iy:1.92, J:5.00,  Cw:0.0851,  surfacePerM:0.797, surfacePerTonne:31.9 },
  { designation:'UB 305×102×28',  mass:28,  h:308.7, b:101.8, tw:6.0,  tf:8.9,  r:7.6,  A:36.3,  Ix:5366,   Iy:148,    Wx:348,   Wy:29.0,  Zx:406,   Zy:45.1,  ix:12.2, iy:2.02, J:10.1,  Cw:0.107,   surfacePerM:0.803, surfacePerTonne:28.7 },
  { designation:'UB 305×102×33',  mass:33,  h:312.7, b:102.4, tw:6.6,  tf:10.8, r:7.6,  A:41.8,  Ix:6501,   Iy:183,    Wx:416,   Wy:35.8,  Zx:481,   Zy:55.7,  ix:12.5, iy:2.09, J:17.9,  Cw:0.133,   surfacePerM:0.812, surfacePerTonne:24.6 },

  // 305×127 series
  { designation:'UB 305×127×37',  mass:37,  h:304.4, b:123.3, tw:7.1,  tf:10.7, r:8.9,  A:47.5,  Ix:7162,   Iy:336,    Wx:471,   Wy:54.5,  Zx:539,   Zy:84.2,  ix:12.3, iy:2.66, J:19.1,  Cw:0.255,   surfacePerM:0.845, surfacePerTonne:22.8 },
  { designation:'UB 305×127×42',  mass:42,  h:307.2, b:124.3, tw:8.0,  tf:12.1, r:8.9,  A:53.4,  Ix:8196,   Iy:389,    Wx:534,   Wy:62.6,  Zx:613,   Zy:96.9,  ix:12.4, iy:2.70, J:28.6,  Cw:0.297,   surfacePerM:0.850, surfacePerTonne:20.2 },
  { designation:'UB 305×127×48',  mass:48,  h:311.0, b:125.3, tw:9.0,  tf:14.0, r:8.9,  A:61.2,  Ix:9575,   Iy:461,    Wx:616,   Wy:73.6,  Zx:708,   Zy:114,   ix:12.5, iy:2.74, J:44.8,  Cw:0.351,   surfacePerM:0.858, surfacePerTonne:17.9 },

  // 305×165 series
  { designation:'UB 305×165×40',  mass:40,  h:303.4, b:165.0, tw:6.0,  tf:10.2, r:8.9,  A:51.3,  Ix:8500,   Iy:764,    Wx:560,   Wy:92.6,  Zx:623,   Zy:141,   ix:12.9, iy:3.86, J:20.4,  Cw:0.473,   surfacePerM:0.921, surfacePerTonne:23.0 },
  { designation:'UB 305×165×46',  mass:46,  h:306.6, b:165.7, tw:6.7,  tf:11.8, r:8.9,  A:58.7,  Ix:9899,   Iy:896,    Wx:646,   Wy:108,   Zx:720,   Zy:165,   ix:13.0, iy:3.91, J:31.7,  Cw:0.558,   surfacePerM:0.927, surfacePerTonne:20.2 },
  { designation:'UB 305×165×54',  mass:54,  h:310.4, b:166.9, tw:7.9,  tf:13.7, r:8.9,  A:68.8,  Ix:11700,  Iy:1060,   Wx:754,   Wy:127,   Zx:843,   Zy:194,   ix:13.0, iy:3.93, J:51.5,  Cw:0.664,   surfacePerM:0.935, surfacePerTonne:17.3 },

  // 356×127 series
  { designation:'UB 356×127×33',  mass:33,  h:349.0, b:125.4, tw:6.0,  tf:8.5,  r:10.2, A:42.1,  Ix:8196,   Iy:280,    Wx:470,   Wy:44.7,  Zx:543,   Zy:69.5,  ix:14.0, iy:2.58, J:12.1,  Cw:0.224,   surfacePerM:0.944, surfacePerTonne:28.6 },
  { designation:'UB 356×127×39',  mass:39,  h:353.4, b:126.0, tw:6.6,  tf:10.7, r:10.2, A:49.4,  Ix:10170,  Iy:358,    Wx:576,   Wy:56.8,  Zx:659,   Zy:88.0,  ix:14.4, iy:2.69, J:22.7,  Cw:0.286,   surfacePerM:0.952, surfacePerTonne:24.4 },

  // 356×171 series
  { designation:'UB 356×171×45',  mass:45,  h:351.4, b:171.1, tw:7.0,  tf:9.7,  r:10.2, A:57.0,  Ix:12070,  Iy:811,    Wx:687,   Wy:94.8,  Zx:775,   Zy:145,   ix:14.6, iy:3.77, J:23.8,  Cw:0.621,   surfacePerM:1.02,  surfacePerTonne:22.7 },
  { designation:'UB 356×171×51',  mass:51,  h:355.0, b:171.5, tw:7.4,  tf:11.5, r:10.2, A:64.6,  Ix:14140,  Iy:968,    Wx:796,   Wy:113,   Zx:895,   Zy:173,   ix:14.8, iy:3.87, J:38.0,  Cw:0.742,   surfacePerM:1.03,  surfacePerTonne:20.2 },
  { designation:'UB 356×171×57',  mass:57,  h:358.0, b:172.2, tw:8.1,  tf:13.0, r:10.2, A:72.6,  Ix:16040,  Iy:1108,   Wx:896,   Wy:129,   Zx:1010,  Zy:197,   ix:14.9, iy:3.91, J:55.7,  Cw:0.854,   surfacePerM:1.03,  surfacePerTonne:18.1 },
  { designation:'UB 356×171×67',  mass:67,  h:363.4, b:173.2, tw:9.1,  tf:15.7, r:10.2, A:85.5,  Ix:19460,  Iy:1362,   Wx:1070,  Wy:157,   Zx:1210,  Zy:242,   ix:15.1, iy:3.99, J:93.6,  Cw:1.05,    surfacePerM:1.04,  surfacePerTonne:15.5 },

  // 406×140 series
  { designation:'UB 406×140×39',  mass:39,  h:398.0, b:141.8, tw:6.4,  tf:8.6,  r:10.2, A:49.4,  Ix:12510,  Iy:410,    Wx:629,   Wy:57.8,  Zx:724,   Zy:90.0,  ix:15.9, iy:2.88, J:16.1,  Cw:0.410,   surfacePerM:1.08,  surfacePerTonne:27.7 },
  { designation:'UB 406×140×46',  mass:46,  h:402.3, b:142.2, tw:6.8,  tf:11.2, r:10.2, A:58.6,  Ix:15690,  Iy:538,    Wx:780,   Wy:75.7,  Zx:888,   Zy:117,   ix:16.4, iy:3.03, J:35.4,  Cw:0.519,   surfacePerM:1.09,  surfacePerTonne:23.7 },

  // 406×178 series
  { designation:'UB 406×178×54',  mass:54,  h:402.6, b:177.7, tw:7.7,  tf:10.9, r:10.2, A:68.4,  Ix:18720,  Iy:1022,   Wx:930,   Wy:115,   Zx:1051,  Zy:176,   ix:16.5, iy:3.86, J:47.0,  Cw:0.990,   surfacePerM:1.16,  surfacePerTonne:21.5 },
  { designation:'UB 406×178×60',  mass:60,  h:406.4, b:177.9, tw:7.9,  tf:12.8, r:10.2, A:75.9,  Ix:21600,  Iy:1203,   Wx:1063,  Wy:135,   Zx:1199,  Zy:208,   ix:16.9, iy:3.98, J:72.3,  Cw:1.16,    surfacePerM:1.16,  surfacePerTonne:19.4 },
  { designation:'UB 406×178×67',  mass:67,  h:409.4, b:178.8, tw:8.8,  tf:14.3, r:10.2, A:85.5,  Ix:24330,  Iy:1365,   Wx:1189,  Wy:153,   Zx:1346,  Zy:235,   ix:16.9, iy:4.00, J:103,   Cw:1.32,    surfacePerM:1.17,  surfacePerTonne:17.5 },
  { designation:'UB 406×178×74',  mass:74,  h:412.8, b:179.5, tw:9.5,  tf:16.0, r:10.2, A:94.5,  Ix:27310,  Iy:1544,   Wx:1324,  Wy:172,   Zx:1502,  Zy:265,   ix:17.0, iy:4.04, J:146,   Cw:1.50,    surfacePerM:1.18,  surfacePerTonne:15.9 },

  // 457×152 series
  { designation:'UB 457×152×52',  mass:52,  h:449.8, b:152.4, tw:7.6,  tf:10.9, r:10.2, A:66.5,  Ix:21345,  Iy:645,    Wx:950,   Wy:84.6,  Zx:1096,  Zy:131,   ix:17.9, iy:3.11, J:39.7,  Cw:0.818,   surfacePerM:1.20,  surfacePerTonne:23.1 },
  { designation:'UB 457×152×60',  mass:60,  h:454.6, b:152.9, tw:8.1,  tf:13.3, r:10.2, A:75.9,  Ix:25500,  Iy:795,    Wx:1122,  Wy:104,   Zx:1287,  Zy:160,   ix:18.3, iy:3.24, J:70.4,  Cw:0.984,   surfacePerM:1.21,  surfacePerTonne:20.2 },
  { designation:'UB 457×152×67',  mass:67,  h:458.0, b:153.8, tw:9.0,  tf:15.0, r:10.2, A:85.5,  Ix:28930,  Iy:913,    Wx:1263,  Wy:119,   Zx:1453,  Zy:183,   ix:18.4, iy:3.27, J:103,   Cw:1.13,    surfacePerM:1.22,  surfacePerTonne:18.2 },
  { designation:'UB 457×152×74',  mass:74,  h:462.0, b:154.4, tw:9.6,  tf:17.0, r:10.2, A:94.5,  Ix:32670,  Iy:1047,   Wx:1414,  Wy:136,   Zx:1627,  Zy:210,   ix:18.6, iy:3.33, J:150,   Cw:1.30,    surfacePerM:1.23,  surfacePerTonne:16.6 },
  { designation:'UB 457×152×82',  mass:82,  h:465.8, b:155.3, tw:10.5, tf:18.9, r:10.2, A:104,   Ix:36590,  Iy:1185,   Wx:1572,  Wy:153,   Zx:1811,  Zy:235,   ix:18.7, iy:3.37, J:211,   Cw:1.47,    surfacePerM:1.23,  surfacePerTonne:15.0 },

  // 457×191 series
  { designation:'UB 457×191×67',  mass:67,  h:453.4, b:189.9, tw:8.5,  tf:12.7, r:10.2, A:85.5,  Ix:29380,  Iy:1452,   Wx:1296,  Wy:153,   Zx:1471,  Zy:235,   ix:18.5, iy:4.12, J:81.2,  Cw:1.73,    surfacePerM:1.28,  surfacePerTonne:19.1 },
  { designation:'UB 457×191×74',  mass:74,  h:457.0, b:190.4, tw:9.0,  tf:14.5, r:10.2, A:94.6,  Ix:33320,  Iy:1671,   Wx:1458,  Wy:176,   Zx:1655,  Zy:270,   ix:18.8, iy:4.20, J:121,   Cw:1.99,    surfacePerM:1.28,  surfacePerTonne:17.3 },
  { designation:'UB 457×191×82',  mass:82,  h:460.0, b:191.3, tw:9.9,  tf:16.0, r:10.2, A:104,   Ix:37050,  Iy:1871,   Wx:1611,  Wy:196,   Zx:1832,  Zy:301,   ix:18.9, iy:4.23, J:172,   Cw:2.22,    surfacePerM:1.29,  surfacePerTonne:15.7 },
  { designation:'UB 457×191×89',  mass:89,  h:463.4, b:191.9, tw:10.5, tf:17.7, r:10.2, A:114,   Ix:41020,  Iy:2089,   Wx:1771,  Wy:218,   Zx:2014,  Zy:335,   ix:19.0, iy:4.28, J:236,   Cw:2.48,    surfacePerM:1.30,  surfacePerTonne:14.6 },
  { designation:'UB 457×191×98',  mass:98,  h:467.2, b:192.8, tw:11.4, tf:19.6, r:10.2, A:125,   Ix:45730,  Iy:2347,   Wx:1957,  Wy:244,   Zx:2232,  Zy:375,   ix:19.1, iy:4.33, J:329,   Cw:2.79,    surfacePerM:1.31,  surfacePerTonne:13.4 },

  // 533×210 series
  { designation:'UB 533×210×82',  mass:82,  h:528.3, b:208.8, tw:9.6,  tf:13.2, r:12.7, A:104,   Ix:47540,  Iy:2007,   Wx:1800,  Wy:192,   Zx:2056,  Zy:294,   ix:21.3, iy:4.38, J:109,   Cw:3.14,    surfacePerM:1.46,  surfacePerTonne:17.8 },
  { designation:'UB 533×210×92',  mass:92,  h:533.1, b:209.3, tw:10.1, tf:15.6, r:12.7, A:117,   Ix:55230,  Iy:2390,   Wx:2072,  Wy:228,   Zx:2360,  Zy:350,   ix:21.7, iy:4.51, J:174,   Cw:3.72,    surfacePerM:1.47,  surfacePerTonne:16.0 },
  { designation:'UB 533×210×101', mass:101, h:536.7, b:210.0, tw:10.8, tf:17.4, r:12.7, A:129,   Ix:61520,  Iy:2692,   Wx:2292,  Wy:257,   Zx:2613,  Zy:393,   ix:21.9, iy:4.57, J:253,   Cw:4.18,    surfacePerM:1.48,  surfacePerTonne:14.7 },
  { designation:'UB 533×210×109', mass:109, h:539.5, b:210.8, tw:11.6, tf:18.8, r:12.7, A:139,   Ix:66820,  Iy:2944,   Wx:2477,  Wy:279,   Zx:2828,  Zy:428,   ix:21.9, iy:4.60, J:330,   Cw:4.57,    surfacePerM:1.49,  surfacePerTonne:13.7 },
  { designation:'UB 533×210×122', mass:122, h:544.5, b:211.9, tw:12.7, tf:21.3, r:12.7, A:155,   Ix:76040,  Iy:3388,   Wx:2795,  Wy:320,   Zx:3196,  Zy:491,   ix:22.1, iy:4.67, J:500,   Cw:5.24,    surfacePerM:1.50,  surfacePerTonne:12.3 },

  // 610×229 series
  { designation:'UB 610×229×101', mass:101, h:602.6, b:227.6, tw:10.5, tf:14.8, r:12.7, A:129,   Ix:75780,  Iy:2915,   Wx:2516,  Wy:256,   Zx:2881,  Zy:392,   ix:24.2, iy:4.75, J:192,   Cw:6.53,    surfacePerM:1.67,  surfacePerTonne:16.5 },
  { designation:'UB 610×229×113', mass:113, h:607.6, b:228.2, tw:11.1, tf:17.3, r:12.7, A:144,   Ix:87320,  Iy:3434,   Wx:2875,  Wy:301,   Zx:3281,  Zy:462,   ix:24.6, iy:4.88, J:300,   Cw:7.73,    surfacePerM:1.68,  surfacePerTonne:14.9 },
  { designation:'UB 610×229×125', mass:125, h:612.2, b:229.0, tw:11.9, tf:19.6, r:12.7, A:159,   Ix:98610,  Iy:3932,   Wx:3222,  Wy:344,   Zx:3676,  Zy:527,   ix:24.9, iy:4.97, J:449,   Cw:8.83,    surfacePerM:1.69,  surfacePerTonne:13.5 },
  { designation:'UB 610×229×140', mass:140, h:617.2, b:230.2, tw:13.1, tf:22.1, r:12.7, A:178,   Ix:111800, Iy:4505,   Wx:3623,  Wy:391,   Zx:4142,  Zy:601,   ix:25.0, iy:5.03, J:661,   Cw:10.2,    surfacePerM:1.70,  surfacePerTonne:12.1 },

  // 610×305 series
  { designation:'UB 610×305×149', mass:149, h:612.4, b:304.8, tw:11.9, tf:19.7, r:16.5, A:190,   Ix:125900, Iy:9308,   Wx:4112,  Wy:611,   Zx:4596,  Zy:937,   ix:25.7, iy:7.00, J:591,   Cw:29.9,    surfacePerM:1.84,  surfacePerTonne:12.3 },
  { designation:'UB 610×305×179', mass:179, h:620.2, b:307.1, tw:14.1, tf:23.6, r:16.5, A:228,   Ix:152700, Iy:11410,  Wx:4926,  Wy:743,   Zx:5547,  Zy:1144,  ix:25.9, iy:7.08, J:1031,  Cw:36.8,    surfacePerM:1.86,  surfacePerTonne:10.4 },
  { designation:'UB 610×305×238', mass:238, h:635.8, b:311.4, tw:18.4, tf:31.4, r:16.5, A:303,   Ix:209500, Iy:15840,  Wx:6589,  Wy:1018,  Zx:7477,  Zy:1574,  ix:26.3, iy:7.23, J:2390,  Cw:51.9,    surfacePerM:1.90,  surfacePerTonne: 7.97 },

  // 686×254 series
  { designation:'UB 686×254×125', mass:125, h:677.9, b:253.0, tw:11.7, tf:16.2, r:15.2, A:159,   Ix:135900, Iy:4383,   Wx:4008,  Wy:346,   Zx:4560,  Zy:531,   ix:29.2, iy:5.24, J:297,   Cw:13.4,    surfacePerM:1.87,  surfacePerTonne:15.0 },
  { designation:'UB 686×254×140', mass:140, h:683.5, b:253.7, tw:12.4, tf:19.0, r:15.2, A:178,   Ix:159600, Iy:5183,   Wx:4671,  Wy:409,   Zx:5307,  Zy:628,   ix:29.9, iy:5.40, J:474,   Cw:15.9,    surfacePerM:1.89,  surfacePerTonne:13.5 },
  { designation:'UB 686×254×152', mass:152, h:687.5, b:254.5, tw:13.2, tf:21.0, r:15.2, A:194,   Ix:175000, Iy:5770,   Wx:5093,  Wy:454,   Zx:5806,  Zy:697,   ix:30.0, iy:5.46, J:632,   Cw:17.7,    surfacePerM:1.90,  surfacePerTonne:12.5 },
  { designation:'UB 686×254×170', mass:170, h:692.9, b:255.8, tw:14.5, tf:23.7, r:15.2, A:216,   Ix:197200, Iy:6621,   Wx:5694,  Wy:518,   Zx:6524,  Zy:797,   ix:30.2, iy:5.53, J:907,   Cw:20.3,    surfacePerM:1.91,  surfacePerTonne:11.2 },

  // 762×267 series
  { designation:'UB 762×267×134', mass:134, h:750.0, b:264.4, tw:12.0, tf:15.5, r:16.5, A:170,   Ix:168500, Iy:4788,   Wx:4490,  Wy:362,   Zx:5105,  Zy:555,   ix:31.5, iy:5.30, J:293,   Cw:16.7,    surfacePerM:2.07,  surfacePerTonne:15.4 },
  { designation:'UB 762×267×147', mass:147, h:754.0, b:265.2, tw:12.8, tf:17.5, r:16.5, A:187,   Ix:189300, Iy:5449,   Wx:5022,  Wy:411,   Zx:5707,  Zy:631,   ix:31.8, iy:5.40, J:421,   Cw:19.1,    surfacePerM:2.08,  surfacePerTonne:14.1 },
  { designation:'UB 762×267×173', mass:173, h:762.2, b:266.7, tw:14.3, tf:21.6, r:16.5, A:220,   Ix:228700, Iy:6850,   Wx:5998,  Wy:514,   Zx:6825,  Zy:790,   ix:32.2, iy:5.58, J:748,   Cw:23.9,    surfacePerM:2.10,  surfacePerTonne:12.1 },
  { designation:'UB 762×267×197', mass:197, h:769.8, b:268.0, tw:15.6, tf:25.4, r:16.5, A:251,   Ix:268000, Iy:8175,   Wx:6966,  Wy:610,   Zx:7936,  Zy:938,   ix:32.7, iy:5.71, J:1212,  Cw:28.8,    surfacePerM:2.12,  surfacePerTonne:10.8 },
  { designation:'UB 762×267×220', mass:220, h:778.0, b:268.0, tw:16.5, tf:30.2, r:16.5, A:281,   Ix:313200, Iy:9554,   Wx:8054,  Wy:713,   Zx:9245,  Zy:1099,  ix:33.4, iy:5.83, J:1863,  Cw:34.4,    surfacePerM:2.14,  surfacePerTonne: 9.73 },

  // 838×292 series
  { designation:'UB 838×292×176', mass:176, h:834.9, b:291.7, tw:14.0, tf:18.8, r:17.8, A:224,   Ix:279200, Iy:7962,   Wx:6688,  Wy:546,   Zx:7618,  Zy:838,   ix:35.3, iy:5.96, J:604,   Cw:30.8,    surfacePerM:2.35,  surfacePerTonne:13.4 },
  { designation:'UB 838×292×194', mass:194, h:840.7, b:292.4, tw:14.7, tf:21.7, r:17.8, A:247,   Ix:320300, Iy:9211,   Wx:7618,  Wy:630,   Zx:8689,  Zy:969,   ix:36.0, iy:6.11, J:891,   Cw:35.8,    surfacePerM:2.36,  surfacePerTonne:12.2 },
  { designation:'UB 838×292×226', mass:226, h:850.9, b:293.8, tw:16.1, tf:26.8, r:17.8, A:288,   Ix:388300, Iy:11360,  Wx:9124,  Wy:774,   Zx:10400, Zy:1196,  ix:36.7, iy:6.28, J:1497,  Cw:44.9,    surfacePerM:2.39,  surfacePerTonne:10.6 },

  // 914×305 series
  { designation:'UB 914×305×201', mass:201, h:903.0, b:303.3, tw:15.1, tf:20.2, r:19.1, A:256,   Ix:325300, Iy:9423,   Wx:7204,  Wy:621,   Zx:8351,  Zy:957,   ix:35.6, iy:6.07, J:838,   Cw:36.2,    surfacePerM:2.44,  surfacePerTonne:12.1 },
  { designation:'UB 914×305×224', mass:224, h:910.4, b:304.1, tw:15.9, tf:23.9, r:19.1, A:285,   Ix:376400, Iy:11080,  Wx:8269,  Wy:728,   Zx:9535,  Zy:1123,  ix:36.3, iy:6.23, J:1270,  Cw:43.4,    surfacePerM:2.46,  surfacePerTonne:11.0 },
  { designation:'UB 914×305×253', mass:253, h:918.4, b:305.5, tw:17.3, tf:27.1, r:19.1, A:323,   Ix:436300, Iy:12830,  Wx:9501,  Wy:840,   Zx:10940, Zy:1296,  ix:36.8, iy:6.31, J:1952,  Cw:51.2,    surfacePerM:2.48,  surfacePerTonne: 9.80 },
  { designation:'UB 914×305×289', mass:289, h:926.6, b:307.7, tw:19.5, tf:32.0, r:19.1, A:368,   Ix:504000, Iy:15600,  Wx:10880, Wy:1014,  Zx:12570, Zy:1571,  ix:37.0, iy:6.51, J:3004,  Cw:62.7,    surfacePerM:2.51,  surfacePerTonne: 8.68 },

  // 914×419 series
  { designation:'UB 914×419×343', mass:343, h:911.8, b:418.5, tw:19.4, tf:32.0, r:24.1, A:437,   Ix:625800, Iy:39160,  Wx:13730, Wy:1872,  Zx:15480, Zy:2890,  ix:37.8, iy:9.46, J:3874,  Cw:270,     surfacePerM:2.65,  surfacePerTonne: 7.72 },
  { designation:'UB 914×419×388', mass:388, h:920.5, b:420.5, tw:21.4, tf:36.6, r:24.1, A:494,   Ix:717600, Iy:45440,  Wx:15590, Wy:2161,  Zx:17670, Zy:3341,  ix:38.1, iy:9.59, J:5671,  Cw:313,     surfacePerM:2.67,  surfacePerTonne: 6.88 },

  // 1016×305 series
  { designation:'UB 1016×305×222',mass:222, h:970.3, b:300.0, tw:16.0, tf:21.1, r:19.1, A:283,   Ix:407600, Iy:9004,   Wx:8399,  Wy:600,   Zx:9814,  Zy:931,   ix:37.9, iy:5.64, J:1030,  Cw:38.0,    surfacePerM:2.55,  surfacePerTonne:11.5 },
  { designation:'UB 1016×305×249',mass:249, h:980.2, b:300.0, tw:16.5, tf:26.0, r:19.1, A:317,   Ix:481300, Iy:10620,  Wx:9821,  Wy:708,   Zx:11370, Zy:1100,  ix:38.9, iy:5.79, J:1769,  Cw:46.3,    surfacePerM:2.57,  surfacePerTonne:10.3 },
  { designation:'UB 1016×305×272',mass:272, h:990.1, b:300.0, tw:16.5, tf:31.0, r:19.1, A:347,   Ix:554400, Iy:12570,  Wx:11200, Wy:838,   Zx:12870, Zy:1301,  ix:39.9, iy:6.01, J:2849,  Cw:55.0,    surfacePerM:2.59,  surfacePerTonne: 9.52 },
  { designation:'UB 1016×305×314',mass:314, h:1000.0,b:300.0, tw:19.1, tf:35.9, r:19.1, A:400,   Ix:644700, Iy:14710,  Wx:12900, Wy:981,   Zx:14860, Zy:1527,  ix:40.1, iy:6.07, J:4327,  Cw:65.2,    surfacePerM:2.61,  surfacePerTonne: 8.31 },
  { designation:'UB 1016×305×349',mass:349, h:1008.1,b:302.0, tw:21.1, tf:40.0, r:19.1, A:445,   Ix:723100, Iy:16780,  Wx:14350, Wy:1112,  Zx:16600, Zy:1728,  ix:40.3, iy:6.14, J:6097,  Cw:75.8,    surfacePerM:2.63,  surfacePerTonne: 7.54 },
  { designation:'UB 1016×305×393',mass:393, h:1016.0,b:303.0, tw:24.4, tf:43.9, r:19.1, A:500,   Ix:808700, Iy:18980,  Wx:15920, Wy:1252,  Zx:18450, Zy:1950,  ix:40.2, iy:6.16, J:8647,  Cw:86.5,    surfacePerM:2.65,  surfacePerTonne: 6.74 },
]
