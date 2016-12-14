'use strict';

function CachedStore() {
  this.cache = {};
}

CachedStore.prototype.setCachedItem = function setCachedItem(name, value) {
  this.cache[name] = {
    timestamp: new Date().getTime(),
    value: value
  };
};

CachedStore.prototype.getCachedItem = function getCachedItem(name, ttl) {
  var cachedItem = this.cache[name];

  if (!cachedItem) {
    return null;
  }

  var ageInSeconds = (new Date().getTime() - cachedItem.timestamp) / 1000;

  return ageInSeconds < ttl ? cachedItem.value : null;
};

module.exports = CachedStore;