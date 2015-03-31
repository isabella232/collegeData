var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var jsop = require('jsop');
var schoolData = {};
var google = require('google');
var fs = require('fs');
var start = 3186;

// google.resultsPerPage = 20;

var getImages = function(start, end) {
  var schoolLogo, logoLocation, coverPhoto;

  if ( start === end ) {
    console.log('done');
    return
  };

  if ( fs.existsSync("data/" + start + '.json') ) {

    schoolData = jsop("data/" + start + '.json');

    if (schoolData.linkedinLink) {
      request({
        uri: schoolData.linkedinLink
      }, function(err, res, body) {
        var $ = cheerio.load(body);
        logoLocation = body.search('("logoSrc")');

        if (logoLocation) {
          schoolLogo = body.substr(logoLocation, 109).split(',')[0].split('"')[3];
        } else {
          schoolLogo = null
        }

        coverPhoto = $('#college-cover-photo').find('.cover-photo').attr('data-li-src');

        schoolData.coverPhoto = coverPhoto;
        schoolData.schoolLogo = schoolLogo;

        console.log("#", start, " - ", schoolData.name);
        console.log(coverPhoto);
        console.log(schoolLogo);

      });
    } else {
      console.log('no linkedin link for # ', start);
    } 
  } else {
      console.log('no file for # ', start)
  };

};

// function generateUrls(start, end) {
//   var url = "";
//   var googleQuery;
//   var linkedinLink = "";

//   console.log(start);

//   if ( fs.existsSync("data/" + start + '.json') ) {  
//     schoolData = jsop("data/" + start + '.json');

//     googleQuery = "'" + schoolData.name + "'" + " && 'linkedin.com/edu/'" ;

//     console.log(googleQuery);

//     google(googleQuery, function(err, next, links) {
//       if (err) console.error("index - ", err);

//       if (_.find(links, function(obj){ return obj.link.indexOf('linkedin.com/edu') > -1 && obj.title.indexOf(schoolData.name.slice(0,5)) > -1; })) {
//         linkedinLink = _.find(links, function(obj){ return obj.link.indexOf('linkedin.com/edu') > -1 && obj.title.indexOf(schoolData.name.slice(0,5)) > -1; }).link;
//         schoolData.linkedinLink = linkedinLink;
//         console.log(linkedinLink);
//       } else {
//         schoolData.linkedinLink = undefined;
//         console.log(undefined);
//       }
//     });

//     if (start < end) {
//       start = start + 1;
//     } else {
//       // getImages(googleSearchPages);
//       console.log('script is done running');
//       return
//     };
//   } else {
//     console.log('else block')
//     start++;
//   }

// };

// start = 6 ; end = 3341 for the full collection of college data
setInterval(function(){
  getImages(start, 3341);
  start++
}, 5000);


