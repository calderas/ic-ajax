"use strict";
/*!
 * ic-ajax
 *
 * - (c) 2013 Instructure, Inc
 * - please see license at https://github.com/instructure/ic-ajax/blob/master/LICENSE
 * - inspired by discourse ajax: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
 */

var Ember = require("ember")["default"] || require("ember");

/*
 * jQuery.ajax wrapper, supports the same signature except providing
 * `success` and `error` handlers will throw an error (use promises instead)
 * and it resolves only the response (no access to jqXHR or textStatus).
 */

function request() {
  return raw.apply(null, arguments).then(function(result) {
    return result.response;
  }, null, 'ic-ajax: unwrap raw ajax response');
}

exports.request = request;exports["default"] = request;

/*
 * Same as `request` except it resolves an object with `{response, textStatus,
 * jqXHR}`, useful if you need access to the jqXHR object for headers, etc.
 */

function raw() {
  return makePromise(parseArgs.apply(null, arguments));
}

exports.raw = raw;var __fixtures__ = {};
exports.__fixtures__ = __fixtures__;
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
 * @param {Object} [options] - options for the fixture
 * @param {boolean} [options.fallback=false] - whether or not the fixture should be used for all routes with a matching path that do not have a fixture matching their query string
 */

function defineFixture(url, fixture, options) {
  if (fixture.response) {
    fixture.response = JSON.parse(JSON.stringify(fixture.response));
  }
  return __fixtures__[url] = {
    fixture: fixture,
    options: options || {},
    args: [],
    callCount: 0,
    url: url
  };
}

exports.defineFixture = defineFixture;/*
 * Looks up a fixture by url.
 *
 * @param {String} url
 */

function lookupFixture (url) {
  var fixtureData = __fixtures__[url],
    path;

  if (!fixtureData && typeof url === "string" && url.match(/\?/)) {
    path = url.split("?")[0]
    if (__fixtures__[path] && __fixtures__[path].options.fallback) {
      fixtureData = __fixtures__[path];
    }
  }

  return fixtureData;
}

exports.lookupFixture = lookupFixture;/*
 * Removes a fixture by url.
 *
 * @param {String} url
 */
function removeFixture (url) {
  delete __fixtures__[url];
}

exports.removeFixture = removeFixture;/*
 * Removes all fixtures.
 */
function removeAllFixtures () {
  emptyObject(__fixtures__);
}

exports.removeAllFixtures = removeAllFixtures;function emptyObject(obj) {
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      delete obj[i];
    }
  }
}

function makePromise(settings) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var fixtureData = lookupFixture(settings.url),
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
  }, 'ic-ajax: ' + (settings.type || 'GET') + ' to ' + settings.url);
};

function parseArgs() {
  var settings = {};
  if (arguments.length === 1) {
    if (typeof arguments[0] === "string") {
      settings.url = arguments[0];
    } else {
      settings = arguments[0];
    }
  } else if (arguments.length === 2) {
    settings = arguments[1];
    settings.url = arguments[0];
  }
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