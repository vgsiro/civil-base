import overview from './overview'
import reference from './reference'
import tables from './tables'
import na from './na'

const ec0 = { ...overview, ...reference, ...tables, ...na } as const
export default ec0
