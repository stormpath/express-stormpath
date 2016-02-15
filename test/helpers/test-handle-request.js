'use strict';

var MockApp = require('../mocks/mock-app');
var MockRequest = require('../mocks/mock-request');
var MockResponse = require('../mocks/mock-response');

var sinon = require('sinon');
var assert = require('assert');
var handleRequest = require('../../lib/helpers/handle-request');

describe('helpers.handleRequest(req, res, next, handlers, callback)', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('next parameter', function () {
    var mocks, spies;

    beforeEach(function (done) {
      spies = {};
      spies.next = sandbox.spy();

      mocks = {};
      mocks.config = { web: { produces: ['foo/bar'] } };
      mocks.app = new MockApp(mocks.config);
      mocks.response = new MockResponse();
      mocks.request = new MockRequest('GET', mocks.app, 'foo/bar');

      spies.callback = sandbox.spy(function () {
        done();
      });

      spies.responseJson = sandbox.spy(mocks.response, 'json');
      spies.responseStatus = sandbox.spy(mocks.response, 'status');
      spies.responseEnd = sandbox.spy(mocks.response, 'end');

      var testHandlers = {
        'foo/bar': function () {
          this.pass();
        }
      };

      handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
    });

    it('is called when handler calls this.pass()', function () {
      assert(spies.next.withArgs().calledOnce);
    });
  });

  describe('handlers parameter', function () {
    describe('any handler', function () {
      var mocks, spies;

      beforeEach(function (done) {
        spies = {};
        spies.next = sandbox.spy();

        mocks = {};
        mocks.config = { web: { produces: ['foo/bar'] } };
        mocks.app = new MockApp(mocks.config);
        mocks.response = new MockResponse();
        mocks.request = new MockRequest('GET', mocks.app, 'foo/bar');

        spies.nonMatchingHandler = sandbox.spy();
        spies.matchingHandler = sandbox.spy(done);

        var testHandlers = {
          'foo/bar': spies.matchingHandler,
          'foo/invalid': spies.nonMatchingHandler
        };

        handleRequest(mocks.request, mocks.response, spies.next, testHandlers);
      });

      it('should be called when content type is matching', function () {
        assert(spies.matchingHandler.called);
      });

      it('should\'t be called when content type isn\'t matching', function () {
        assert(!spies.nonMatchingHandler.called);
      });

      describe('when called', function () {
        var handlerScope;

        beforeEach(function (done) {
          var testHandlers = {
            'foo/bar': function () {
              handlerScope = this;
              done();
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers);
        });

        describe('the scope', function () {
          it('should be an object', function () {
            assert(typeof handlerScope === 'object');
          });

          it('should have a req property', function () {
            assert('req' in handlerScope);
          });

          it('should have a res property', function () {
            assert('res' in handlerScope);
          });

          it('should have an accept() method', function () {
            assert(typeof handlerScope.accept === 'function');
          });

          it('should have a reject() method', function () {
            assert(typeof handlerScope.reject === 'function');
          });

          it('should have a pass() method', function () {
            assert(typeof handlerScope.pass === 'function');
          });

          it('should have an isGetRequest() method', function () {
            assert(typeof handlerScope.isGetRequest === 'function');
          });

          it('should have an isPutRequest() method', function () {
            assert(typeof handlerScope.isPutRequest === 'function');
          });

          it('should have an isPostRequest() method', function () {
            assert(typeof handlerScope.isPostRequest === 'function');
          });

          it('should have an isDeleteRequest() method', function () {
            assert(typeof handlerScope.isDeleteRequest === 'function');
          });
        });
      });
    });

    describe('a text/html handler', function () {
      var mocks, spies;

      beforeEach(function () {
        spies = {};
        spies.next = sandbox.spy();

        mocks = {};
        mocks.config = { web: { produces: ['text/html'] } };
        mocks.app = new MockApp(mocks.config);
        mocks.response = new MockResponse();
        mocks.request = new MockRequest('POST', mocks.app, 'text/html');
      });

      describe('when handler calls this.accept()', function () {
        beforeEach(function (done) {
          spies.callback = sandbox.spy(function () {
            done();
          });

          spies.responseJson = sandbox.spy(mocks.response, 'json');
          spies.responseStatus = sandbox.spy(mocks.response, 'status');
          spies.responseEnd = sandbox.spy(mocks.response, 'end');

          var testHandlers = {
            'text/html': function () {
              this.accept();
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
        });

        it('should call callback()', function () {
          assert(spies.callback.withArgs().calledOnce);
        });

        it('shouldn\'t call res.json()', function () {
          assert(!spies.responseJson.called);
        });

        it('shouldn\'t call res.status()', function () {
          assert(!spies.responseStatus.called);
        });

        it('shouldn\'t call res.end()', function () {
          assert(!spies.responseEnd.withArgs().called);
        });

        it('shouldn\'t call next()', function () {
          assert(!spies.next.called);
        });
      });

      describe('when handler calls this.reject(err)', function () {
        var mockError;

        beforeEach(function (done) {
          mockError = new Error('759328f0-61bf-458e-ac27-ec04d83710fe');

          spies.callback = sandbox.spy(function () {
            done();
          });

          spies.responseJson = sandbox.spy(mocks.response, 'json');
          spies.responseStatus = sandbox.spy(mocks.response, 'status');
          spies.responseEnd = sandbox.spy(mocks.response, 'end');

          var testHandlers = {
            'text/html': function () {
              this.reject(mockError);
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
        });

        it('should call res.status(400)', function () {
          assert(spies.responseStatus.withArgs(400).calledOnce);
        });

        it('should call res.end()', function () {
          assert(spies.responseEnd.withArgs().calledOnce);
        });

        it('should call callback(err)', function () {
          assert(spies.callback.withArgs(mockError).calledOnce);
        });

        it('shouldn\'t call res.json()', function () {
          assert(!spies.responseJson.called);
        });

        it('shouldn\'t call next(err)', function () {
          assert(!spies.next.called);
        });
      });

      describe('when handler calls this.pass()', function () {
        beforeEach(function (done) {
          spies.callback = sandbox.spy(function () {
            done();
          });

          spies.responseJson = sandbox.spy(mocks.response, 'json');
          spies.responseStatus = sandbox.spy(mocks.response, 'status');
          spies.responseEnd = sandbox.spy(mocks.response, 'end');

          var testHandlers = {
            'text/html': function () {
              this.pass();
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
        });

        it('should call next()', function () {
          assert(spies.next.withArgs().calledOnce);
        });

        it('should call callback()', function () {
          assert(spies.callback.withArgs().calledOnce);
        });

        it('shouldn\'t call res.json()', function () {
          assert(!spies.responseJson.called);
        });

        it('shouldn\'t call res.status()', function () {
          assert(!spies.responseStatus.called);
        });

        it('shouldn\'t call res.end()', function () {
          assert(!spies.responseEnd.called);
        });
      });
    });

    describe('an application/json handler', function () {
      var mocks, spies;

      beforeEach(function () {
        spies = {};
        spies.next = sandbox.spy();

        mocks = {};
        mocks.config = { web: { produces: ['application/json'] } };
        mocks.app = new MockApp(mocks.config);
        mocks.response = new MockResponse();
        mocks.request = new MockRequest('POST', mocks.app, 'application/json');
      });

      describe('when handler calls this.accept(result)', function () {
        var mockResult;

        beforeEach(function (done) {
          mockResult = { value: 'bdd28e2a-cd54-485e-bbc3-fac949929c9b' };

          spies.callback = sandbox.spy(function () {
            done();
          });

          spies.responseJson = sandbox.spy(mocks.response, 'json');
          spies.responseStatus = sandbox.spy(mocks.response, 'status');
          spies.responseEnd = sandbox.spy(mocks.response, 'end');

          var testHandlers = {
            'application/json': function () {
              this.accept(mockResult);
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
        });

        it('should call res.json(result)', function () {
          assert(spies.responseJson.withArgs(mockResult).calledOnce);
        });

        it('should call callback(null, result)', function () {
          assert(spies.callback.withArgs(null, mockResult).calledOnce);
        });

        it('shouldn\'t call res.status()', function () {
          assert(!spies.responseStatus.called);
        });

        it('shouldn\'t call res.end()', function () {
          assert(!spies.responseEnd.withArgs().called);
        });

        it('shouldn\'t call next()', function () {
          assert(!spies.next.called);
        });
      });

      describe('when handler calls this.reject(err)', function () {
        var mockError;

        beforeEach(function (done) {
          mockError = new Error('759328f0-61bf-458e-ac27-ec04d83710fe');

          spies.callback = sandbox.spy(function () {
            done();
          });

          spies.responseJson = sandbox.spy(mocks.response, 'json');
          spies.responseStatus = sandbox.spy(mocks.response, 'status');
          spies.responseEnd = sandbox.spy(mocks.response, 'end');

          var testHandlers = {
            'application/json': function () {
              this.reject(mockError);
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
        });

        it('should call res.status(400)', function () {
          assert(spies.responseStatus.withArgs(400).calledOnce);
        });

        it('should call res.json(err)', function () {
          var jsonError = { error: mockError.message };
          assert(spies.responseJson.withArgs(jsonError).calledOnce);
        });

        it('should call res.end()', function () {
          assert(spies.responseEnd.withArgs().calledOnce);
        });

        it('should call callback(err)', function () {
          assert(spies.callback.withArgs(mockError).calledOnce);
        });

        it('shouldn\'t call next(err)', function () {
          assert(!spies.next.called);
        });
      });

      describe('when handler calls this.pass()', function () {
        beforeEach(function (done) {
          spies.callback = sandbox.spy(function () {
            done();
          });

          spies.responseJson = sandbox.spy(mocks.response, 'json');
          spies.responseStatus = sandbox.spy(mocks.response, 'status');
          spies.responseEnd = sandbox.spy(mocks.response, 'end');

          var testHandlers = {
            'application/json': function () {
              this.pass();
            }
          };

          handleRequest(mocks.request, mocks.response, spies.next, testHandlers, spies.callback);
        });

        it('should call next()', function () {
          assert(spies.next.withArgs().calledOnce);
        });

        it('should call callback()', function () {
          assert(spies.callback.withArgs().calledOnce);
        });

        it('shouldn\'t call res.json()', function () {
          assert(!spies.responseJson.called);
        });

        it('shouldn\'t call res.status()', function () {
          assert(!spies.responseStatus.called);
        });

        it('shouldn\'t call res.end()', function () {
          assert(!spies.responseEnd.called);
        });
      });
    });
  });

  describe('callback parameter', function () {
    var mocks, spies;

    beforeEach(function (done) {
      spies = {};
      spies.next = sandbox.spy();
      spies.callback = sandbox.spy(function () {
        done();
      });

      mocks = {};
      mocks.config = { web: { produces: ['text/html'] } };
      mocks.app = new MockApp(mocks.config);
      mocks.response = new MockResponse();
      mocks.request = new MockRequest('GET', mocks.app, 'text/html');

      handleRequest(mocks.request, mocks.response, spies.next, {}, spies.callback);
    });

    it('should be called', function () {
      assert(spies.callback.withArgs().calledOnce);
    });
  });
});