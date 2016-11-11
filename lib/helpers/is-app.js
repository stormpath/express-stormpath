module.exports = function isApp(req) {
  var ua = req.headers['user-agent'];
  return ua.indexOf('Rooster') > -1 || ua.indexOf('Daycast') > -1;
};
