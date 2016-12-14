'use strict';

/**
 * @class CachedStore
 *
 * An implementation of a cached store.
 * It stores all values together with a timestamp. When retrieving the item,
 * a TTL (time to live) must be specified (or defaults to 0). If the item in
 * the cache is older than the specified TTL, the value is not returned.
 */
function CachedStore() {
  this.cache = {};
}

/**
 * Saves the value in "cache" together with a timestamp.
 *
 * @method
 *
 * @param {string} name - The name of the stored value.
 * @param {Object} model - The model to cache.
 */
CachedStore.prototype.setCachedItem = function setCachedItem(name, value) {
  this.cache[name] = {
    timestamp: new Date().getTime(),
    value: value
  };
};

/**
 * Returns the cached value if it's not older than `ttl`.
 * Else it returns null.
 *
 * @method
 *
 * @param {string} name - The name of the stored value.
 * @param {number} ttl - The time-to-live value for the cached value.
 */
CachedStore.prototype.getCachedItem = function getCachedItem(name, ttl) {
  var cachedItem = this.cache[name];
  ttl = ttl || 0;

  if (!cachedItem) {
    return null;
  }

  var ageInSeconds = (new Date().getTime() - cachedItem.timestamp) / 1000;

  return ageInSeconds < ttl ? cachedItem.value : null;
};

module.exports = CachedStore;