// Vietnamese locale barrel. Mirror of the English barrel — same namespaces, translated content.
import common from './common'
import feed from './feed'
import profile from './profile'
import setup from './setup'
import postcard from './postcard'
import notifications from './notifications'
import standards from './standards'
import home from './home'
import ec2rect from './tools/ec2-rect'
import ec1wind from './tools/ec1-wind'
import ec3bolt from './tools/ec3-bolt'

const vi = {
  ...common,
  ...feed,
  ...profile,
  ...setup,
  ...postcard,
  ...notifications,
  ...standards,
  ...home,
  ...ec2rect,
  ...ec1wind,
  ...ec3bolt,
}

export default vi
