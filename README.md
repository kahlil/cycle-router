# Cycle Router

This is the first (that I know of) router built from the ground up
with Cycle.js in mind. Stands on the shoulders of battle-tested libraries [switch-path](https://github.com/staltz/switch-path) for route matching and [rackt/history](https://github.com/rackt/history) for dealing with the History API.

## Would you like to try it out?!
```shell
$ npm install cycle-router
```

## Very Basic Example

** PLEASE read the tests to get the best idea of how this library can/does work **

I'll hopefully get time to make some more.

```js
import {run} from '@cycle/core'
import {makeDOMDriver, h} from '@cycle/dom'
import {makeRouterDriver, createLocation} from 'cycle-router'

const routes = {
  '/': 'Home',
  '/route': 'Somewhere Else'
}

function Component(sources) {
  const vtree$ = sources.router.define(routes)
    .flatMap(({path, value, fullPath, /*routeDefinitions,*/ props$}) => {
      return props$.map(props => {
        return h('div', {}, {
          h('h1', `Location: ${path}`), // <h1>Location: /route</h1>
          h('h4', `Value: ${value}`), // <h4>Value: Somewhere Else</h4>
          h('span', `Props`: props.color), // <span>Props: #000000</span>
          h('span', `fullPath: ${fullPath}`) // <span>fullPath: /nested/route</span>
        })
      })
    })
  return {
    DOM: vtree$,
  }
}

function main(sources) {
  const props$ = Rx.Observable.just({color: '#000000'})
  const nestedRoute$ = sources.router.path('nested', props$)

  const vTree$ = Component(sources)

  return {
    DOM: vTree$,
    router: Rx.Observable.just(createLocation('/nested/route'))
  }
}

run(main, {
  DOM: makeDOMDriver('.container'),
  router: makeRouterDriver({hash: true})
})
```

## API

##### `makeRouterDriver(options)`

```js
import {makeRouterDriver} from 'cycle-router'
```

**Arguments** :
  - (options) :: Object
    - `hash` :: Boolean - Use hash for routing
    - All options for creating a history object from [rackt/history](https://github.com/rackt/history)

**returns** :
  - routerDriver(history$) :: function

##### `routerDriver(history$)`

**Arguments** :
  - history$ :: Rx.Observable<Object>
    - `pathname` :: String - (Required) - A string that is used to change the url
    - All other options from [rackt/history location object](https://github.com/rackt/history/blob/master/docs/Glossary.md#location)

**returns** :
  `RouterObject` :: Object

###### **RouterObject**
  - Keys
    - namespace :: Array - Array of pathnames
    - observable :: Rx.observable<([Location](https://github.com/rackt/history/blob/master/docs/Glossary.md#location)> - An observable of the current Location filtered from the namespace
    - path(path [, props$]) :: Function -
      - **Arguments**
        - path :: string (Required) - a string used to append to the namespace
        - props$ :: Rx.observable<any> (options) - and obervable props$ to be passed along
      - **Returns**
        (RouterObject)
    - define(routeDefinition[, props$]) :: Function -
      - **Arguments**
        - routeDefinition :: Object<Route: any> - An object of routes for values and any kind of value. see [switch-path](https://github.com/staltz/switch-path) for more information
        - props$ :: Rx.Observable<any> - An optional props observable
      - **Returns**
        - Rx.Observable<Object> - and Observable containing a collection with the current `path` and `value` from the switchPath() function. `fullPath` - the entire path being matched and `routeDefinitions` for access to the defined routes. `props$` and Rx.Observable<any>. `props$` is inherited from the last .path() if not defined directly.

    - props$ :: Rx.Observable<any> - Observable of any sort of props to pass around


- `createLocation(options)`
- `createHref(options)`
```js
import {createLocation, createHref} from 'cycle-router'
```
Please see the [rackt/history docs](https://github.com/rackt/history)
