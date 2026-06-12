// English locale barrel. Lists this locale's namespaces once; the top-level i18n/index.ts
// just imports this. To add a NEW namespace: create the file and add it here (+ the matching
// file in every other locale). To add a NEW language: copy this folder and translate the files.
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

const en = {
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

export default en
