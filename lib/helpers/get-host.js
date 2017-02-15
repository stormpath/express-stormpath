'use strict';

/**
 * Get the host header value of a request, which should from from the 'Host'
 * header or the 'X-Forwarded-Host' header, if the appliation has been
 * configured to trust upstream proxies via app.set('trust proxy', true);
 *
 * This function exists because in Express < 5, the req.host value is unreliable
 * beacuse it strips the port, e.g. if the header is `Host: localhost:3000`,
 * then req.host will report `localhost`, which is incorrect and will break URL
 * building.
 *
 * See https://github.com/expressjs/express/issues/2179
 *
 * @param      {object}  req            Request to retrieve host from.
 * @param      {boolean} [stripPort]    Strip port if present in host.
 * @return     {string}                 Host of the provided request.
 */
module.exports = function getHost(req, stripPort) {
  var hostHeader = req.headers.host;
  var xForwardedHostHeader = req.headers['x-forwarded-host'];
  var host = req.app.get('trust proxy') ? (xForwardedHostHeader || hostHeader) : hostHeader;

  if (stripPort) {
    host = host.match(/:/g) ? host.slice(0, host.indexOf(':')) : host;
  }

  return host;
};