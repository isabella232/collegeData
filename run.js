#!/usr/bin/env node
var _ = require("underscore");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var spawn = require("child_process").spawn;
var deepEqual = require("deep-equal");
var leven = require("leven");
var conf = require("./conf.json");

// Shim to fix promisified exists:
// https://github.com/petkaantonov/bluebird/issues/418
fs.existsAsync = function(path) {
  return new Promise(function(resolve, reject) {
    fs.exists(path, function(exists) {
      resolve(exists);
    });
  });
};

/**
 * Spawn a subprocess, returning a promise that resolves on completion.
 */
var spawnPromise = function(path, args) {
  return new Promise(function(resolve, reject) {
    var proc = spawn(path, args);
    proc.stdout.on('data', function(data) { console.log('stdout: ' + data); });
    proc.stderr.on('data', function(data) { console.log('stderr: ' + data); });
    proc.on('close', function(code) {
      if (code === 0) {
        resolve();
      } else {
        reject(path + " exited with satus " + code);
      }
    });
  });
};

/**
 * Build a list of stats of all the files in rawHtml, to see if any have
 * changed. We'll use this to decide whether to rerun
 * ``parseFilesFromDisk.js``.
 */
var statRawHtml = function() {
  var dir = __dirname + "/raw_html/";
  return fs.readdirAsync(dir).then(function(files) {
    var stats = {};
    return Promise.map(files, function(filename) {
      return fs.statAsync(dir + filename).then(function(stats) {
        stats[filename] = stats.mtime.getTime();
      });
    }).then(function() {
      return stats;
    });
  });
};

/**
 * Execute the scrapy file grabbers.
 */
var fetchRawHtml = function() {
  return Promise.resolve().then(function() {
    return spawnPromise(__dirname + "/fetcher/bootstrap-python.sh");
  }).then(function() {
    return spawnPromise(__dirname + "/fetcher/run-scraper.sh");
  });
};

/**
 * Parse grabbed scrapy files.
 */
var parseFilesFromDisc = function() {
  return spawnPromise(__dirname + "/parseFilesFromDisk.js");
};

/**
 * Run the script to parse school types from wikipedia sources.
 */
var parseSchoolTypes = function() {
  return spawnPromise(__dirname + "/parseSchoolTypes.js");
};

/**
 * Parse images
 */
var parseImages = function() {
  return spawnPromise(__dirname + "/parseImages.js");
};
/**
 * Merge all
 */
var mergeAll = function() {
  return spawnPromise(__dirname + "/mergeAll.js");
}

var pipeline = function() {
  statRawHtml().then(function(stats1) {
    return fetchRawHtml().then(function() {
      return statRawHtml();
    }).then(function(stats2) {
      var changed = !deepEqual(stats1, stats2);
      return changed;
    })
  }).then(function(changed) {
    if (changed) {
      return parseFilesFromDisc().then(function() {
        return Promise.all([
          parseSchoolTypes(),
          parseImages()
        ]);
      });
    }
  }).then(function() {
    mergeAll();
  }).then(function() {
    console.log("Done.");
  }).catch(function(e) {
    throw e;
  });
};

if (require.main === module) {
  pipeline();
}
