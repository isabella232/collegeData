// require underscore
var _ = require('underscore');
var jsop = require('jsop');

var similarSchoolsList = jsop('data/similar_school_list_formatted.json');
var linkedInList = jsop('data/linkedin.json');


var migrateSimilarSchools = function () {

  var schoolName = '';

  for (var elem in linkedInList) {
    console.log(process.memoryUsage());
    var schoolName = linkedInList[elem].name;

    if (similarSchoolsList[schoolName]) {
      console.log('success for ', schoolName);

      // console.log(schoolName);
      // console.log(similarSchoolsList[schoolName]);
      linkedInList[elem]['similarschools'] = similarSchoolsList[schoolName];
    }
    else {
      console.log('no similar school data');
      linkedInList[elem]['similarschools'] = [];
    }
  };

  // _.each(linkedInList, function(value, key, list){
  //   schoolName = value.name;
  //   console.log(schoolName);
  //   if (similarSchoolsList[schoolName]) {
  //     console.log('success for ', schoolName);
  //     linkedInList[key]['similarschools'] = similarSchoolsList[schoolName];
  //   } else if (similarSchoolsList[schoolName] === "Canisius College") {
  //     console.log('Canisius!!!!!!!!!!!!!!!!!');
  //     linkedInList[key]['similarschools'] = [];
  //   } else {
  //     linkedInList[key]['similarschools'] = [];
  //     console.log('no similar schools for ', schoolName);
  //   }
  // })


}

migrateSimilarSchools();