# Style Guide


## Whitespace

Whitespace should come before / after curly braces and operators, eg:

```javascript
var message = 'Hi there, this is an email for ' + account.email + '.';
console.log(message);

function doStuff() {
  // ...
}
```

Whitespace should NOT come before function arguments, eg:

```javascript
function doStuff(arg1, arg2) {
  // Note, no space above between doStuff and (...).
}
```

Whitespace should separate functionality breaks, eg:

```javascript
function login(req, res) {
  // First, we'll parse all request data.
  var accountData = validateData(req.body);

  // Next, we'll handle errors.
  if (!accountData) {
    return res.json({ error: 'Bad data!' });
  }

  // Next, we'll make the account.
  var account = new Account(accountData);
  account.save(function () {
    return res.json({ status: 'OK!' });
  });
}
```


## Trailing Commas

Commas should always trail, unless you're doing JSON / object notation.

```javascript
console.log({
  hi: 'there',
  yo: 'dude'    // No trailing comma.
});
```


## Require Statements

Require statements should always be ordered like so:

- Core node modules.
- Third party node modules.
- Local modules.
- Alphabetical.

If your JS file contains more than 1 of the above types, use whitespace to
separate them.  For instance:

```javascript
// Core modules.
var assert = require('assert');
var path = require('path');

// Third party modules.
var camel = require('camel');
var extend = require('deep-extend');

// Local modules.
var actions = require('./actions');
var helpers = require('./helpers');
```


## Variables

Variables should be defined at the top of a function when possible and where
makes sense.  They should also be alphabetically ordered when makes sense:

```javascript
function stuff() {
  var application;
  var baseUrl;
  var data;

  // Code here...
}
```


## Indentation

All indentation should be 2 spaces.

```javascript
function woot() {
  // 2 spaces over
  console.log('woot!');
}
```


## Quotes

Use single quotes always:

```javascript
console.log('I like single quotes.');
```


## Grammar / Sentence Structure

Try to use complete sentences with proper capitalization / punctuation for all
code: comments, error messages, etc.

```javascript
/**
 * This function returns some stuff.
 */
function doStuff() {
  console.log('I\'m returning stuff here.');
  return 'stuff';
}
```


## Comments

Always use inline comments unless documenting API stuff with jsdoc.  For
instance:

```javascript
/**
 * This is a function doc in jsdoc, so I'm using multi-line comments.
 */
function stuff() {
  // This is an inline comment describing code.
  return 4;
}
```


## Files

Files should be named in all lowercase, with dash characters as separators, eg:

```console
$ ls
groups-required.js      other-file.js   another-file.js     more-files.js
```

Test files should mirror the directory structure / naming of the source files
they reference, eg:

```console
project
├── lib
│   └── middleware
│       ├── authenticate.js
│       └── groups-required.js
└── test
    └── middleware
        ├── test-authenticate.js
        └── test-groups-required.js

4 directories, 4 files
```
