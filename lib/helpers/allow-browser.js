module.exports = function allowBrowser(req, res) {
  if (req.cookies['allow-browser'])
    return true;

  if (req.url.indexOf('allow-browser') > -1) {
    res.cookie('allow-browser', true, {expires: 0});
    return true;
  }
};
