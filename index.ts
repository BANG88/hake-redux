import { KEY, LIFECYCLE } from './lib/constants'
import middleware from './lib/middleware'
export * from './lib/middleware'
import handle from './lib/handle'
export * from './lib/handle'
export {
	handle,
	KEY,
	LIFECYCLE,
}

export default middleware
