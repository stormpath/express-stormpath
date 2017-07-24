var fbgraph = require('fbgraph');
var express = require('express');
var stormpath = require('express-stormpath');

var app = express();

function getFacebookPicture(accessToken, size, callback) {
  if (!size) {
    size = 'normal';
  }

  var requestOptions = {
    access_token: accessToken
  };

  fbgraph.get('/me/picture?type=' + size, requestOptions, callback);
}

app.use(stormpath.init(app, {
  debug: 'info',
  postLoginHandler: function (account, req, res, next) {
    account.getProviderData(function (err, providerData) {
      if (err) {
        return next(err);
      }

      if (providerData.providerId === 'facebook') {
        return getFacebookPicture(providerData.accessToken, 'normal', function (err, profilePicture) {
          if (err) {
            return next(err);
          }

          // E.g. save profilePicture.location to database.
          console.log('Facebook profile picture of account \'%s\' is \'%s\'.', account.href, profilePicture.location);

          next();
        });
      }

      next();
    });
  }
}));

app.on('error', function (err) {
  console.error('An error occurred!', err);
});

app.on('stormpath.ready', function (err) {
  app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/');
  });
});