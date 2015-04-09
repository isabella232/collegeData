#!/usr/bin/env node
/*
 * Parse lists of school types from Wikipedia pages that we have previously
 * downloaded, for historically black schools and military schools.
 */

var cheerio = require('cheerio');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require('fs'));
var _ = require('underscore');

var parseHistoricallyBlackSchools = function(data) {
  return fs.readFileAsync(
    __dirname + "/raw_html/https---en.wikipedia.org-wiki-List_of_historically_black_colleges_and_universities", 'utf-8'
  ).then(function(html) {
    var $ = cheerio.load(html);

    $(".wikitable td:first-child a").each(function(i, elem) {
      //console.log($(this).text());
    });
    return data;
  });
}

var parseMilitarySchools = function(data) {
  return fs.readFileAsync(
    __dirname + "/raw_html/https---en.wikipedia.org-wiki-List_of_United_States_military_schools_and_academies", 'utf-8'
  ).then(function(html) {
    var $ = cheerio.load(html);
    $("#mw-content-text li").each(function(i, elem) {
      var text = $(this).text().trim();
      if (text.indexOf(" (") !== -1 && !/^[\d\^]/.test(text)) {
        var parts = text.split(" (");
        var school = parts[0];
        if (school.charAt(school.length - 1) === ",") {
          school = school.substring(0, school.length - 1);
        }
        console.log(school);
      }
    });
    return data;
  });
};

var main = function() {
  var datafile = __dirname + "/data/schoolTypes.json";
  var data;
  try {
    data = require(datafile);
  } catch (e)  {
    data = {};
  }
  Promise.resolve(data).then(function(data) {
    return parseHistoricallyBlackSchools(data);
  }).then(function(data) {
    return parseMilitarySchools(data);
  }).then(function(data) {
    return fs.writeFileAsync(datafile, data);
  }).then(function() {
    console.log("woot!");
  });
}

if (require.main === module) {
  main();
}
