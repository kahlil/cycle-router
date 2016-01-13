/* global describe, it */
/*eslint max-nested-callbacks: 0*/
import assert from 'assert'
import Rx from 'rx'
import {run} from '@cycle/core'
import {makeRouterDriver} from '../src'

function runApp(path = '/') {
  function app() {
    return {
      router: Rx.Observable.just(path),
    }
  }

  return run(app, {router: makeRouterDriver()})
}

describe('Cycle Router', () => {
  describe('makeRouterDriver', () => {
    it('should return a function', done => {
      const routerDriver = makeRouterDriver()
      assert.strictEqual(typeof routerDriver, 'function')
      done()
    })
  })

  describe('Routing', () => {
    it('should have an observable path', done => {
      const {sources} = runApp()

      sources.router.observable.subscribe(({pathname}) => {
        assert.strictEqual(pathname, '/')
        done()
      })
    })

    describe('path()', () => {
      it('should match a root path', done => {
        const {sources} = runApp()

        sources.router.path('/').observable.subscribe(({pathname}) => {
          assert.strictEqual(pathname, '/')
          done()
        })
      })

      it('should match a basic path', done => {
        const {sources} = runApp('/path')

        sources.router.path('/path').observable.subscribe(({pathname}) => {
          assert.strictEqual(pathname, '/path')
          done()
        })
      })

      it('should match a deeply nested path', done => {
        const {sources} = runApp('/some/really/deep/nested/path')

        sources.router.path('/some/really/deep/nested/path').observable
          .subscribe(({pathname}) => {
            assert.strictEqual(pathname, '/some/really/deep/nested/path')
            done()
          })
      })

      it('should filter out unmatched paths', done => {
        const {sources} = runApp('/correct/path')

        sources.router.path('/wrong/path').observable.subscribe(assert.fail)
        sources.router.path('/correct/path').observable
          .subscribe(({pathname}) => {
            assert.strictEqual(pathname, '/correct/path')
            done()
          })
      })

      it('should allow matching paths using path().path()', done => {
        const {sources} = runApp('/correct/path')

        sources.router.path('/wrong').path('/path')
          .observable.subscribe(assert.fail)

        sources.router.path('/correct').path('/path')
          .observable.subscribe(({pathname}) => {
            assert.strictEqual(pathname, '/correct/path')
            done()
          })
      })

      it('should match a deeply nested path using multiple .path()s',
        done => {
          const {sources} = runApp('/some/really/deep/nested/path')

          sources.router.path('/some').path('/really/').path('/deep')
            .path('nested').path('/path').observable
            .subscribe(({pathname}) => {
              assert.strictEqual(pathname, '/some/really/deep/nested/path')
              done()
            })
        })

      it('should match partials', done => {
        const {sources} = runApp('/some/really/deep/nested/path')

        sources.router.path('/some').path('/really').observable
          .subscribe(({pathname}) => {
            assert.strictEqual(pathname, '/some/really/deep/nested/path')
            done()
          })
      })
    })

    describe('define()', () => {
      it('should have routeDefinitions object', done => {
        const {sources} = runApp()

        sources.router.define({
          '/': 123,
          '/path': 234,
        }).subscribe(({routeDefinitions}) => {
          assert.notStrictEqual(routeDefinitions, null)
          assert.strictEqual(typeof routeDefinitions, 'object')
          done()
        })
      })

      it('should have the fullPath navigated to', done => {
        const {sources} = runApp('/some/really/deep/nested/path')

        sources.router.path('/some').path('really/').path('deep')
          .define({
            '/nested': {
              '/path': 123,
            },
          }).subscribe(({path, value, fullPath}) => {
            assert.strictEqual(path, '/nested/path')
            assert.strictEqual(value, 123)
            assert.strictEqual(fullPath, '/some/really/deep/nested/path')
            done()
          })
      })

      it('should match a root path', done => {
        const {sources} = runApp()

        sources.router.define({
          '/': 123,
          '/path': 345,
        }).subscribe(({path, value}) => {
          assert.strictEqual(path, '/')
          assert.strictEqual(value, 123)
          done()
        })
      })

      it('should match a basic path', done => {
        const {sources} = runApp('/path')

        sources.router.define({
          '/': 123,
          '/path': 345,
        }).subscribe(({path, value}) => {
          assert.strictEqual(path, '/path')
          assert.strictEqual(value, 345)
          done()
        })
      })

      it('should match a basic nested path', done => {
        const {sources} = runApp('/correct/path')

        sources.router.define({
          '/': 123,
          '/path': 345,
          '/correct/path': 100,
        }).subscribe(({path, value}) => {
          assert.strictEqual(path, '/correct/path')
          assert.strictEqual(value, 100)
          done()
        })
      })

      it('should match a complex nested path', done => {
        const {sources} = runApp('/deep/nested/path')

        sources.router.define({
          '/': 123,
          '/path': 345,
          '/deep': {
            '/nested': {
              '/path': 1000,
            },
          },
        }).subscribe(({path, value}) => {
          assert.strictEqual(path, '/deep/nested/path')
          assert.strictEqual(value, 1000)
          done()
        })
      })

      it('should match a path with a named parameter', done => {
        const {sources} = runApp('/user/123')

        sources.router.define({
          '/': 'wrong!',
          '/user/:id': id => `${id}`,
        }).subscribe(({path, value}) => {
          assert.strictEqual(path, '/user/123')
          assert.strictEqual(value, '123')
          done()
        })
      })

      it('should allow .path().define()', done => {
        const {sources} = runApp('/some/path')

        sources.router.path('/some').define({
          '/path': 123,
        }).subscribe(({path, value}) => {
          assert.strictEqual(path, '/path')
          assert.strictEqual(value, 123)
          done()
        })
      })

      it('should allow multiple .path()s and define', done => {
        const {sources} = runApp('/some/really/deep/nested/path')

        sources.router.path('/some').path('really/').path('deep')
          .define({
            '/nested': {
              '/path': 123,
            },
          }).subscribe(({path, value}) => {
            assert.strictEqual(path, '/nested/path')
            assert.strictEqual(value, 123)
            done()
          })
      })
    })
  })

  describe('State', () => {
    it('should allow saving state with rackt/history', done => {
      const {sources} = runApp({
        pathname: '/path',
        state: {something: 'stateful'},
      })

      sources.router.observable.filter(({action}) => action === 'PUSH')
        .subscribe(({state}) => {
          assert.strictEqual(state.something, 'stateful')
          done()
        })
    })

    it('should allow for passing props with .path()', done => {
      function Component(router) {
        return router.define({
          '/path': 'My favorite hex color: ',
        }).flatMap(({value, props$}) => {
          return props$.map((props) => {
            return `${value}${props.color}`
          })
        })
      }

      function app({router}) {
        const props$ = Rx.Observable.just({color: '#000000'})
        const component$ = Component(router.path('/some', props$))
        return {
          router: Rx.Observable.just('/some/path'),
          component$,
        }
      }

      const {sinks} = run(app, {router: makeRouterDriver()})

      sinks.component$.subscribe((string) => {
        assert.strictEqual(string, 'My favorite hex color: #000000')
        done()
      })
    })
  })
})
