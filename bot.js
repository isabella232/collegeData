var _ = require('underscore');
var Scraper = require('./scraper');
var fs = require('fs');
var jsop = require('jsop');
var Pages = [];

function generateUrls(start, end) {
  var url = "";
  var schoolSubPages = [];
  var allPages = [];

  for (var i = start; i <= end; i++) {
    for (var j = 1; j < 7; j++) {
      schoolSubPages.push("http://www.collegedata.com/cs/data/college/college_pg0" + j + "_tmpl.jhtml?schoolId=");
    }
    allPages.push(_.map(_.uniq(schoolSubPages), function(link){ return link + i; }));
  }

  return allPages;
};

// start = 6 ; end = 3341 for the full collection of college data
Pages = generateUrls(6, 9);

function wizard() {
  // if the Pages array is empty, we are Done!!
  if (!Pages.length) {
    return console.log('Done!!!!');
  }

  var urlArray = Pages.pop();

  setTimeout(function(){

  })
  _.each(urlArray, function(element, index, list) {
    var schoolId = element.split('=').pop();
    if ( !fs.existsSync("data/" + schoolId + '.json') ) {  
      fs.writeFile('data/' + schoolId + '.json', JSON.stringify({idNumber: schoolId}));
    }
    var scraper = new Scraper(element, index, schoolId);  
    console.log('Colleges Left - ' + Pages.length);

    // if the error occurs we still want to create our
    // next request
    scraper.on('error', function (error) {
      console.log(error);
      wizard();
    });

    // if the request completed successfully
    // we want to store the results
    scraper.on('complete', function (listing) {

      // use fs.writefilesync here to generate a file or write directly to our mongoDB
      if (listing) {
        console.log('writing this listing: ', listing);
      }
      
      wizard();
    });
  })
};

var numberOfParallelRequests = 1;

for (var i = 0; i < numberOfParallelRequests; i++) {
  wizard();
}
