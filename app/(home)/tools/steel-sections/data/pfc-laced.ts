// Two Parallel Flange Channels LACED — Advance® UKPFC Laced
// BS EN 1993-1-1:2005 + BS 4-1:2005 / SCI P363 Blue Book
// Properties are for the combined (two-channel) section.
// s = space between backs of webs (mm)
// Iy (→ Ix in SectionRow) = 2 × I_yy of single channel (major axis, about combined centroid)
// Iy of laced = same as single; both channels share the same centroid distance on y-y
// For z-z axis: depends on spacing s — Blue Book tabulates at s = 0, 8, 10, 12, 15 mm
// We store the s=0 (minimum) combined values as the base row.
import type { SectionRow } from '../_shared/types'

function pfcLaced(
  des: string, mass: number, A: number, s: number,
  Iy: number, Iz: number,
  iy: number, iz: number,
  Wely: number, Welz: number,
  Wply: number, Wplz: number,
): SectionRow {
  return {
    designation: des, mass,
    h: 0, b: 0, tw: 0, tf: 0, r: 0,
    A,
    Ix: Iy, Iy: Iz,
    Wx: Wely, Wy: Welz,
    Zx: Wply, Zy: Wplz,
    ix: iy, iy: iz,
    J: 0, Cw: 0,
    s,
  }
}

export const PFC_LACED_SECTIONS: SectionRow[] = [
  //              des                    mass   A     s      Iy      Iz    iy    iz   Wely  Welz  Wply  Wplz
  pfcLaced('2×PFC 430×100×64 Laced', 129, 164, 270, 43800, 44100, 16.3, 16.4, 2040, 1880, 2440, 2650),
  pfcLaced('2×PFC 380×100×54 Laced', 108, 137, 235, 30000, 16200, 14.8, 14.9, 1580, 1400, 1880, 2090),
  pfcLaced('2×PFC 300×100×45 Laced',  91.1, 116, 185, 16500, 16600, 11.9, 11.9, 1100,  898, 1280, 1340),
  pfcLaced('2×PFC 300×90×41 Laced',   82.8, 105, 145, 14400, 14400, 11.7, 11.7,  962,  811, 1140, 1200),
  pfcLaced('2×PFC 260×90×35 Laced',   69.7,  88.8, 145,  9460,  9560, 10.3, 10.4,  727,  588,  849,  886),
  pfcLaced('2×PFC 260×75×28 Laced',   55.2,  70.3, 155,  7240,  7190, 10.1, 10.1,  557,  427,  656,  692),
  pfcLaced('2×PFC 230×90×32 Laced',   64.3,  81.9, 120,  7040,  7040,  9.27,  9.27,  612,  512,  720,  760),
  pfcLaced('2×PFC 230×75×26 Laced',   51.3,  65.4, 135,  5500,  5720,  9.18,  9.35,  478,  401,  557,  592),
  pfcLaced('2×PFC 200×90×30 Laced',   59.4,  75.7,  90.0, 5050,  5030,  8.16,  8.15,  505,  372,  663,  577),
  pfcLaced('2×PFC 200×75×23 Laced',   46.9,  59.7,  90.0, 3930,  3930,  8.11,  8.11,  393,  306,  464,  452),
  pfcLaced('2×PFC 180×90×26 Laced',   52.1,  66.4,  88.0, 3640,  3730,  7.40,  7.49,  404,  292,  480,  459),
  pfcLaced('2×PFC 180×75×20 Laced',   40.7,  51.8,  90.0, 2740,  2770,  7.27,  7.31,  304,  231,  352,  358),
  pfcLaced('2×PFC 150×90×24 Laced',   47.7,  60.8,  45.0, 2320,  2380,  6.18,  6.26,  310,  212,  632,  338),
  pfcLaced('2×PFC 150×75×18 Laced',   35.7,  45.5,  65.0, 1720,  1810,  6.15,  6.30,  230,  168,  264,  265),
  pfcLaced('2×PFC 125×65×15 Laced',   29.5,  37.6,  50.0,  966,  1010,  5.07,  5.18,  155,  107,  178,  178),
  pfcLaced('2×PFC 100×50×10 Laced',   20.4,  26.0,  40.0,  415,   427,  4.00,  4.05,  83.1,  61.0,  97.7,  97.1),
]
