import { MiddlewareAPI } from 'redux'
import * as uuid from 'uuid'
import { KEY, LIFECYCLE } from './constants'

import { Action } from './handle'
/**
 * Dispatch
 *
 * @export
 * @interface Dispatch
 * @template S
 */
export interface Dispatch<S> {
	<A extends Action>(action: A | null | Function): PromiseLike<S & {
		type: string
		meta: any
		payload: any
		[key: string]: any
	}> & A
}
export interface Middleware {
	<S>(api: MiddlewareAPI<S>): (next: Dispatch<S>) => Dispatch<S>
}

/**
 * check obj is PromiseLike object
 *
 * @param {any} obj
 * @returns
 */
export function isPromise(obj) {
	return !!obj && typeof obj.then === 'function'
}
/**
 * handle event hooks
 *
 * @param {any} meta
 * @param {any} hook
 * @param {any} args
 */
function handleEventHook(meta, hook, ...args) {
	if (meta && meta[hook] && typeof meta[hook] === 'function') {
		// we want to make sure that an "eventHook" doesn't cause a dispatch to fail, so we wrap it
		// with a try..catch. In dev, we `console.error` which will result in a redbox.
		try {
			meta[hook](...args)
		} catch (e) {
			console.error(e)
		}
	}
}
/**
 * handle promise
 *
 * @param {any} dispatch
 * @param {any} getState
 * @param {any} action
 * @returns
 */
function handlePromise(dispatch, getState, action) {
	const { promise, type, payload, meta } = action

	// it is sometimes useful to be able to track the actions and associated promise lifecycle with a
	// sort of unique identifier. This is that.
	const transactionId = uuid.v4()
	const startPayload = payload

	dispatch({
		type,
		payload,
		meta: {
			...meta,
			[KEY.LIFECYCLE]: LIFECYCLE.START,
			[KEY.TRANSACTION]: transactionId,
		},
	})
	handleEventHook(meta, 'onStart', payload, getState)

	const success = data => {
		dispatch({
			type,
			payload: data,
			meta: {
				...meta,
				startPayload,
				[KEY.LIFECYCLE]: LIFECYCLE.SUCCESS,
				[KEY.TRANSACTION]: transactionId,
			},
		})
		handleEventHook(meta, 'onSuccess', data, getState)
		handleEventHook(meta, 'onFinish', true, getState)
		return { payload: data }
	}

	const failure = error => {
		dispatch({
			type,
			payload: error,
			error: true,
			meta: {
				...meta,
				startPayload,
				[KEY.LIFECYCLE]: LIFECYCLE.FAILURE,
				[KEY.TRANSACTION]: transactionId,
			},
		})
		handleEventHook(meta, 'onFailure', error, getState)
		handleEventHook(meta, 'onFinish', false, getState)
		return { error: true, payload: error }
	}

	// return the promise. In this case, when users dispatch an action with a promise
	// payload, they can `.then` it, since it will return a promise.
	// NOTE(lmr):
	// it's debatable whether or not we want `.then(success, failure)`
	// versus `.then(success).catch(failure)`
	return promise.then(success, failure)
}

/**
 * Redux Middleware
 * @param client A client lib like fetch,axios,etc.
 */
const middleware = function (client?): Middleware {

	return ({ dispatch, getState }) => next => action => {
		/**
		 * handle async action
		 */
		if (typeof action === 'function') {
			return action(dispatch, getState, client)
		}
		// a common use case for redux-thunk is to conditionally dispatch an action. By allowing for null,
		// we satisfy this use case without people having to use redux-thunk.
		if (action == null) {
			return null
		}
		/**
		 * here we add a short handle client call to action. So we can make a http request like bellow:
		 * promise: client => client.post('/path/to/url',data)
		 */
		if (client !== null && typeof action.promise === 'function') {
			action.promise = action.promise(client)
		}
		// this is the convention-based promise middleware. Ideally, all "async actions" would go through
		// this pathway.
		if (isPromise(action.promise)) {
			return handlePromise(dispatch, getState, action)
		}

		// this is the "vanilla redux" pathway. These are plain old actions that will get sent to reducers
		return next(action)
	}
}


export default middleware
