module('ic-ajax', {
  teardown: function() {
    ic.ajax.removeAllFixtures();
  }
});

test('presence', function() {
  ok(ic.ajax, 'ic.ajax is defined');
});

test('finds fixtures', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  ok(ic.ajax.lookupFixture('/get'));
});

test('removes fixtures', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });
  ic.ajax.defineFixture('/post', {
    errorThrown: 'Unprocessable Entity',
    textStatus: 'error',
    jqXHR: {}
  });

  ok(ic.ajax.lookupFixture('/get'));
  ic.ajax.removeFixture('/get');
  ok(!ic.ajax.lookupFixture('/get'));
  ok(ic.ajax.lookupFixture('/post'));
});

test('removes all fixtures', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });
  ic.ajax.defineFixture('/post', {
    errorThrown: 'Unprocessable Entity',
    textStatus: 'error',
    jqXHR: {}
  });

  ok(ic.ajax.lookupFixture('/get'));
  ok(ic.ajax.lookupFixture('/post'));
  ic.ajax.removeAllFixtures();
  ok(!ic.ajax.lookupFixture('/get'));
  ok(!ic.ajax.lookupFixture('/post'));
});

asyncTest('pulls from fixtures', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  ic.ajax.raw('/get').then(function(result) {
    start();
    deepEqual(result, ic.ajax.lookupFixture('/get').fixture);
  });
});

asyncTest('uses a designated fallback fixture if no fixture is found for a request with a query string', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  }, {
    fallback: true
  });

  ok(ic.ajax.lookupFixture('/get?this=that'));
  ic.ajax.raw('/get?this=that').then(function(result) {
    start();
    deepEqual(result, ic.ajax.lookupFixture('/get').fixture);
  });
});

asyncTest('pulls from a fixture that matches the request type', function() {
  var response = { foo: 'baz' };

  ic.ajax.defineFixture('/get', ['POST', 'PUT'], {
    response: response,
    textStatus: 'success',
    jqXHR: {}
  }, {
    fallback: true
  });

  ok(ic.ajax.lookupFixture('/get?this=that', 'POST'));
  ok(ic.ajax.lookupFixture('/get?this=that', 'PUT'));
  ok(!ic.ajax.lookupFixture('/get?this=that', 'GET'), "does not respond to a request of another type");

  ic.ajax.raw('/get?this=that', 'POST').then(function(result) {
    deepEqual(result.response, response);
    start();
  });
});

asyncTest('prefers a fixture that matches the request type', function() {
  var response1 = { foo: 'bar' },
    response2 = { foo: 'baz' },
    firstTest;


  ic.ajax.defineFixture('/get', ['POST', 'PUT'], {
    response: response1,
    textStatus: 'success',
    jqXHR: {}
  });

  ic.ajax.defineFixture('/get', {
    response: response2,
    textStatus: 'success',
    jqXHR: {}
  });

  firstTest = ic.ajax.raw('/get', 'POST').then(function(result) {
    deepEqual(result.response, response1);
  });

  firstTest.then(function() {
    ic.ajax.raw('/get', 'GET').then(function(result) {
      deepEqual(result.response, response2);
      start();
    });
  })
});

asyncTest('does not use a designated fallback fixture if a fixture is found for a request matching its query string', function() {
  var queryStringResponse = { foo: 'baz'};

  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  }, {
    fallback: true
  });

  ic.ajax.defineFixture('/get?this=that', {
    response: queryStringResponse,
    textStatus: 'success',
    jqXHR: {}
  });

  ic.ajax.raw('/get?this=that').then(function(result) {
    start();
    deepEqual(result.response, queryStringResponse);
  });
});

test('does not set a fixture as a fallback fixture if `fallback` is not set to true in the options', function() {
  var queryStringResponse = { foo: 'baz'};

  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  ok(!ic.ajax.lookupFixture('/get?this=that'));
});

asyncTest('rejects the promise when the textStatus of the fixture is not success', function() {
  ic.ajax.defineFixture('/post', {
    errorThrown: 'Unprocessable Entity',
    textStatus: 'error',
    jqXHR: {}
  });

  start();
  ic.ajax.raw('/post').then(null, function(reason) {
    deepEqual(reason, ic.ajax.lookupFixture('/post').fixture);
  });
});

