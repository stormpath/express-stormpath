'use strict';

var assert = require('assert');

var CachedStore = require('../../lib/helpers').CachedStore;

describe('CachedStore', function () {
  var cachedStore;
  var ttl;

  before(function () {
    ttl = 1; //second
    cachedStore = new CachedStore();
  });

  it('should support saving items', function () {
    assert.ok(cachedStore.setCachedItem);
    cachedStore.setCachedItem('key', 'value');
  });

  it('should be able to retrieve items if the ttl is small enough', function () {
    cachedStore.setCachedItem('key', 'value');

    assert.ok(cachedStore.getCachedItem);

    assert.equal(cachedStore.getCachedItem('key', ttl), 'value');
  });

  it('should return `null` if there is no such item', function () {
    assert.equal(cachedStore.getCachedItem('other', ttl), null);
  });

  it('should return `null` if the ttl has expired', function (done) {
    cachedStore.setCachedItem('async', 'value');

    assert.equal(cachedStore.getCachedItem('async', ttl), 'value');

    setTimeout(function () {
      assert.equal(cachedStore.getCachedItem('async', ttl), null);
      done();
    }, ttl * 1000 /* ms */);
  });
});