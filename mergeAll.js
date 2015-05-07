#!/usr/bin/env node
var _ = require("underscore");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var conf = require("./conf.json");
var regions = require("us-regions");

var OUTPUT_PATH = __dirname + "/out/";

var loadAllSchools = function() {
  // Load all schools.
  var range = _.range(conf.minSchoolId, conf.maxSchoolId + 1);
  var schools = {};
  for (var i = conf.minSchoolId; i < conf.maxSchoolId + 1; i++) {
    try {
      schools[i] = require(__dirname + "/parsed_schools/" + i + ".json");
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

/**
 * Go through the list of given schools.  Filter out the schools that don't
 * have ``generalAdmissionsData.acceptanceRate.percent``.  Sort the remaining
 * into those that have a value returned by ``getter`` and those who don't.
 * For those that don't, find the closest school by acceptance rate percent
 * that does, and apply setter to it.
 */
function assignScoresByAcceptanceRateNeighbor(schools, getter, setter) {
  var sbar = [];
  var schoolsWithout = [];
  _.each(schools, function(school) {
    var percent = school.generalAdmissionsData.acceptanceRate.percent;
    if (percent) {
      var val = getter(school);
      if (val) {
        sbar.push([percent, school]);
      } else {
        schoolsWithout.push([percent, school]);
      }
    }
  });
  sbar = _.sortBy(sbar, function(s) { return s[0]; });
  schoolsWithout.forEach(function(percentSchool) {
    var pos = _.sortedIndex(sbar, percentSchool, function(s) { return s[0]; });
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
    percentSchool[1].calculatedAdmissionsData = percentSchool[1].calculatedAdmissionsData || {};
    setter(percentSchool[1], chosenSchool, chosenPercent);
  });
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
  var images = fs.readdirSync(__dirname + "/images/");
  images.forEach(function(image) {
    var match = /(\d+)-(logo|cover)\.(png|jpg|gif)/.exec(image);
    if (match) {
      var url = conf.awsRoot + image;
      if (match[2] === "logo") {
        schools[match[1]].schoolLogo = url;
      } else if (match[2] === "cover") {
        schools[match[1]].coverPhoto = url;
      }
    }
  });

  // SAT Composites. Calculate an SAT composite for the averages for each
  // school that has them.
  var satSum = function(scores) {
    scores = _.without(scores, null);
    var sum = _.reduce(scores, function(m, n) { return m + n }, 0);
    switch (scores.length) {
      case 0: return null;
      case 1: return sum * 3;
      case 2: return sum * 1.5;
      case 3: return sum;
      default: throw new Error("More than 3 SAT scores to average.");
    }
  };
  _.each(schools, function(school) {
    school.generalAdmissionsData.SATComposite = {
      average: satSum([
        school.generalAdmissionsData.SATMath.average,
        school.generalAdmissionsData.SATReading.average,
        school.generalAdmissionsData.SATWriting.average
      ]),
      halfClassRange: {
        low: satSum([
          school.generalAdmissionsData.SATMath.halfClassRange.low,
          school.generalAdmissionsData.SATReading.halfClassRange.low,
          school.generalAdmissionsData.SATWriting.halfClassRange.low,
        ]),
        high: satSum([
          school.generalAdmissionsData.SATMath.halfClassRange.high,
          school.generalAdmissionsData.SATReading.halfClassRange.high,
          school.generalAdmissionsData.SATWriting.halfClassRange.high,
        ]),
      }
    };
  });

  // Neighbor GPA.
  assignScoresByAcceptanceRateNeighbor(schools, function(school) {
    return school.specificAdmissionsData.GPA.average;
  }, function(schoolWithout, chosen, percent) {
    schoolWithout.calculatedAdmissionsData.GPA = {
      school: chosen.name,
      acceptanceRatePercent: percent,
      scores: chosen.specificAdmissionsData.GPA
    };
  });

  // Neighbor SAT / ACT.
  _.each(["SATComposite", "SATMath", "SATReading", "SATWriting", "ACTComposite"], function(key) {
    assignScoresByAcceptanceRateNeighbor(schools, function(school) {
      return school.generalAdmissionsData[key].average;
    }, function(schoolWithout, chosen, percent) {
      schoolWithout.calculatedAdmissionsData[key] = {
        school: chosen.name,
        acceptanceRatePercent: percent,
        scores: chosen.generalAdmissionsData[key]
      }
    });
  });


  // Slugs
  var usedSlugs = {};
  _.each(schools, function(school) {
    if (school.name) {
      var name = [school.name, school.city, school.state].join(" ");
      var slug = name.toLowerCase().replace(/[^-a-z0-9]+/g, "-").replace(/-*$/, "");
      if (usedSlugs[slug]) {
        throw new Error("Duplicate slug " + slug + " " + usedSlugs[slug] + ", " + school.idNumber);
      }
      usedSlugs[slug] = school.idNumber;
      school.slug = slug;
    }
  });

  // Regions
  _.each(schools, function(school) {
    if (school.state) {
      var region = regions.region(school.state);
      school.region = region ? region.toLowerCase() : null;
    }
  });

  // Weather
  _.each(schools, function(school) {
    if (school.campusSetting) {
      var low = school.campusSetting.averageLowTempJanuary;
      var high = school.campusSetting.averageHighTempSeptember;
      var rainyDays = school.campusSetting.rainyDaysPerYear;
      if (low && high && rainyDays) {
        if (low > 45 && rainyDays < 150) {
          school.weather = "flipFlops";
        } else if (high < 80) {
          school.weather = "frozenTundra";
        } else {
          school.weather = "allSeasons";
        }
      }
    }
  });

  // Distances. Construct an object that quantifies relationships between
  // between various semantic fields, for use in filtering. The keys in the
  // distance object should accord with user profile fields, and the value
  // should be a score which we will sort to minimize.
  _.each(schools, function(school) {
    var distances = {};
    school._distances = distances;
    if (school.weather) {
      distances.weather = {
        frozenTundra: {frozenTundra: 0,   allSeasons: 0.5, flipFlops: 1  }[school.weather],
        allSeasons:   {frozenTundra: 0.5, allSeasons: 0,   flipFlops: 0.5}[school.weather],
        flipFlops:    {frozenTundra: 1,   allSeasons: 0.5, flipFlops: 0  }[school.weather]
      };
    }
    if (school.region) {
      distances.region = {
        northeast: {northeast: 0,   midwest: 0.5, south: 1,   west: 1  }[school.region],
        midwest:   {northeast: 0.5, midwest: 0,   south: 0.5, west: 0.5}[school.region],
        south:     {northeast: 1,   midwest: 0.5, south: 0,   west: 0.5}[school.region],
        west:      {northeast: 1,   midwest: 0.5, south: 0.5, west: 0  }[school.region]
      };
    }
    if (school.population) {
      var p = school.population;
      distances.size = {
        small:  p < 3000 ? 0   : p < 10000 ? 0.5 : 1,
        medium: p < 3000 ? 0.5 : p < 10000 ? 0   : 0.5,
        large:  p < 3000 ? 1   : p < 10000 ? 0.5 : 0
      };
    }
    if (school.schoolType) {
      distances.schoolType = {
        "public":  {"Private": 1, "Private for-profit": 1, "Public": 0}[school.schoolType],
        "private": {"Private": 0, "Private for-profit": 0, "Public": 1}[school.schoolType],
      };
    }
    if (school.gender) {
      distances.gender = {
        "Male"  : {"Men": 0,   "Women": 1,   "coed": 0.5}[school.gender],
        "Female": {"Men": 1,   "Women": 0,   "coed": 0.5}[school.gender],
        "coed"  : {"Men": 0.5, "Women": 0.5, "coed": 0  }[school.gender]
      };
    }
    if (school.campusSetting && school.campusSetting.environment) {
      var citySizeMap = function(sizes) {
        switch (school.campusSetting.environment) {
          case "Very large city": return sizes[0];
          case "Large city":      return sizes[1];
          case "Small city":      return sizes[2];
          case "Large town":      return sizes[3];
          case "Small town":      return sizes[4];
          case "Rural community": return sizes[5];
        }
      }
      distances.city = {
        big:    citySizeMap([0,    0,    0.33, 0.33, 0.66, 0.66, 1   ]),
        medium: citySizeMap([0.33, 0.33, 0,    0,    0.33, 0.33, 0.66]),
        small:  citySizeMap([0.66, 0.66, 0.33, 0.33, 0,    0,    0.33]),
        sticks: citySizeMap([1,    1,    0.66, 0.66, 0.33, 0.33, 0   ])
      };
    }
  });

  // Create output directory if it doesn't exist yet.
  try { fs.mkdirSync(OUTPUT_PATH) } catch (e) {}

  return Promise.map(_.values(schools), function(school) {
    return fs.writeFileAsync(
      OUTPUT_PATH + school.idNumber + ".json",
      JSON.stringify(school, null, 2)
    );
  });
};

if (require.main === module) {
  mergeAll();
}
