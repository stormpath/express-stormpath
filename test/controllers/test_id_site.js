var assert = require('assert');

var express = require('express');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

function isIdSiteRedirect(res){
  var location = res && res.headers && res.headers.location;

  var error = new Error('Expected Location header with redirect to api.stormpath.com/sso, but got '+location);
  if(location){
    var match =  location.match(/api.stormpath.com\/sso/);
    if(match){
      return null;
    }else{
      return error;
    }
  }else{
    return error;
  }
}

function prepeareIdSiteModel(client,currentHost,callbckUri,cb){
  client.getCurrentTenant(function(err,tenant){
    if(err){
      throw err;
    }else{
      client.getResource(tenant.href + '/idSites',function(err,collection){
        if(err){
          throw err;
        }else{
          var idSiteModel = collection.items[0];
          if(idSiteModel.authorizedOriginUris.indexOf(currentHost) === -1){
            idSiteModel.authorizedOriginUris.push(currentHost);
          }
          if(idSiteModel.authorizedRedirectUris.indexOf(callbckUri) === -1){
            idSiteModel.authorizedRedirectUris.push(callbckUri);
          }
          idSiteModel.save(cb);
        }
      });
    }
  });
}

function revertIdSiteModel(client,currentHost,callbckUri,cb){
  client.getCurrentTenant(function(err,tenant){
    if(err){
      throw err;
    }else{
      client.getResource(tenant.href + '/idSites',function(err,collection){
        if(err){
          throw err;
        }else{
          var idSiteModel = collection.items[0];
          idSiteModel.authorizedOriginUris = idSiteModel.authorizedOriginUris.filter(function(uri){
            return !uri.match('0.0.0.0');
          });
          idSiteModel.authorizedRedirectUris = idSiteModel.authorizedRedirectUris.filter(function(uri){
            return !uri.match('0.0.0.0');
          });
          idSiteModel.save(cb);
        }
      });
    }
  });
}

describe('id site',function() {
  var stormpathApplication, app, config, server, host, callbackUri;

  var accountData = {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };

  before(function(done) {
    helpers.createApplication(helpers.createClient(), function(err, _app) {
      if (err){
        done(err);
      }else{
        stormpathApplication = _app;
        stormpathApplication.createAccount(accountData,function(err){
          if (err){
            done(err);
          }else{

            app = express();

            app.use(stormpath.init(app, {
              application: {
                href: stormpathApplication.href
              },
              web: {
                login: {
                  enabled: true
                },
                register: {
                  enabled: true
                },
                idSite: {
                  enabled: true
                }
              }
            }));

            app.on('stormpath.ready',function(){
              config = app.get('stormpathConfig');
              server = app.listen(function(){
                host = 'http://' + server.address().address + ':' + server.address().port;
                callbackUri = host + config.web.idSite.uri;
                prepeareIdSiteModel(app.get('stormpathClient'),host,callbackUri,done);
              });
            });
          }
        });
      }
    });
  });

  after(function(done) {
    revertIdSiteModel(app.get('stormpathClient'),host,callbackUri,function(){
      helpers.destroyApplication(stormpathApplication, done);
    });
  });

  it('should redirect to idsite for login, if idsite is enabled',function(done){
    request(host).get(config.web.login.uri)
      .expect(302)
      .expect(isIdSiteRedirect)
      .end(function(err,res){
        request(res.headers.location)
          .get('')
          .expect('Location',new RegExp(/\/?jwt=/))
          .end(done);
      });
  });

  it('should redirect to idsite for register, if idsite is enabled',function(done){
    request(host).get(config.web.register.uri)
      .expect(302)
      .expect(isIdSiteRedirect)
      .end(function(err,res){
        request(res.headers.location)
          .get('')
          .expect('Location',new RegExp(/#\/register/))
          .end(done);
      });
  });
  it('should redirect to idsite for forgot password, if idsite is enabled',function(done){
    request(host).get(config.web.forgotPassword.uri)
      .expect(302)
      .expect(isIdSiteRedirect)
      .end(function(err,res){
        request(res.headers.location)
          .get('')
          .expect('Location',new RegExp(/#\/forgot/))
          .end(done);
      });
  });
  it.skip('should bind the id site callback hanlder, if idisite is enabled');
  it.skip('should create a session on id site callback');
});