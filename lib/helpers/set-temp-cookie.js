'use strict';

/**
 * Set a temporary cookie that is only accessible server-side.
 *
 * @method
 * @private
 *
 * @param {Object} res - The http response.
 * @param {string} name - The name of the cookie.
 * @param {string} name - The value of the cookie.
 * @param {string} maxAge - The max number of seconds the cookie is allowed to live.
 * @param {boolean} signed - Whether or not to sign the cookie. Defaults to true.
 */
module.exports = function (res, name, value, maxAge, signed) {
  if (maxAge === undefined) {
    maxAge = 60 * 5;
  }

  res.cookie(name, value, {
    maxAge: maxAge * 1000,
    httpOnly: true,
    signed: signed === undefined ? true : signed
  });
};
