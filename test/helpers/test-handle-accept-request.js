'use strict';

var assert = require('assert');
var sinon = require('sinon');

var handleAcceptRequest = require('../../lib/helpers').handleAcceptRequest;

var defaultsAccepts = ['*/*'];
var mockReq = {
  app: {
    get: function get(name) {
      return mockReq.app['_' + name];
    },
    _stormpathConfig: {
      web: {
        produces: ['application/json', 'text/html'],
        spa: {
          enabled: false
        }
      }
    }
  },
  accepts: function accepts() {
    return mockReq._accepts;
  },
  _accepts: defaultsAccepts
};

describe('handleAcceptRequest helper', function () {
  describe('default response content type', function () {
    var sandbox;
    var jsonSpy;
    var handlers;
    var defaultHandler;

    before(function () {
      sandbox = sinon.sandbox.create();
      jsonSpy = sandbox.spy();
      handlers = {
        'application/json': jsonSpy
      };
      defaultHandler = sandbox.spy();
    });

    after(function () {
      sandbox.restore();
    });

    it('should default to the first element of `config.web.produces`', function () {
      handleAcceptRequest(mockReq, null, handlers, defaultHandler);
      assert(jsonSpy.calledOnce);
      assert.equal(defaultHandler.callCount, 0);
    });
  });

  describe('content type set via Accept', function () {
    var oldAccepts;
    var sandbox;
    var htmlSpy;
    var handlers;
    var defaultHandler;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      oldAccepts = mockReq._accepts;
      mockReq._accepts = ['text/html'];
      htmlSpy = sandbox.spy();
      defaultHandler = sandbox.spy();
      handlers = {
        'text/html': htmlSpy
      };
    });

    afterEach(function () {
      sandbox.restore();
      mockReq._accepts = oldAccepts;
    });

    describe('when provided in produces', function () {
      it('should call the correct handler', function () {
        handleAcceptRequest(mockReq, null, handlers, defaultHandler);

        assert(htmlSpy.calledOnce);
        assert.equal(defaultHandler.callCount, 0);
      });
    });

    describe('when not provided in produces', function () {
      var oldProduces;

      before(function () {
        oldProduces = mockReq.app._stormpathConfig.web.produces.slice(0);
        mockReq.app._stormpathConfig.web.produces = ['application/json'];
      });

      after(function () {
        mockReq.app._stormpathConfig.web.produces = oldProduces.slice(0);
      });

      it('should call the default handler', function () {
        handleAcceptRequest(mockReq, null, handlers, defaultHandler);

        assert.equal(htmlSpy.callCount, 0);
        assert(defaultHandler.calledOnce);
      });
    });
  });
});