import overview from './overview'
import reference from './reference'
import tables from './tables'
import na from './na'

const ec3 = { ...overview, ...reference, ...tables, ...na } as const
export default ec3
