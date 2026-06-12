export interface UnitDef {
  id: string
  label: string
  symbol: string
  // factor: multiply this unit → base unit. null = special (temperature)
  factor?: number
  toBase?: (v: number) => number
  fromBase?: (v: number) => number
}

export interface Category {
  id: string
  label: string
  baseUnit: string   // id of the base unit for this category
  units: UnitDef[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    label: 'Length',
    baseUnit: 'm',
    units: [
      { id: 'mm',  label: 'Millimetre', symbol: 'mm',  factor: 1e-3 },
      { id: 'cm',  label: 'Centimetre', symbol: 'cm',  factor: 1e-2 },
      { id: 'm',   label: 'Metre',      symbol: 'm',   factor: 1    },
      { id: 'km',  label: 'Kilometre',  symbol: 'km',  factor: 1e3  },
      { id: 'in',  label: 'Inch',       symbol: 'in',  factor: 0.0254 },
      { id: 'ft',  label: 'Foot',       symbol: 'ft',  factor: 0.3048 },
      { id: 'yd',  label: 'Yard',       symbol: 'yd',  factor: 0.9144 },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    baseUnit: 'm2',
    units: [
      { id: 'mm2', label: 'mm²',  symbol: 'mm²',  factor: 1e-6   },
      { id: 'cm2', label: 'cm²',  symbol: 'cm²',  factor: 1e-4   },
      { id: 'm2',  label: 'm²',   symbol: 'm²',   factor: 1      },
      { id: 'km2', label: 'km²',  symbol: 'km²',  factor: 1e6    },
      { id: 'in2', label: 'in²',  symbol: 'in²',  factor: 6.4516e-4 },
      { id: 'ft2', label: 'ft²',  symbol: 'ft²',  factor: 0.092903  },
      { id: 'ha',  label: 'Hectare', symbol: 'ha', factor: 1e4   },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    baseUnit: 'm3',
    units: [
      { id: 'mm3', label: 'mm³',  symbol: 'mm³',  factor: 1e-9   },
      { id: 'cm3', label: 'cm³',  symbol: 'cm³',  factor: 1e-6   },
      { id: 'L',   label: 'Litre',symbol: 'L',    factor: 1e-3   },
      { id: 'm3',  label: 'm³',   symbol: 'm³',   factor: 1      },
      { id: 'in3', label: 'in³',  symbol: 'in³',  factor: 1.63871e-5 },
      { id: 'ft3', label: 'ft³',  symbol: 'ft³',  factor: 0.0283168  },
    ],
  },
  {
    id: 'force',
    label: 'Force',
    baseUnit: 'N',
    units: [
      { id: 'N',   label: 'Newton',     symbol: 'N',   factor: 1       },
      { id: 'kN',  label: 'Kilonewton', symbol: 'kN',  factor: 1e3     },
      { id: 'MN',  label: 'Meganewton', symbol: 'MN',  factor: 1e6     },
      { id: 'kgf', label: 'Kilogram-force', symbol: 'kgf', factor: 9.80665 },
      { id: 'tf',  label: 'Tonne-force',    symbol: 'tf',  factor: 9806.65 },
      { id: 'lbf', label: 'Pound-force',    symbol: 'lbf', factor: 4.44822 },
      { id: 'kip', label: 'Kip',            symbol: 'kip', factor: 4448.22 },
    ],
  },
  {
    id: 'moment',
    label: 'Moment',
    baseUnit: 'kNm',
    units: [
      { id: 'Nm',    label: 'N·m',     symbol: 'N·m',    factor: 1e-3    },
      { id: 'kNm',   label: 'kN·m',    symbol: 'kN·m',   factor: 1       },
      { id: 'kNcm',  label: 'kN·cm',   symbol: 'kN·cm',  factor: 1e-2    },
      { id: 'MNm',   label: 'MN·m',    symbol: 'MN·m',   factor: 1e3     },
      { id: 'tfm',   label: 'tf·m',    symbol: 'tf·m',   factor: 9.80665 },
      { id: 'kipft', label: 'kip·ft',  symbol: 'kip·ft', factor: 1.35582 },
      { id: 'kipin', label: 'kip·in',  symbol: 'kip·in', factor: 0.112985 },
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure / Stress',
    baseUnit: 'kPa',
    units: [
      { id: 'Pa',      label: 'Pascal',      symbol: 'Pa',      factor: 1e-3      },
      { id: 'kPa',     label: 'Kilopascal (kN/m²)', symbol: 'kPa',  factor: 1    },
      { id: 'kNm2',    label: 'kN/m²',       symbol: 'kN/m²',   factor: 1         },
      { id: 'MPa',     label: 'Megapascal (N/mm²)', symbol: 'MPa',  factor: 1e3  },
      { id: 'Nmm2',    label: 'N/mm²',       symbol: 'N/mm²',   factor: 1e3       },
      { id: 'GPa',     label: 'Gigapascal',  symbol: 'GPa',     factor: 1e6       },
      { id: 'kgfcm2',  label: 'kgf/cm²',    symbol: 'kgf/cm²', factor: 98.0665   },
      { id: 'psi',     label: 'psi',         symbol: 'psi',     factor: 6.89476   },
      { id: 'ksi',     label: 'ksi',         symbol: 'ksi',     factor: 6894.76   },
      { id: 'bar',     label: 'Bar',         symbol: 'bar',     factor: 100       },
    ],
  },
  {
    id: 'mass',
    label: 'Mass',
    baseUnit: 'kg',
    units: [
      { id: 'g',   label: 'Gram',     symbol: 'g',  factor: 1e-3  },
      { id: 'kg',  label: 'Kilogram', symbol: 'kg', factor: 1     },
      { id: 't',   label: 'Tonne',    symbol: 't',  factor: 1e3   },
      { id: 'lb',  label: 'Pound',    symbol: 'lb', factor: 0.453592 },
      { id: 'oz',  label: 'Ounce',    symbol: 'oz', factor: 0.0283495 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    baseUnit: 'C',
    units: [
      {
        id: 'C', label: 'Celsius',    symbol: '°C',
        toBase: v => v,
        fromBase: v => v,
      },
      {
        id: 'F', label: 'Fahrenheit', symbol: '°F',
        toBase: v => (v - 32) * 5 / 9,
        fromBase: v => v * 9 / 5 + 32,
      },
      {
        id: 'K', label: 'Kelvin',     symbol: 'K',
        toBase: v => v - 273.15,
        fromBase: v => v + 273.15,
      },
    ],
  },
  {
    id: 'angle',
    label: 'Angle',
    baseUnit: 'deg',
    units: [
      { id: 'deg',  label: 'Degree',  symbol: '°',    factor: 1                },
      { id: 'rad',  label: 'Radian',  symbol: 'rad',  factor: 180 / Math.PI   },
      { id: 'grad', label: 'Gradian', symbol: 'grad', factor: 0.9              },
    ],
  },
]

export function convertValue(value: number, fromUnit: UnitDef, toUnit: UnitDef): number {
  // temperature uses special formulas
  if (fromUnit.toBase && toUnit.fromBase) {
    return toUnit.fromBase(fromUnit.toBase(value))
  }
  const base = value * (fromUnit.factor ?? 1)
  return base / (toUnit.factor ?? 1)
}
