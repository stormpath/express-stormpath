'use strict';

angular.module('stormpath')
.provider('$spFormEncoder', [function $spFormEncoder(){
  /**
   * This service is intentionally excluded from NG Docs.
   * It is an internal utility.
   */

  this.$get = [
    'STORMPATH_CONFIG',
    function formEncoderServiceFactory(STORMPATH_CONFIG){

      function FormEncoderService(){
        var encoder = new UrlEncodedFormParser();
        this.encodeUrlForm = encoder.encode.bind(encoder);
        return this;
      }

      FormEncoderService.prototype.formPost = function formPost(httpRequest){
        if(STORMPATH_CONFIG.FORM_CONTENT_TYPE==='application/x-www-form-urlencoded'){
          var h = httpRequest.headers ? httpRequest.headers : (httpRequest.headers = {});
          h['Content-Type'] = STORMPATH_CONFIG.FORM_CONTENT_TYPE;
          httpRequest.data = this.encodeUrlForm(httpRequest.data);
        }
        return httpRequest;
      };

      function UrlEncodedFormParser(){

        // Copy & modify from https://github.com/hapijs/qs/blob/master/lib/stringify.js

        this.delimiter = '&';
        this.arrayPrefixGenerators = {
          brackets: function (prefix) {
            return prefix + '[]';
          },
          indices: function (prefix, key) {
            return prefix + '[' + key + ']';
          },
          repeat: function (prefix) {
            return prefix;
          }
        };
        return this;
      }
      UrlEncodedFormParser.prototype.stringify = function stringify(obj, prefix, generateArrayPrefix) {

        if (obj instanceof Date) {
          obj = obj.toISOString();
        }
        else if (obj === null) {
          obj = '';
        }

        if (typeof obj === 'string' ||
          typeof obj === 'number' ||
          typeof obj === 'boolean') {

          return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
        }

        var values = [];

        if (typeof obj === 'undefined') {
          return values;
        }

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          if (Array.isArray(obj)) {
            values = values.concat(this.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix));
          }
          else {
            values = values.concat(this.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix));
          }
        }

        return values;
      };
      UrlEncodedFormParser.prototype.encode = function encode(obj, options) {

        options = options || {};
        var delimiter = typeof options.delimiter === 'undefined' ? this.delimiter : options.delimiter;

        var keys = [];

        if (typeof obj !== 'object' ||
          obj === null) {

          return '';
        }

        var arrayFormat;
        if (options.arrayFormat in this.arrayPrefixGenerators) {
          arrayFormat = options.arrayFormat;
        }
        else if ('indices' in options) {
          arrayFormat = options.indices ? 'indices' : 'repeat';
        }
        else {
          arrayFormat = 'indices';
        }

        var generateArrayPrefix = this.arrayPrefixGenerators[arrayFormat];

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          keys = keys.concat(this.stringify(obj[key], key, generateArrayPrefix));
        }

        return keys.join(delimiter);
      };

      return new FormEncoderService();
    }
  ];
}]);