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

  // Neighbor GPA.  Clone the GPA score data from the school with the closest
  // acceptance rate.
  var sbar = []; // schools by acceptance rate
  var schoolsWithoutGPA = [];
  // Sort schools into those with and those without gpa data.  Ignore schools
  // without ``acceptanceRate.percent``.
  _.each(schools, function(school) {
    var percent = school.generalAdmissionsData.acceptanceRate.percent;
    if (percent) {
      if (school.specificAdmissionsData.GPA.average) {
        sbar.push([percent, school]);
      } else {
        schoolsWithoutGPA.push([percent, school]);
      }
    }
  });
  // Sort schools by acceptance rate
  _.sortBy(sbar, function(s) { return s[0]; });
  // For each school without GPA, assign GPA scores of the closest neighbor by
  // acceptance rate.
  schoolsWithoutGPA.forEach(function(percentSchool) {
    var pos = _.sortedIndex(sbar, percentSchool, function(s) { return s[0] });
    var chosen;
    if (pos === 0) {
      chosen = sbar[0];
    } else if (pos === sbar.length - 1) {
      chosen = sbar[sbar.length - 1];
    } else if (pos === sbar.length) {
      chosen = sbar[sbar.length - 1];
    } else if (Math.abs(sbar[pos][0] - percentSchool[0]) <
               Math.abs(sbar[pos + 1][0] - percentSchool[0])) {
      chosen = sbar[pos];
    } else {
      chosen = sbar[pos + 1];
    }
    var chosenPercent = chosen[0];
    var chosenSchool = chosen[1];
    percentSchool[1].calculatedAdmissionsData = {
      nearestGPA: {
        school: chosenSchool.name,
        acceptanceRatePercent: chosenPercent,
        scores: chosenSchool.specificAdmissionsData.GPA
      }
    };
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
