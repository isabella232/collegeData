#!/usr/bin/env node
/*
 * Look through all of the JSON files with school data in ``./data/``, and
 * fetch a cover photo and school logo for each one from linkedin.
 *
 * Data is written to ``./data/imageData.json``.
 *
 * Depends on the school data already having linked in URLs.
 */
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var fs = require('fs');
var Promise = require("bluebird");
var conf = require("./conf.json");

var enqueueRequests = function(imageData) {
  var requests = [];
  var idRange = _.range(conf.minSchoolId, conf.maxSchoolId + 1);

  _.each(idRange, function(schoolId) {
    if (imageData[schoolId]) {
      return;
    }
    var filename = __dirname + "/data/" + schoolId + ".json";
    if (fs.existsSync(filename)) {
      var schoolData = require(filename);
      if (schoolData.linkedinLink) {
        requests.push({
          url: schoolData.linkedinLink,
          schoolId: schoolId
        });
      }
    }
  });
};


var fetchImageUrls = function(req) {
  var schoolId = req.schoolId;
  var url = req.url;
  return Promise.delay(conf.throttle).then(function() {
    return new Promise(function(resolve, reject) {
      request({
        uri: schoolData.linkedinLink
      }, function(err, res, body) {
        if (err) {
          return reject(err);
        }
        var $ = cheerio.load(body);
        logoLocation = body.search('("logoSrc")');

        if (logoLocation) {
          schoolLogo = body.substr(logoLocation, 109).split(',')[0].split('"')[3];
        } else {
          schoolLogo = null
        }

        coverPhoto = $('#college-cover-photo').find('.cover-photo').attr('data-li-src');

        imageData[schoolId] = {
          coverPhoto: coverPhoto,
          schoolLogo: schoolLogo
        };

        console.log("#", start, " - ", schoolData.name);
        console.log(coverPhoto);
        console.log(schoolLogo);
        resolve();
      });
    });
  });
};

var main = function() {
  var datafile = __dirname + "/data/imageData.json";
  if (fs.existsSync(datafile)) {
    imageData = require(datafile);
  } else {
    imageData = {};
  }
  var requests = enqueueRequests(imageData);
  Promise.map(requests, fetchImageUrls, {concurrency: 1}).then(function() {
    return new Promise(function(resolve, reject) {
      fs.writeFile(datafile, JSON.stringify(imageData, null, 2), function(err) {
        if (err) {
          return reject(err);
        }
        resolve();
      })
    });
  });
};

if (require.main === module) {
  main();
}
