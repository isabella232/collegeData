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

var loadAllSchools = function() {
  // Load all schools.
  var range = _.range(conf.minSchoolId, conf.maxSchoolId + 1);
  var schools = {};
  for (var i = conf.minSchoolId; i < conf.maxSchoolId + 1; i++) {
    try {
      schools[i] = require(__dirname + "/out/" + i + ".json");
    } catch (e) {
      continue;
    }
  }
  return schools;
};

var matchSchool = function(schools, name) {
  // Special cases
  if (name === "Concordia College, Selma") {
    name = "Concordia College Alabama";
  }

  var sname;
  for (var schoolId in schools) {
    sname = schools[schoolId].name;
    if (!sname) {
      continue;
    }
    if (sname === name) {
      return schoolId;
    }
  }
  return;
};

var mergeAll = function() {
  // School types
  var schoolTypes = require(__dirname + "/data/schoolTypes.json");
  var schools = loadAllSchools();
  // Military
  _.each(schoolTypes.military, function(name) {
    var schoolId = matchSchool(schools, name);
    if (schoolId) {
      schools[schoolId].military = true;
    }
  });
  // Historically black
  _.each(schoolTypes.historicallyBlack, function(name) {
    var schoolId = matchSchool(schools, name);
    if (schoolId) {
      schools[schoolId].historicallyBlack = true;
    }
  });

  // Images
  var imageData = require(__dirname + "/imageData.json");
  _.each(imageData, function(data, schoolId) {
    schools[schoolId].schoolLogo = data.schoolLogo;
    schools[schoolId].coverPhoto = data.coverPhoto;
  });

  return Promise.map(_.values(schools), function(school) {
    if (school.schoolId === 1567) {
      console.log(school.military);
    }
    return fs.writeFileAsync(
      __dirname + "/out/" + school.idNumber + ".json",
      JSON.stringify(school, null, 2)
    );
  });
};

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
    return mergeAll();
  }).then(function() {
    console.log("Done.");
  }).catch(function(e) {
    throw e;
  });
};

if (require.main === module) {
  pipeline();
}
