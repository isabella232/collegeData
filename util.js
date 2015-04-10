
module.exports.slugify = function(url) {
  return url.replace(/[^-a-zA-Z0-9_\.]/g, '-');
};
