var _ = require('underscore');
var Scraper = require('./scraper');
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
Pages = generateUrls(162, 163);

function wizard() {
  // if the Pages array is empty, we are Done!!
  if (!Pages.length) {
    return console.log('Done!!!!');
  }

  var urlArray = Pages.pop();

  _.each(urlArray, function(element, index, list) {
    var schoolId = element.split('=').pop();
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

      // use fs.writefilesync here to generate a file
      if (listing) {
        console.log('writing this listing: ', listing);
      }
      
      wizard();
    });
  })
};

var numberOfParallelRequests = 5;

for (var i = 0; i < numberOfParallelRequests; i++) {
  wizard();
}
