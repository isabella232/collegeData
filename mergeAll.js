#!/usr/bin/env node
var _ = require("underscore");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var conf = require("./conf.json");
var regions = require("us-regions");
var nicheScores = require(__dirname + "/data/niche.json");
var linkedInData = require(__dirname + "/data/linkedin.json");
var commonAppData = require(__dirname + "/data/supplementQustions.json");

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

/*
* Helper functions for Niche Data
*/
var transformNicheScore = function(score){
     //console.log(score);
     var maxScore = 433;
     var minScore = 66;
     var range = maxScore - minScore;
     //returning a score on a scale from 0-1 with 13 possible possible otcomes
     var transformedScore = (score - minScore)/range;
     //console.log(transformedScore);
     return transformedScore;
 }

  var checkNicheProperty = function(schoolId, property) {
      var school = nicheScores[schoolId];
      var existingProperty = school["college-niche"] && school["college-niche"]["categoryStats"] && 
                             school["college-niche"]["categoryStats"][property] &&  
                             school["college-niche"]["categoryStats"][property]["category- grade"];
      return existingProperty;
  };

  var getNicheProperty = function(schoolId, property) {  
     var school = nicheScores[schoolId];
     return parseInt(school["college-niche"]["categoryStats"][property]["category- grade"]);      
  };

  var createUniqueHashTag = function(hashtags, hashtag){
   // console.log(hashtag);
    if(hashtags.indexOf(hashtag)> -1){
        var num = 0;
        var temp = hashtag;
        while(hashtags.indexOf(hashtag)> -1){
          var post = num + "";
          hashtag = temp + post;
          num++;
    } 
  }
   return "#" + hashtag.toLowerCase();
}

var filterSchoolName = function(schoolname){
  var nameWords = schoolname.split(' ');
  var index = 0;
  while(nameWords[index] === "The" || nameWords[index] === "of" || nameWords[index] === "University" 
    ||  nameWords[index] === "College" || nameWords[index] === "School"){
    index++;
  }
  return nameWords[index];


}

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
    var type = school.schoolType;
    var military = school.military;
    var historicallyBlack = school.historicallyBlack;
    if (percent) {
      var val = getter(school);
      if (val) {
        sbar.push([percent, school, type, military, historicallyBlack]);
      } else {
        schoolsWithout.push([percent, school, type, military, historicallyBlack]);
      }
    }
  });
  sbar = _.sortBy(sbar, function(s) { return s[0]; });
  schoolsWithout.forEach(function(percentSchool) {
    // limit list of potential neighbors if the schools have similar gender, type, military and HBC values
    newBar = _.filter(sbar, function(s) {
      return s[2] === percentSchool[2] && s[3] === percentSchool[3] && s[4] === percentSchool[4];
    });
    var pos = _.sortedIndex(newBar, percentSchool, function(s) { return s[0]; });
    var chosen;
    if (pos === 0) {
      chosen = newBar[0];
    } else if (pos === newBar.length - 1) {
      chosen = newBar[newBar.length - 1];
    } else if (pos === newBar.length) {
      chosen = newBar[newBar.length - 1];
    } else if (Math.abs(newBar[pos][0] - percentSchool[0]) <
     Math.abs(newBar[pos + 1][0] - percentSchool[0])) {
      chosen = newBar[pos];
    } else {
      chosen = newBar[pos + 1];
    }
    if (chosen) { 
      var chosenPercent = chosen[0];
      var chosenSchool = chosen[1];
      percentSchool[1].calculatedAdmissionsData = percentSchool[1].calculatedAdmissionsData || {};
      setter(percentSchool[1], chosenSchool, chosenPercent);
    }
  });
};

