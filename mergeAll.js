#!/usr/bin/env node
var _ = require("underscore");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var conf = require("./conf.json");

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
  } else if (name === "Florida A&M University") {
    name = "Florida Agricultural and Mechanical University";
  }

  var sname;
  for (var schoolId in schools) {
    sname = schools[schoolId].name;
    if (!sname) {
      continue;
    }
    if (name === "Lincoln University of Missouri" &&
        sname === "Lincoln University" &&
        schools[schoolId].state === "MO") {
      return schoolId;
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
  _.each(schools, function(school) {
    school.military = false;
    school.historicallyBlack = false;
  });

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
  var imageData = require(__dirname + "/data/imageData.json");
  _.each(imageData, function(data, schoolId) {
    schools[schoolId].schoolLogo = data.schoolLogo;
    schools[schoolId].coverPhoto = data.coverPhoto;
  });

  return Promise.map(_.values(schools), function(school) {
    return fs.writeFileAsync(
      __dirname + "/out/" + school.idNumber + ".json",
      JSON.stringify(school, null, 2)
    );
  });
};

if (require.main === module) {
  mergeAll();
}
