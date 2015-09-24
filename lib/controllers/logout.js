'use strict';

var authentication = require('../authentication');
var idSiteRedirect = require('./id-site-redirect');

/**
 * This controller logs out an existing user, then redirects them to the
 * homepage.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function(req, res) {
  if(req.cookies && req.cookies.idSiteSession){
    idSiteRedirect({logout:true})(req,res);
  }else{
    authentication.deleteCookies(req,res);
    res.redirect(req.app.get('stormpathConfig').web.logout.nextUri);
  }
};