var mergeAll = function() {
  // School types
  var schoolTypes = require(__dirname + "/data/schoolTypes.json");
  var schools = loadAllSchools();
  _.each(schools, function(school) {
    school.military = false;
    school.historicallyBlack = false;
    school.partner = false;
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

  // Partner colleges
  _.each(schoolTypes.partnerColleges, function(partnerIdNumber) {
    schools[partnerIdNumber].partner = true;
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
    console.log(chosen.name, schoolWithout.calculatedAdmissionsData);
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

  // Generate Hashtag
  // We removed this from the data pipeline so we don't clobber the hashtags in our current production database.  Be Aware!!!
  // _.each(schools, function(school) {
  //   school["hashtag"] = school["idNumber"];
  // } );

    //linkedIn Data
  _.each(schools, function(school, schoolId){

    if (linkedInData[schoolId]) {
      var currentSchool = linkedInData[schoolId];
      var schoolIds = _.map(currentSchool.similarschools, function(obj) {
          return obj.id
      });
      school.similarSchools = schoolIds
    }
  });

  //Common Application Supplement Data
  _.each(commonAppData, function(commonAppSchool) {
    schools[commonAppSchool.id].specificAdmissionsData.applying.commonApplication.supplementQustions = commonAppSchool.questions;
  });

  // Niche data 
  _.each(schools, function(school, schoolId) { 

    if(nicheScores[schoolId]){
       // Fooood     
      if(checkNicheProperty(schoolId,"Campus Food") || checkNicheProperty(schoolId,"Off-Campus Dining")){
        var campusFood = checkNicheProperty(schoolId,"Campus Food") ? getNicheProperty(schoolId,"Campus Food"): getNicheProperty(schoolId,"Off-Campus Dining");
        var offCampusFood = checkNicheProperty(schoolId,"Off-Campus Dining") ? getNicheProperty(schoolId,"Off-Campus Dining") : getNicheProperty(schoolId,"Campus Food");
        var foodRatingAverage = (campusFood + offCampusFood)/2;
        var foodScore = transformNicheScore(foodRatingAverage);
        school["food"] = foodScore;
      }else{
        school["food"] = 0.5;
      }
      //Housing
      if(checkNicheProperty(schoolId,"Campus Housing") || checkNicheProperty(schoolId,"Off-Campus Housing")) {
         var campusHousing = checkNicheProperty(schoolId,"Campus Housing") ? getNicheProperty(schoolId,"Campus Housing"): getNicheProperty(schoolId,"Off-Campus Housing");
         var offCampusHousing = checkNicheProperty(schoolId,"Off-Campus Housing") ? getNicheProperty(schoolId,"Off-Campus Housing") : getNicheProperty(schoolId,"Campus Housing");
         var housingRatingAverage = (campusHousing + offCampusHousing) / 2; 
         var housingScore = transformNicheScore(housingRatingAverage)
         school["housing"] = housingScore;
      }else{
         school["housing"] = 0.5;
      }

      //Parking
      if(checkNicheProperty(schoolId,"Parking")){
        var parkingScore = transformNicheScore(getNicheProperty(schoolId,"Parking"));
        school["parking"] = parkingScore;
      }else{
        school["parking"] = 0.5;
      }

      //PartyScene
       if(checkNicheProperty(schoolId,"Party Scene")){
        var partyScore = transformNicheScore(getNicheProperty(schoolId,"Party Scene"));
        school["party"] = partyScore;
      }else{
        school["party"] = 0.5;
      }

      //Safety
       if(checkNicheProperty(schoolId,"Health & Safety")){
        var safetyScore = transformNicheScore(getNicheProperty(schoolId,"Health & Safety"));
        school["safety"] = safetyScore;
      }else{
        school["safety"] = 0.5;
      }

      //Transportation
       if(checkNicheProperty(schoolId,"Transportation")){
        var transportationScore = transformNicheScore(getNicheProperty(schoolId,"Transportation"));
        school["transportation"] = transportationScore;
      }else{
        school["transportation"] = 0.5;
      }

      //Greek Life
      if(checkNicheProperty(schoolId,"Greek Life")){
        var greekLifeScore = transformNicheScore(getNicheProperty(schoolId, "Greek Life"))
        school["fraternities"] = greekLifeScore;
      }else{
        school["fraternities"] = 0.5;
      }
   }else{
         school["food"] = 0.5;
         school["housing"] = 0.5;
         school["parking"] = 0.5;
         school["party"] = 0.5;
         school["safety"] = 0.5;
         school["transportation"] = 0.5;
         school["fraternities"] = 0.5;
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

  // Generate Hashtags
  var hashtags = [];
  _.each(schools, function(school, schoolId) {
    var hashtag;
    var mascot = school.campusSetting.sports.mascot;
    if(school.campusSetting && school.campusSetting.sports && school.campusSetting.sports.mascot){
      hashtag = mascot.split(' ')[0] === "The" ? createUniqueHashTag(hashtags, mascot.split(" ")[1]) : createUniqueHashTag(hashtags, mascot.split(" ")[0]);
    }else if(school.tuition && school.tuition.financialAid && school.tuition.financialAid.FAFSACode){
      hashtag = school.tuition.financialAid.FAFSACode;
    }else if(school.name){
      var temp = filterSchoolName(school.name);
      hashtag = createUniqueHashTag(hashtags, temp);
    }
    if(hashtag){
      hashtags.push(hashtag);
      school.hashtag = hashtag;
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
    if(!(typeof school.food === "undefined")){
      f = school.food;
      distances.food = {
        shitty:    0,
        good:      f > 0.5 ? 0 : (0.5-f),
        gourmet:   1-f
      };
    }
    if(!(typeof school.housing === "undefined")){
       h = school.housing;
       distances.housing = {
        close:     0,
        far:       (1-h)
      };
    }
    if(!(typeof school.parking === "undefined")){
       p = school.parking;
       distances.parking = {
        nocar:      0,
        car:       (1-p)
      };
    }
    if(!(typeof school.party === "undefined")){
       p = school.party;
       distances.nightLife = {
        dorm:      0,
        bigGame:   0,
        party:     1-p,
        show:      0
      };
    }
    if(!(typeof school.safety === "undefined")){
       s = school.safety;
       distances.safety = {
        Female:  1-s,
        Male:    0,
        Other:   1-s
      };
    }
    if(!(typeof school.transportation === "undefined")){
       t = school.transportation;
       distances.transportation = {
        car:     0,
        nocar:   1-t
      };
    }
    if(!(typeof school.fraternities === "undefined")){
       f = school.fraternities;
       distances.fraternities = {
        hate:       0,
        whatever:   0,
        love:       1-f
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

    distances.partner = {true: 0.5, false: 1}[school.partner];

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
