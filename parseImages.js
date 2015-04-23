#!/usr/bin/env node
/*
 * Look through all of the JSON files with school data in ``./out/``, and
 * fetch a cover photo and school logo for each one from linkedin.
 *
 * Data is written to ``./data/imageData.json``.
 *
 * Depends on the school data already having linked in URLs.
 */

var cheerio = require('cheerio');
var _ = require('underscore');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require('fs'));
var util = require("./util.js");
var conf = require("./conf.json");


var parseLinkedIn = function(idUrl) {
  var schoolId = idUrl.schoolId;
  var url = idUrl.url;
  var path = __dirname + "/raw_html/" + util.slugify(url)
  return fs.readFileAsync(path, {encoding: 'utf-8'}).then(function(html) {
    var jsonMatch = /<!--(\{"content":.*\})-->/.exec(html);
    try {
      var data = JSON.parse(jsonMatch[1].replace(/\\u002d/g, '-'));
    } catch (e) {
      console.log(jsonMatch[1])
      throw e;
    }
    var schoolLogo = data && data.content && data.content.unifiedHeader && data.content.unifiedHeader.logoSrc || null;

    var $ = cheerio.load(html);
    coverPhoto = $('#college-cover-photo').find('.cover-photo').attr('data-li-src');
    return {
      schoolId: schoolId,
      coverPhoto: coverPhoto,
      schoolLogo: schoolLogo
    };
  }).catch(function(e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  });
};

var main = function() {
  var linkedin = require(__dirname + "/data/linkedin.json");
  var idUrlList = _.map(linkedin, function(details, schoolId) {
    return {schoolId: parseInt(schoolId), url: details.url};
  });

  Promise.resolve().then(function() {
    return Promise.map(idUrlList, parseLinkedIn, {concurrency: 32});
  }).then(function(imgdata) {
    var results = {};
    _.each(imgdata, function(data, schoolId) {
      if (data) {
        results[data.schoolId] = {
          schoolLogo: data.schoolLogo,
          coverPhoto: data.coverPhoto
        };
      }
    });
    return fs.writeFile(__dirname + "/data/imageData.json",
                        JSON.stringify(results, null, 2));
  });
};

if (require.main === module) {
  main();
}
