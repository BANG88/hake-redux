# hake-redux [![Build Status](https://travis-ci.org/bang88/hake-redux.svg?branch=master)](https://travis-ci.org/bang88/hake-redux)

> A promise middleware for redux, based on https://github.com/lelandrichardson/redux-pack


## Install

```sh
$ npm install --save hake-redux

# or

$ yarn add hake-redux
```


## Usage

```js
import { createStore, applyMiddleware } from 'redux'
import hakeReduxMiddleware from 'hake-redux'
import rootReducer from './reducer'
// axios is a xhr lib just like fetch.
import axios from 'axios'
// your client
const client = axios.create()
// store
const store = createStore(
  rootReducer,
  applyMiddleware(hakeReduxMiddleware(client))
)

```


## API

The difference between redux-pack and hake-redux is :

```js
// actions.js
export function loadFoo(id) {
  return {
	type: LOAD_FOO,
	// redux-pack way
	// promise: Api.getFoo(id),
	// hake-redux doing.
	promise: client => client.get('/path/to/foo')
	meta: {
		onSuccess: (response) => logSuccess(response)
	},
  };
}
```

[Redux-Pack documentation](https://github.com/lelandrichardson/redux-pack#redux-pack)

## License

MIT © [bang](https://github.com/bang88) [lelandrichardson](https://github.com/lelandrichardson/redux-pack)
