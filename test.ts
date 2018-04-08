import test from 'ava'
import middleware, { isPromise } from './index'
// tests
const doDispatch = () => { }
const doGetState = () => { }
const store = { dispatch: doDispatch, getState: doGetState }
const nextHandler = middleware()(store as any) as any
const isFunction = fn => typeof fn === 'function'

// some tests are come from redux-thunk

test('middleware', t => {
	t.true(isFunction(middleware))
	t.true(isFunction(nextHandler))
	t.is(nextHandler.length, 1)
})
test('must return a function to handle action', t => {
	const actionHandler = nextHandler(doDispatch)
	t.true(isFunction(actionHandler))
})
test('should be null if action is null', t => {
	const actionHandler = nextHandler(doDispatch)
	const res = actionHandler(null)
	t.deepEqual(res, null)
})
test('must run the given action function with dispatch and getState', t => {
	const actionHandler = nextHandler(doDispatch)
	const res = actionHandler({ type: 'test', promise: Promise.resolve({ test: true }) })
	t.true(isPromise(res))
	return res.then(data => t.deepEqual(data.payload, { test: true }))
})

test('must pass action to next if not a function', t => {
	const actionObj = { type: 'empty' }

	const actionHandler = nextHandler(action => {
		t.deepEqual(action, actionObj)
	})

	actionHandler(actionObj)
})

test('must return the return value of next if not a function', t => {
	const expected = 'redux'
	const actionHandler = nextHandler(() => expected)
	const outcome = actionHandler({ type: 'redux' })
	t.is<any>(outcome, expected)
})

test('must return value as expected if a function', t => {
	const expected = 'rocks'
	const actionHandler = nextHandler(doDispatch)
	const outcome = actionHandler(() => expected)
	t.is<any>(outcome, expected)
})

test('must be invoked synchronously if a function', t => {
	const actionHandler = nextHandler(doDispatch)
	let mutated = 0
	actionHandler(() => mutated++)
	t.is(mutated, 1)
})
