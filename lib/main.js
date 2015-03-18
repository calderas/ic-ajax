/*!
 * ic-ajax
 *
 * - (c) 2013 Instructure, Inc
 * - please see license at https://github.com/instructure/ic-ajax/blob/master/LICENSE
 * - inspired by discourse ajax: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
 */

import Ember from 'ember';

/*
 * jQuery.ajax wrapper, supports the same signature except providing
 * `success` and `error` handlers will throw an error (use promises instead)
 * and it resolves only the response (no access to jqXHR or textStatus).
 */

export function request() {
  return raw.apply(null, arguments).then(function(result) {
    return result.response;
  }, null, 'ic-ajax: unwrap raw ajax response');
}

export default request;

/*
 * Same as `request` except it resolves an object with `{response, textStatus,
 * jqXHR}`, useful if you need access to the jqXHR object for headers, etc.
 */

export function raw() {
  return makePromise(parseArgs.apply(null, arguments));
}

export var __fixtures__ = {
  all: {}
};

/*
 * Defines a fixture that will be used instead of an actual ajax
 * request to a given url. This is useful for testing, allowing you to
 * stub out responses your application will send without requiring
 * libraries like sinon or mockjax, etc.
 *
 * For example:
 *
 *    defineFixture('/self', {
 *      response: { firstName: 'Ryan', lastName: 'Florence' },
 *      textStatus: 'success'
 *      jqXHR: {}
 *    }, {
 *      fallback: true
 *    });
 *
 * @param {String} url
 * @param {Object} fixture
 * @param {Array} [types] - which request types (GET, POST, etc.) this fixture will match. If this array is not provided or is empty, the fixture will match all types.
 * @param {Object} [options] - options for the fixture
 * @param {boolean} [options.fallback=false] - whether or not the fixture should be used for all routes with a matching path that do not have a fixture matching their query string
 * @param {boolean} [options.onSend] - a function that will be executed before the fixture is sent, this function will receive the settings of the ajax call it intercepts as its only argument
 * @return {FixtureData} The new FixtureData object
 */

export function defineFixture(url, types, fixture, options) {
  var fixtureData;

  if (!Array.isArray(types)) {
    options = fixture;
    fixture = types;
    types = [];
  }

  if (fixture.response) {
    fixture.response = JSON.parse(JSON.stringify(fixture.response));
  }

  fixtureData = new FixtureData({
    fixture: fixture,
    options: options,
    types: types,
    url: url
  });

  if (types.length) {
    for (var i=0;i<types.length;i++) {
      if (!__fixtures__.hasOwnProperty(types[i])) {
        __fixtures__[types[i]] = {};
      }
      __fixtures__[types[i]][url] = fixtureData;
    }
  } else {
    __fixtures__['all'][url] = fixtureData;
  }

  return fixtureData;
}

/*
 * Looks up a fixture by url.
 *
 * @param {String} url
 * @param {string} [type] - 'GET' or 'POST', etc (optional)
 * @return {FixtureData} The matching FixtureData object
 */

export function lookupFixture (url, type) {
  var fixtureData = lookupFixtureByType(url, 'all'),
    exactMatch = lookupFixtureByType(url, type);

  if (exactMatch) {
    fixtureData = exactMatch;
  }

  return fixtureData;
}

/*
 * Removes a fixture by url.
 *
 * @param {String} url
 * @param {Array} types - array of types to
 */
export function removeFixture (url, types) {
  if (types && types.length) {
    for (var i=0;i<types.length;i++) {
      if (__fixtures__[types[i]]) {
        delete __fixtures__[types[i]][url];
      }
    }
  } else {
    delete __fixtures__['all'][url];
  }
}

/*
 * Removes all fixtures.
 */
export function removeAllFixtures () {
  emptyFixtureTypes(__fixtures__);
  __fixtures__['all'] = {};
}

function FixtureData(data) {
  this.fixture = data.fixture;
  this.options = data.options || {};
  this.args = [];
  this.callCount = 0;
  this.types = data.types;
  this.url = data.url;
}

function lookupFixtureByType (url, type) {
  var typeDataStore = __fixtures__[type] || {},
    fixtureData = typeDataStore[url],
    path;

  if (!fixtureData && typeof url === "string" && url.match(/\?/)) {
    path = url.split("?")[0]
    if (typeDataStore[path] && typeDataStore[path].options.fallback) {
      fixtureData = typeDataStore[path];
    }
  }

  return fixtureData;
}

function emptyFixtureTypes(obj) {
  for (var type in obj) {
    if (obj.hasOwnProperty(type)) {
      for (var i in obj[type]) {
        if (obj[type].hasOwnProperty(i)) {
          delete obj[type][i];
        }
      }
      delete obj[type];
    }
  }
}

function makePromise(settings) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var fixtureData = lookupFixture(settings.url, settings.type),
      fixture = fixtureData ? fixtureData.fixture : undefined,
      options = fixtureData ? fixtureData.options : {};

    if (fixture) {
      fixtureData.callCount += 1;
      fixtureData.args.push(settings);

      if (options.onSend && typeof options.onSend === "function") {
        options.onSend(settings);
      }
      if (fixture.textStatus === 'success' || fixture.textStatus == null) {
        return Ember.run.later(null, resolve, fixture);
      } else {
        return Ember.run.later(null, reject, fixture);
      }
    }
    settings.success = makeSuccess(resolve);
    settings.error = makeError(reject);
    Ember.$.ajax(settings);
  }, 'ic-ajax: ' + settings.type + ' to ' + settings.url);
};

function parseArgs() {
  var args = Array.prototype.slice.call(arguments),
    settings;

  if (typeof args[1] === "string") {
    settings = args[2] || {};
    settings.url = args[0];
    settings.type = args[1];
  } else if (typeof args[0] === "string") {
    settings = args[1] || {};
    settings.url = args[0];
  } else {
    settings = args[0] || {};
  }

  settings.type = settings.type || 'GET';

  if (settings.success || settings.error) {
    throw new Ember.Error("ajax should use promises, received 'success' or 'error' callback");
  }
  return settings;
}

function makeSuccess(resolve) {
  return function(response, textStatus, jqXHR) {
    Ember.run(null, resolve, {
      response: response,
      textStatus: textStatus,
      jqXHR: jqXHR
    });
  }
}

function makeError(reject) {
  return function(jqXHR, textStatus, errorThrown) {
    Ember.run(null, reject, {
      jqXHR: jqXHR,
      textStatus: textStatus,
      errorThrown: errorThrown
    });
  };
}
