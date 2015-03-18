ic-ajax
=======

[![Build Status](https://travis-ci.org/instructure/ic-ajax.png)](https://travis-ci.org/instructure/ic-ajax)

Ember-friendly `jQuery.ajax` wrapper.

- returns RSVP promises
- makes apps more testable (resolves promises with `Ember.run`)
- makes testing ajax simpler with fixture support

Installation
------------

`bower install ic-ajax`

... or ...

`npm install ic-ajax`

Module Support
--------------

Note the `dist` directory has multiple module formats, use whatever
works best for you.

- AMD

  `define(['ic-ajax'], function(ajax) {});`

- Node.JS (CJS)

  `var ajax = require('ic-ajax')`

- Globals

  `var ajax = ic.ajax;`

  All instructure canvas stuff lives on the `ic` global.

API
---

This lib simply wraps `jQuery.ajax` with two exceptions:

- success and error callbacks are not supported
- does not resolve three arguments like $.ajax (real promises only
  resolve a single value). `request` only resolves the response data
  from the request, while `raw` resolves an object with the three
  "arguments" as keys if you need them.

Other than that, use `request` exactly like `$.ajax`.

```js
var ajax = ic.ajax;

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return ajax.request('/foo');
  }
}

// if you need access to the jqXHR or textStatus, use raw
ajax.raw('/foo').then(function(result) {
  // result.response
  // result.textStatus
  // result.jqXHR
});
```

Simplified Testing
------------------

In order to test newly added code you must rebuild the distribution.

```bash
broccoli build dist
```
<hr/>

### defineFixture
Adding fixtures with `defineFixture` tells ic-ajax to resolve the promise
with the fixture matching a url instead of making a request. This allows
you to test your app without creating fake servers with sinon, etc. `defineFixture` will return a FixtureData object which will store data about your fixture.

Example:

```js
ic.ajax.defineFixture('api/v1/courses', {
  response: [{name: 'basket weaving'}],
  jqXHR: {},
  textStatus: 'success'
});

ic.ajax.request('api/v1/courses').then(function(result) {
  deepEqual(result, ic.ajax.lookupFixture('api/v1/courses').response);
});
```

To test failure paths, set the `textStatus` to anything but `success`.

#### Options
You may pass an options object as the second argument to `defineFixture`, which may have the following properties:

_fallback_ - (Boolean, optional, default: `false`)

To set a fixture that will match every url with a matching path, regardless of the query string, add an options object as a parameter to `defineFixture` with a property of `fallback` set to true. A fixture will be located for the specific url with a query string, and if no fixture is found, the fallback that matches the path (not considering the query string) will be used.

Example:

```js
ic.ajax.defineFixture('api/v1/courses', {
  response: [{name: 'basket weaving'}],
  jqXHR: {},
  textStatus: 'success'
}, {
  fallback: true
});

ic.ajax.request('api/v1/courses?this=that').then(function(result) {
  deepEqual(result, ic.ajax.lookupFixture('api/v1/courses').response);
});
```


_onSend_ - (Function, optional)

To execute a callback just before the fixture returns, pass the options object into `defineFixture` and include the callback in the `onSend` property. This callback will receive the settings object of the intercepted ajax call as its only argument.

Example:

```js
var deleteCount = 0;

ic.ajax.defineFixture('api/v1/courses', {
  response: [{name: 'basket weaving'}],
  jqXHR: {},
  textStatus: 'success'
}, {
  onSend: function(settings) {
    if (settings.type === 'Delete') {
      deleteCount += 1;
    }
  }
});

// do some stuff that triggers a DELETE

equal(deleteCount, 1, 'the thing was deleted');
```

####FixtureData

`defineFixture` will return a FixtureData object with the following properties:

_fixture_ - Object - The fixture you defined

_options_ - Object - The options you passed in for the fixture

_args_ - Array of Objects - The settings passed for every ajax call that matched this fixture, in the order the calls were made

_callCount_ - Number - The number of times this fixture was called.

_url_ - String - The url that this fixture matches

These properties will stay updated as the fixture is used.

Example:

```js
var fixie = ic.ajax.defineFixture('api/v1/courses', {
  response: [{name: 'basket weaving'}],
  jqXHR: {},
  textStatus: 'success'
}, {
  fallback: true
});

ic.ajax.request('api/v1/courses?this=that').then(function(result) {
  equal(fixie.callCount, 1);
  deepEqual(fixie.args, {url: 'api/v1/courses?this=that'});
});
```

<hr/>

### lookupFixture
Lookup a fixture. If successful, a FixtureData object will be returned, otherwise `undefined` will be returned.

```js
var coursesFixture = ic.ajax.lookupFixture('api/v1/courses');
```

<hr/>

### removeFixture
Remove a specific fixture. Pass in the url, the fixture that matches that url, if any, will be removed.

```js
ic.ajax.removeFixture('api/v1/courses');
```

<hr/>

### removeAllFixtures

```js
ic.ajax.removeAllFixtures();
```

<hr/>


Contributing
------------

Install dependencies and run tests with the following:

```sh
npm install
npm test
```

For those of you with release privileges:

```sh
npm run-script release
```

Special Thanks
--------------

Inspired by [discourse ajax][1].

License and Copyright
---------------------

MIT Style license

(c) 2014 Instructure, Inc.


  [1]:https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19

