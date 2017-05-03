'use strict';

var path = require('path');

var pug = require('pug');
var mixin = require('utils-merge');

var viewCache = {};

function renderPug(filepath, locals) {
  var env = process.env.NODE_ENV;

  if (env === 'production') {
    if (!viewCache[filepath]) {
      viewCache[filepath] = pug.compileFile(filepath);
    }

    return viewCache[filepath](locals);
  }

  return pug.renderFile(filepath, locals);
}

/**
 * Render a view using app locals.
 *
 * By default, use Pug as it is necessary because our library can't rely
 * on the developer using Pug view as well -- so this allows us to use
 * Pug templates for our library views, without negatively affecting the
 * developer's application.
 *
 * If, however, the developer has supplied a render handler in their settings,
 * then we'll go ahead and use that render function instead.
 *
 * @method
 * @private
 *
 * @param {String} view - The filename to the view to render.
 * @param {Object} res - The http response.
 * @param {Object} options - The locals which will be supplied to the view
 *   during rendering.
 */
module.exports = function (req, res, view, options) {
  var config = req.app.get('stormpathConfig');
  var extension = path.extname(view);
  var filename = path.basename(view, extension);

  options = options || {};
  mixin(options, res.locals);
  mixin(options, config.templateContext || {});

  if (!extension && (filename === view)) {
    // This means that we have received a default config option, such as
    // 'login' - just continue to render our default page.
    res.send(renderPug(path.join(path.dirname(__dirname), 'views', view + '.pug'), options));
  } else if (extension === '.pug') {
    res.send(renderPug(view, options));
  } else if (extension) {
    // Delegate to the view engine.
    res.render(view, options);
  } else {
    throw new Error('Unexpected view option: "' + view + '".  Please see documentation for express-stormpath');
  }
};