asyncTest('resolves the response only when not using raw', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  ic.ajax.request('/get').then(function(result) {
    start();
    deepEqual(result, ic.ajax.lookupFixture('/get').fixture.response);
  });
});

asyncTest('url as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  ic.ajax.raw('/foo').then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('settings as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  ic.ajax.raw({url: '/foo'}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('url and settings arguments', function() {
  var server = fakeServer('GET', '/foo?baz=qux', {foo: 'bar'});
  ic.ajax.raw('/foo', {data: {baz: 'qux'}}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('the fixture is unaffected by external change', function() {
  var resource = {foo: 'bar'};

  ic.ajax.defineFixture('/foo', {
    response: {resource: resource},
    textStatus: 'success',
    jqXHR: {}
  });

  resource.foo = 'baz';

  ic.ajax.request('/foo').then(function(result) {
      start();
      deepEqual(result.resource.foo, 'bar');
    }
  )
});

asyncTest('the fixture jqXHR survives the response copy', function() {

  ic.ajax.defineFixture('/foo', {
    response: {foo: 'bar'},
    textStatus: 'success',
    jqXHR: { getResponseHeader: function(a) { return a; } }
  });

  ic.ajax.raw('/foo').then(function(result) {
      start();
      equal(result.jqXHR.getResponseHeader('foo'), 'foo');
    }
  )
});

asyncTest('adds onSend callback option to inspect xhr settings', function() {

  var xhrRequests = [];

  ic.ajax.defineFixture('/post', {
    response: {},
    textStatus: 'success',
    jqXHR: {}
  }, {
    onSend: function(settings) {
      xhrRequests.push(settings);
    }
  });

  var req = {
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    url: "/post",
    data: JSON.stringify({
      foo: "bar"
    })
  };

  Ember.RSVP.all([ic.ajax.request(req), ic.ajax.request(req)])
    .then(function() {
      start();
      equal(xhrRequests.length, 2);
      var payload = JSON.parse(xhrRequests[0].data);
      equal(payload.foo, "bar");
    });
});

asyncTest('records callCount, args, and url to fixtureData', function() {

  var fixture = ic.ajax.defineFixture('/post', {
    response: {},
    textStatus: 'success',
    jqXHR: {}
  }),
  req1 = {
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    url: '/post',
    data: JSON.stringify({
      foo: 'bar'
    })
  },
  req2 = {
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    url: '/post',
    data: JSON.stringify({
      foo: 'baz'
    })
  },
  firstTest = ic.ajax.request(req1)
    .then(function() {
      equal(fixture.url, '/post', 'The fixture url is included with the fixture data');
      equal(fixture.callCount, 1, 'The callCount has been incremented');
      equal(fixture.args.length, 1, 'The args array has one set of args');
      deepEqual(fixture.args[0], req1, 'The settings were saved to the args array');

      return ic.ajax.request(req2);
    });

  firstTest.then(function() {
    equal(fixture.callCount, 2, 'The callCount has been incremented again');
    equal(fixture.args.length, 2, 'The args array has two sets of args');
    deepEqual(fixture.args[1], req2, 'The new settings were saved to the args array');
    start();
  });

});

test('throws if success or error callbacks are used', function() {
  var k = function() {};
  throws(function() {
    ic.ajax('/foo', { success: k });
  });
  throws(function() {
    ic.ajax('/foo', { error: k });
  });
  throws(function() {
    ic.ajax('/foo', { success: k, error: k });
  });
});

if (parseFloat(Ember.VERSION) >= 1.3) {
  function promiseLabelOf(promise) {
    return promise._label;
  }

  test('labels the promise', function() {
    var promise = ic.ajax.request('/foo');
    equal(promiseLabelOf(promise), 'ic-ajax: unwrap raw ajax response', 'promise is labeled');
  });

  test('labels the promise', function() {
    var promise = ic.ajax.raw('/foo');
    equal(promiseLabelOf(promise), 'ic-ajax: GET to /foo', 'promise is labeled');
  });
}

function fakeServer(method, url, response) {
  var server = sinon.fakeServer.create();
  var data = {foo: 'bar'};
  server.respondWith(method, url, [
    200,
    { "Content-Type": "application/json" },
    JSON.stringify(response)
  ]);
  return server;
}

