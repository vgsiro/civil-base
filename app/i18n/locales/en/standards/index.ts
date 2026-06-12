import shared from './shared'
import ec0 from './ec0/index'
import ec1 from './ec1/index'
import ec2 from './ec2/index'
import ec3 from './ec3/index'
import tcvn from './tcvn/index'
import eurocode from './eurocode'

const standards = {
  ...shared,
  ...ec0,
  ...ec1,
  ...ec2,
  ...ec3,
  ...tcvn,
  ...eurocode,
} as const

export default standards
