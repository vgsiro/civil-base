// Two Parallel Flange Channels BACK TO BACK — Advance® UKPFC Back to Back
// BS EN 1993-1-1:2005 + BS 4-1:2005 / SCI P363 Blue Book
// Properties are for the combined two-channel section, flanges outward.
// Iy (major, stored as Ix) = 2 × single I_yy
// Iz (minor) stored as Iy = I_f (combined, depending on s — Blue Book lists s=0…15 mm)
// We store the s=0 Iz and iz values as the base row; ix derived from Iy/A.
import type { SectionRow } from '../_shared/types'

function pfcBtb(
  des: string, mass: number, A: number, s: number,
  Iy: number,         // cm⁴ — major axis (2× single Iy)
  Iz_s0: number,      // cm⁴ — minor axis at s=0
  Wely: number,       // cm³ — major elastic modulus
  Welz_s0: number,    // cm³ — minor elastic modulus at s=0
  Wply: number,       // cm³ — major plastic modulus
  Wplz_s0: number,    // cm³ — minor plastic modulus at s=0
  iy: number,         // cm  — major radius of gyration
  iz_s0: number,      // cm  — minor radius of gyration at s=0
): SectionRow {
  return {
    designation: des, mass,
    h: 0, b: 0, tw: 0, tf: 0, r: 0,
    A,
    Ix: Iy, Iy: Iz_s0,
    Wx: Wely, Wy: Welz_s0,
    Zx: Wply, Zy: Wplz_s0,
    ix: iy,   iy: iz_s0,
    J: 0, Cw: 0,
    s,
  }
}

export const PFC_BTB_SECTIONS: SectionRow[] = [
  //              des                              mass    A    s      Iy    Iz_s0  Wely  Welz   Wply  Wplz   iy    iz@0
  pfcBtb('2×PFC 430×100×64 Back to Back', 129, 164, 270, 43800, 30100, 2040, 1580, 2440, 1870, 16.3, 4.23),
  pfcBtb('2×PFC 380×100×54 Back to Back', 108, 137, 235, 30000, 14800, 1580,  870, 1880, 1440, 14.8, 4.42),
  pfcBtb('2×PFC 300×100×45 Back to Back',  91.1, 116, 185, 16500, 11000, 1100,  720, 1280, 1040, 11.9, 4.37),
  pfcBtb('2×PFC 300×90×41 Back to Back',   82.8, 105, 145, 14400,  9620,  962,  808, 1140,  962, 11.7, 3.80),
  pfcBtb('2×PFC 260×90×35 Back to Back',   69.7,  88.8, 145,  9460,  7240,  727,  512,  849,  660, 10.3, 4.22),
  pfcBtb('2×PFC 260×75×28 Back to Back',   55.2,  70.3, 155,  7240,  3640,  557,  310,  656,  440, 10.1, 3.40),
  pfcBtb('2×PFC 230×90×32 Back to Back',   64.3,  81.9, 120,  7040,  6520,  612,  462,  720,  592,  9.27, 4.38),
  pfcBtb('2×PFC 230×75×26 Back to Back',   51.3,  65.4, 135,  5500,  3200,  478,  258,  557,  367,  9.18, 3.29),
  pfcBtb('2×PFC 200×90×30 Back to Back',   59.4,  75.7,  90.0, 5050, 5050,  505,  355,  663,  453,  8.16, 4.55),
  pfcBtb('2×PFC 200×75×23 Back to Back',   46.9,  59.7,  90.0, 3930, 3130,  393,  234,  464,  332,  8.11, 3.74),
  pfcBtb('2×PFC 180×90×26 Back to Back',   52.1,  66.4,  88.0, 3640, 4010,  404,  319,  480,  406,  7.40, 4.76),
  pfcBtb('2×PFC 180×75×20 Back to Back',   40.7,  51.8,  90.0, 2740, 2470,  304,  185,  352,  264,  7.27, 3.68),
  pfcBtb('2×PFC 150×90×24 Back to Back',   47.7,  60.8,  45.0, 2320, 3060,  310,  226,  370,  290,  6.18, 4.69),
  pfcBtb('2×PFC 150×75×18 Back to Back',   35.7,  45.5,  65.0, 1720, 1860,  230,  148,  264,  196,  6.15, 3.82),
  pfcBtb('2×PFC 125×65×15 Back to Back',   29.5,  37.6,  50.0,  966, 1010,  155,  97.9,  178,  131,  5.07, 3.35),
  pfcBtb('2×PFC 100×50×10 Back to Back',   20.4,  26.0,  40.0,  415,  415,  83.1,  62.0,  97.7, 82.2,  4.00, 2.82),
]
