var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var async = require('async');
var conf = require("./conf.json");
var _ = require('underscore');
var localMongoUri = conf.localMongoUri;


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

MongoClient.connect(localMongoUri, function(err, db){

  if (err){
    return console.log(err);
  }

  var calls = [];
  var schools = loadAllSchools();
  _.each(schools, function(school) {
    calls.push(function(callback) {
      db.collection('colleges').update({
        'idNumber': school.idNumber
      }, {
        $set: school
      }, function(err, res) {
        if (err) {
          return callback(err);
        }
        console.log("updated college # " + school.idNumber + " - " + school.name)
        callback(undefined, res);
      });

    });
  });

  console.log(calls.length);

  async.parallel(calls, function(err, res) {
    console.log('this happened');
    if (err) {
      return console.log(err);
    }
    console.log("Done")
    db.close()
  });
});
