'use strict';

function writeJsonError(res, err) {
  err.statusCode = err.statusCode || 400;

  res.status(err.statusCode);

  var errorMessage = 'Unknown error. Please contact support.';

  if (err) {
    errorMessage = err.userMessage || err.message;
  }

  res.json({
    status: err.statusCode,
    message: errorMessage
  });

  res.end();
}

module.exports = writeJsonError;