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
    if ( fs.existsSync("data/" + i + '.json') && jsop('data/' + i + '.json').pages.length < 6 ) {
      allPages.push(_.map(_.uniq(schoolSubPages), function(link){ return link + i; }));
    }
  }

  console.log(allPages);

  return allPages;
};

// start = 6 ; end = 3341 for the full collection of college data
Pages = generateUrls(6, 3341);

function wizard() {
  console.log('wizard');
  // if the Pages array is empty, we are Done!!
  if (!Pages.length) {
    return console.log('Done!!!!');
  }

  var urlArray = Pages.pop();

  _.each(urlArray, function(element, index, list) {
    var schoolId = element.split('=').pop();
    if ( !fs.existsSync("data/" + schoolId + '.json') ) {
      var data = JSON.stringify({idNumber: schoolId, pages: []});
      fs.writeFileSync('data/' + schoolId + '.json', data);
      // console.log('this school does not exist - ', schoolId);
      // wizard()
    }

    var scraper = new Scraper(element, index, schoolId);  
    console.log('Colleges Left - ' + Pages.length);

    // if the error occurs we still want to create our
    // next request
    scraper.on('error', function (error) {
      console.log("school: ", schoolId, " index - ", index, ' - ', error);
      wizard();
    });

    // if the request completed successfully
    // we go again
    scraper.on('complete', function (listing) {
      console.log('complete fired');
      setTimeout(function() { wizard(); }, 3000);
    });
  })
};

var numberOfParallelRequests = 1;

for (var i = 0; i < numberOfParallelRequests; i++) {
  wizard();
}
