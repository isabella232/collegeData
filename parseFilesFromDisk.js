var _ = require('underscore');
var fs = require('fs');
var path = require("path");
var cheerio = require('cheerio');
var Promise = require("bluebird");

var HTML_PATH = path.join(__dirname, 'raw_html');
var OUTPUT_PATH = path.join(__dirname, 'data');
var COLLEGE_ID_RANGE = [6, 3341];

var parsePageOne = function (html, schoolData) {
  var $ = cheerio.load(html);

  schoolData.name = $('.cp_left').find('h1').text();
  schoolData.citystate = $('.cp_left').find('.citystate').text().trim();
  schoolData.website = $('.onecolumntable').eq(-7).find('td > a').text();
  schoolData.schoolType = $('.onecolumntable').eq(-7).find('td').eq(-6).text();
  schoolData.coed = $('.onecolumntable').eq(-7).find('td').eq(-5).text();
  schoolData.population = $('.onecolumntable').eq(-7).find('td').eq(-4).text();
  schoolData.women = $('.onecolumntable').eq(-7).find('td').eq(-3).text();
  schoolData.men = $('.onecolumntable').eq(-7).find('td').eq(-2).text();

  schoolData.generalAdmissionsData = {
    difficulty: $('.onecolumntable').eq(-6).find('td').eq(-5).text(),
    acceptanceRate: $('.onecolumntable').eq(-6).find('td').eq(-4).text(),
    earlyAction: $('.onecolumntable').eq(-6).find('td').eq(-3).text(),
    earlyDecision: $('.onecolumntable').eq(-6).find('td').eq(-2).text(),
    regularDeadline: $('.onecolumntable').eq(-6).find('td').eq(-1).text(),
    SATMath: {
      average: $('.onecolumntable').eq(-5).find('td').eq(-4).text().split('average')[0].trim(),
      halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-4).text().split('average')[0].indexOf('Not reported') > -1 || $('.onecolumntable').eq(-5).find('td').eq(-4).text().split('average').length !== 2 ? null : $('.onecolumntable').eq(-5).find('td').eq(-4).text().split('average')[1].slice(0,8).trim()
    },
    SATReading: {
      average: $('.onecolumntable').eq(-5).find('td').eq(-3).text().split('average')[0].trim(),
      halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-3).text().split('average')[0].indexOf('Not reported') > -1 || $('.onecolumntable').eq(-5).find('td').eq(-3).text().split('average').length !== 2 ? null : $('.onecolumntable').eq(-5).find('td').eq(-3).text().split('average')[1].slice(0,8).trim()
    },
    SATWriting: {
      average: $('.onecolumntable').eq(-5).find('td').eq(-2).text().split('average')[0].trim(),
      halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-2).text().split('average')[0].indexOf('Not reported') > -1 || $('.onecolumntable').eq(-5).find('td').eq(-2).text().split('average').length !== 2 ? null : $('.onecolumntable').eq(-5).find('td').eq(-2).text().split('average')[1].slice(0,8).trim()
    },
    ACTComposite: {
      average: $('.onecolumntable').eq(-5).find('td').eq(-1).text().split('average')[0].trim(),
      halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-1).text().split('average')[0].indexOf('Not reported') > -1 || $('.onecolumntable').eq(-5).find('td').eq(-1).text().split('average').length !== 2 ? null : $('.onecolumntable').eq(-5).find('td').eq(-1).text().split('average')[1].slice(0,6).trim()
    }
  };
};
var parsePageTwo = function (html, schoolData) {
  var $ = cheerio.load(html);
  // Admissions Details Page
  schoolData.specificAdmissionsData = {};

  schoolData.specificAdmissionsData.GPA = {
    average: $('.onecolumntable').eq(-4).find('td').eq(-7).text(),
    range1: {
      lowRange: 3.75,
      highRange: 4.00,
      percentageOfFreshmen: $('.onecolumntable').eq(-4).find('td').eq(-6).text()
    },
    range2: {
      lowRange: 3.50,
      highRange: 3.74,
      percentageOfFreshmen: $('.onecolumntable').eq(-4).find('td').eq(-5).text()
    },
    range3: {
      lowRange: 3.25,
      highRange: 3.49,
      percentageOfFreshmen: $('.onecolumntable').eq(-4).find('td').eq(-4).text()
    },
    range4: {
      lowRange: 3.00,
      highRange: 3.24,
      percentageOfFreshmen: $('.onecolumntable').eq(-4).find('td').eq(-3).text()
    },
    range5: {
      lowRange: 2.50,
      highRange:2.99,
      percentageOfFreshmen: $('.onecolumntable').eq(-4).find('td').eq(-2).text()
    },
    range6: {
      lowRange: 2.00,
      highRange: 2.49,
      percentageOfFreshmen: $('.onecolumntable').eq(-4).find('td').eq(-1).text()
    }
  };

  schoolData.specificAdmissionsData.SATWriting = {
    range1: {
      lowRange: 700,
      highRange: 800,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-6).text()
    },
    range2: {
      lowRange: 600,
      highRange: 700,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-5).text()
    },
    range3: {
      lowRange: 500,
      highRange: 600,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-4).text()
    },
    range4: {
      lowRange: 400,
      highRange: 500,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-3).text()
    },
    range5: {
      lowRange: 300,
      highRange: 400,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-2).text()
    },
    range6: {
      lowRange: 200,
      highRange: 300,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-1).text()
    }
  }

  schoolData.specificAdmissionsData.SATReading = {
    range1: {
      lowRange: 700,
      highRange: 800,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-13).text()
    },
    range2: {
      lowRange: 600,
      highRange: 700,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-12).text()
    },
    range3: {
      lowRange: 500,
      highRange: 600,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-11).text()
    },
    range4: {
      lowRange: 400,
      highRange: 500,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-10).text()
    },
    range5: {
      lowRange: 300,
      highRange: 400,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-9).text()
    },
    range6: {
      lowRange: 200,
      highRange: 300,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-8).text()
    }
  }

  schoolData.specificAdmissionsData.SATMath = {
    range1: {
      lowRange: 700,
      highRange: 800,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-20).text()
    },
    range2: {
      lowRange: 600,
      highRange: 700,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-19).text()
    },
    range3: {
      lowRange: 500,
      highRange: 600,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-18).text()
    },
    range4: {
      lowRange: 400,
      highRange: 500,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-17).text()
    },
    range5: {
      lowRange: 300,
      highRange: 400,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-16).text()
    },
    range6: {
      lowRange: 200,
      highRange: 300,
      percentageOfFreshmen: $('.onecolumntable').eq(-3).find('td').eq(-15).text()
    }
  }

  schoolData.specificAdmissionsData.ACTComposite = {
    range1: {
      lowRange: 30,
      highRange: 36,
      percentageOfFreshmen: $('.onecolumntable').eq(-2).find('td').eq(-6).text()
    },
    range2: {
      lowRange: 24,
      highRange: 29,
      percentageOfFreshmen: $('.onecolumntable').eq(-2).find('td').eq(-5).text()
    },
    range3: {
      lowRange: 18,
      highRange: 23,
      percentageOfFreshmen: $('.onecolumntable').eq(-2).find('td').eq(-4).text()
    },
    range4: {
      lowRange: 12,
      highRange: 17,
      percentageOfFreshmen: $('.onecolumntable').eq(-2).find('td').eq(-3).text()
    },
    range5: {
      lowRange: 6,
      highRange: 11,
      percentageOfFreshmen: $('.onecolumntable').eq(-2).find('td').eq(-2).text()
    },
    range6: {
      lowRange: 1,
      highRange: 5,
      percentageOfFreshmen: $('.onecolumntable').eq(-2).find('td').eq(-1).text()
    }
  }

  schoolData.specificAdmissionsData.courses = {
    english: {
      requiredUnits: $('.laligntable').first().find('td').eq(-14).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-13).text()
    },
    mathematics: {
      requiredUnits: $('.laligntable').first().find('td').eq(-12).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-11).text()
    },
    science: {
      requiredUnits: $('.laligntable').first().find('td').eq(-10).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-9).text()
    },
    foreignLanguage: {
      requiredUnits: $('.laligntable').first().find('td').eq(-8).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-7).text()
    },
    socialStudies: {
      requiredUnits: $('.laligntable').first().find('td').eq(-6).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-5).text()
    },
    history: {
      requiredUnits: $('.laligntable').first().find('td').eq(-4).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-3).text()
    },
    electives: {
      requiredUnits: $('.laligntable').first().find('td').eq(-2).text(),
      recommendedUnits: $('.laligntable').first().find('td').eq(-1).text()
    }
  };

  schoolData.specificAdmissionsData.testing = {
    SATorACT: {
      required: $('.laligntable').last().find('td').eq(-14).text().indexOf('Required') > -1 ? true : false,
      scoresMustBeReceivedBy: $('.laligntable').last().find('td').eq(-13).text()
    }
  }

  schoolData.specificAdmissionsData.applying = {
    address: $('.onecolumntable').eq(-10).find('td').eq(-5).text() + " " + $('.onecolumntable').eq(-10).find('td').eq(-4).text(),
    phone: $('.onecolumntable').eq(-10).find('td').eq(-3).text(),
    fax: $('.onecolumntable').eq(-10).find('td').eq(-2).text(),
    email: $('#section6').find('table').first().find('td').last().text(), 
    applicationFee: $('.onecolumntable').eq(-9).find('td').eq(-7).text(),
    feeWaiverAvailable: $('.onecolumntable').eq(-9).find('td').eq(-6).text(),
    deferOption: $('.onecolumntable').eq(-9).find('td').eq(-2).text(),
    earlyDecision: {
      offered: $('.onecolumntable').eq(-8).find('td').eq(-6).text(),
      deadline: $('.onecolumntable').eq(-8).find('td').eq(-5).text(),
      notification: $('.onecolumntable').eq(-8).find('td').eq(-4).text()
    },
    earlyAction: {
      offered: $('.onecolumntable').eq(-8).find('td').eq(-3).text(),
      deadline: $('.onecolumntable').eq(-8).find('td').eq(-2).text(),
      notification: $('.onecolumntable').eq(-8).find('td').eq(-1).text()
    },
    commonApplication: {
      accepted: $('.onecolumntable').eq(-7).find('td').eq(-3).text().indexOf('Accepted') > -1 ? true : false,
      supplementRequired: $('.onecolumntable').eq(-7).find('td').eq(-3).text().indexOf('supp') > -1 ? true : false
    },
    universalApp: $('.onecolumntable').eq(-7).find('td').eq(-2).text().indexOf('Accepted') > -1 ? true : false,
    requirements: {
      interview: $('.onecolumntable').eq(-6).find('td').eq(-5).text(),
      personalStatement: $('.onecolumntable').eq(-6).find('td').eq(-4).text(),
      numberOfRecLettersRequired: parseInt($('.onecolumntable').eq(-6).find('td').eq(-3).text()),
      other: $('.onecolumntable').eq(-6).find('td').eq(-2).text(),
      financialNeed: $('.onecolumntable').eq(-6).find('td').eq(-1).text()
    }
  }
};

var parsePageThree = function(html, schoolData) {
  var $ = cheerio.load(html);
  schoolData.tuition = schoolData.tuition || {};

  var totalCostArray = $('.onecolumntable').eq(-10).find('td').eq(-6).html().split("<br>");

  if (totalCostArray.length > 1) {
    schoolData.tuition.costOfAttendance = {
        totalCost: {
          inStateTotal: totalCostArray[0].split(':')[1].trim(),
          outOfStateTotal: totalCostArray[1].split(':')[1].trim()
        },
        inStateTuition: $('.onecolumntable').eq(-10).find('td').eq(-5).html().split("<br>")[0].split(':')[1].trim(),
        outOfStateTuition: $('.onecolumntable').eq(-10).find('td').eq(-5).html().split("<br>")[1].split(':')[1].trim(),
        roomAndBoard: $('.onecolumntable').eq(-10).find('td').eq(-4).html(),
        booksAndSupplies: $('.onecolumntable').eq(-10).find('td').eq(-3).html(),
        otherExpenses: $('.onecolumntable').eq(-10).find('td').eq(-2).html(),
        averageGraduateDebt: $('.onecolumntable').eq(-5).find('td').eq(-4).html().trim()
    }
  }

  if (totalCostArray.length === 1) {
    schoolData.tuition.tuitionAndFees = {
      totalCost: totalCostArray[0],
      tuition: $('.onecolumntable').eq(-10).find('td').eq(-5).html(),
      roomAndBoard: $('.onecolumntable').eq(-10).find('td').eq(-4).html(),
      booksAndSupplies: $('.onecolumntable').eq(-10).find('td').eq(-3).html(),
      averageGraduateDebt: $('.onecolumntable').eq(-5).find('td').eq(-4).html().trim()
    }
  }

  var newPriceCalculator = $("#section10").find("table").eq(-3).find("a")[1];
  var website = $('#section10').find('table').eq(-3).find('a')[0];
  schoolData.tuition = {
    financialAid: {
      emailContact: $('#section10').find('table').eq(-3).find('td').eq(-3).text().trim(),
      website: website ? website.attribs.href : null,
      netPriceCalculator: newPriceCalculator ? newPriceCalculator.attribs.href : null,
      applicationDeadline: $('.onecolumntable').eq(-8).find('td').eq(-3).text(),
      awardDate: $('.onecolumntable').eq(-8).find('td').eq(-2).text(),
      FAFSACode: $('#section10').find('table').eq(-1).find('tr').last().html().trim().split(' ').pop().slice(0,6),
      freshmen: {
        applicants: $('.onecolumntable').eq(-7).find('td').eq(-10).text(),
        foundToHaveNeed: $('.onecolumntable').eq(-7).find('td').eq(-9).text(),
        receivedAid: $('.onecolumntable').eq(-7).find('td').eq(-8).text(),
        needFullyMet: $('.onecolumntable').eq(-7).find('td').eq(-7).text(),
        averagePercentOfNeedMet: $('.onecolumntable').eq(-7).find('td').eq(-6).text(),
        averageAward: $('.onecolumntable').eq(-7).find('td').eq(-5).text(),
        meritBasedGift: $('.onecolumntable').eq(-7).find('td').eq(-1).text()
      },
      allUndergraduates: {
        applicants: $('.onecolumntable').eq(-6).find('td').eq(-10).text(),
        foundToHaveNeed: $('.onecolumntable').eq(-6).find('td').eq(-9).text(),
        receivedAid: $('.onecolumntable').eq(-6).find('td').eq(-8).text(),
        needFullyMet: $('.onecolumntable').eq(-6).find('td').eq(-7).text(),
        averagePercentOfNeedMet: $('.onecolumntable').eq(-6).find('td').eq(-6).text(),
        averageAward: $('.onecolumntable').eq(-6).find('td').eq(-5).text(),
        meritBasedGift: $('.onecolumntable').eq(-6).find('td').eq(-1).text()
      },
      borrowing: {
        percentOfGraduatesWithLoans: $('.onecolumntable').eq(-5).find('td').eq(-5).text(),
        averageIndebtednessOfGraduates: $('.onecolumntable').eq(-5).find('td').eq(-4).text()
      }
    }
  }
};


var parsePageFour = function(html, schoolData) {
  var $ = cheerio.load(html);
  schoolData.undergraduateMajors = _.uniq($('.collist').find('li').map(function(i, el) { return $(this).text().trim() }).get());
  schoolData.mostPopularMajors = $('.onecolumntable').eq(-11).find('td').eq(-5).text().split(',').map(function(el, i) { return el.trim() });
  schoolData.studyAbroad = $('.onecolumntable').eq(-11).find('td').eq(-2).text().indexOf('Offered') > -1 ? true : false;
  schoolData.IBCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-3).text();
  schoolData.APCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-2).text();
  schoolData.sophomoreStanding = $('.onecolumntable').eq(-8).find('td').eq(-1).text();
};

var parsePageFive = function(html, schoolData) {
  var $ = cheerio.load(html);
  schoolData.campusSetting = {
    localPopulation: $('.onecolumntable').eq(-10).find('td').eq(-4).text(),
    environment: $('.onecolumntable').eq(-10).find('td').eq(-2).text(),
    nearestMetropolitanArea: $('.onecolumntable').eq(-10).find('td').eq(-3).text(),
    averageLowTempJanuary: parseInt($('.onecolumntable').eq(-9).find('td').eq(-2).text().split(',')[0]),
    averageHighTempSeptember: parseInt($('.onecolumntable').eq(-9).find('td').eq(-2).text().split(',')[1]),
    rainyDaysPerYear: parseInt($('.onecolumntable').eq(-9).find('td').eq(-1).text()),
    linkToCampusMap: $('.onecolumntable').eq(-8).find('td').find('a').length > 0 ? $('.onecolumntable').eq(-8).find('td').find('a')[0].href : null,
    nearestAirport: $('.onecolumntable').eq(-8).find('td').eq(-3).text(),
    nearestBusStation: $('.onecolumntable').eq(-8).find('td').eq(-2).text(),
    nearestTrainStation: $('.onecolumntable').eq(-8).find('td').eq(-1).text(),
    housing: {
      types: $('.onecolumntable').eq(-7).find('td').eq(-6).text().split(','),
      freshmenGuarantee: $('.onecolumntable').eq(-7).find('td').eq(-3).text(),
      studentsInCollegeHousing: $('.onecolumntable').eq(-7).find('td').eq(-5).text(),
      percentOfStudentsCommuting: $('.onecolumntable').eq(-7).find('td').eq(-2).text(),
      requirements: $('.onecolumntable').eq(-7).find('td').eq(-4).text() 
    },
    sports: {
      athleticConferences: $('.onecolumntable').eq(-4).find('td').eq(-3).text(),
      mascot: $('.onecolumntable').eq(-4).find('td').eq(-2).text(),
      varsitySportsOffered: {
        mens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-2).text().indexOf('x') > -1 }).map(function (i, el) { return $(this).text() }).get(),
        womens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-4).text().indexOf('x') > -1 }).map(function (i, el) { return $(this).text() }).get()
      },
      sportsScholarshipsGiven: {
        mens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-1).text().indexOf('x') > -1 }).map(function (i, el) { return $(this).text() }).get(),
        womens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-3).text().indexOf('x') > -1 }).map(function (i, el) { return $(this).text() }).get()
      }
    },
    popularActivitiesAndOrganizations: $('.onecolumntable').eq(-1).find('td').eq(-4).text().split(','),
    greekLife: {
      percentofWomenInSororities: parseInt($('.onecolumntable').eq(-1).find('td').eq(-3).text()),
      percentOfMenInFraternities: parseInt($('.onecolumntable').eq(-1).find('td').eq(-2).text())
    } ,
    ROTC: $('.onecolumntable').eq(-1).find('td').eq(-1).text()
  }
}

var parsePageSix = function(html, schoolData) {
  var $ = cheerio.load(html);
  schoolData.demographics = $('.onecolumntable').eq(-3).find('td').eq(-4).html().indexOf('Not reported') === -1 ? $('.onecolumntable').eq(-3).find('td').eq(-4).html().split('<br>').map(function(el, i) { return { race : el.split('%')[1].trim(), percentage: parseFloat(el) }}) : null;
  schoolData.percentInternationalStudents = $('.onecolumntable').eq(-3).find('td').eq(-3).text().split('%')[0];
  schoolData.averageStudentAge = $('.onecolumntable').eq(-3).find('td').eq(-2).text();
  schoolData.retention = {
    percentOfFirstYearStudentsReturning: $('.onecolumntable').eq(-2).find('td').eq(-4).text(),
    percentOfGraduatesWithin4Years: $('.onecolumntable').eq(-2).find('td').eq(-3).text().trim(),
    percentOfGraduatesWithin5Years: $('.onecolumntable').eq(-2).find('td').eq(-2).text().trim(),
    percentOfGraduatesWithin6Years: $('.onecolumntable').eq(-2).find('td').eq(-1).text().trim()
  }
};

var slugify = function(url) {
  return url.replace(/[^-a-zA-Z0-9_\.]/g, '-');
};
var urlTemplate = _.template(
  "http://www.collegedata.com/cs/data/college/college_pg0<%= page %>_tmpl.jhtml?schoolId=<%= idNumber %>"
);
var rawHtmlFilename = function(idNumber, page) {
  return path.join(HTML_PATH, slugify(urlTemplate({idNumber: idNumber, page: page})));
};



var parseAll = function(concurrency) {
  var idRange = _.range(COLLEGE_ID_RANGE[0], COLLEGE_ID_RANGE[1] + 1);
  var pageRange = [1,2,3,4,5,6];
  var pageParsers = {
    1: parsePageOne, 2: parsePageTwo, 3: parsePageThree,
    4: parsePageFour, 5: parsePageFive, 6: parsePageSix
  };

  return Promise.map(idRange, function(idNumber) {
    return Promise.resolve().then(function() {
      // Check that the files exist.
      return Promise.map(pageRange, function(page) {
        return new Promise(function(resolve, reject) {
          var filename = rawHtmlFilename(idNumber, page);
          fs.exists(filename, function(exists) {
            if (exists) {
              resolve();
            } else {
              var err = new Error(idNumber + " is missing page " + page);
              err.ok = true;
              err.log = true;
              reject(err);
            }
          });
        });
      })
    }).then(function() {
      // Files exist!  Parse 'em.
      var schoolData = {idNumber: idNumber};
      return Promise.each(pageRange, function(page) {
        var filename = rawHtmlFilename(idNumber, page);
        return new Promise(function(resolve, reject) {
          fs.readFile(filename, {encoding: 'utf-8'}, function(err, html) {
            if (html.indexOf("You requested a College Profile page that does not exist") != -1) {
              var err = new Error("College " + idNumber + " has no data.");
              err.ok = true;
              err.log = true;
              reject(err);
            }
            if (err) { reject(err); }
            try {
              pageParsers[page](html, schoolData);
            } catch (e) {
              return reject(e);
            }
            resolve();
          });
        });
      }).then(function() {
        // All parsers have now run on the schoolData.
        return schoolData;
      }).catch(function(err) {
        // an "ok" error is one that we don't need to stop the parser for (e.g.
        // the college profile doesn't exist or we don't have all the pages
        // yet).
        if (err.ok) {
         err.log && console.log(err.message);
        } else {
          throw err;
        }
      });
    }).then(function(schoolData) {
      if (schoolData) {
        return new Promise(function(resolve, reject) {
          var out = path.join(OUTPUT_PATH, idNumber + ".json");
          fs.writeFile(out, JSON.stringify(schoolData, null, 2), function(err) {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      }
    }).catch(function(err) {
      if (err.ok) {
        err.log && console.log(err.message);
      } else {
        console.log("school idNumber: ", idNumber);
        throw err;
      }
    });
  }, {concurrency: concurrency});
};
 
if (require.main === module) {
  console.log('-------------------------------------------------------------');
  console.log('processing...');
  console.log('-------------------------------------------------------------');
  parseAll(16).then(function() {
    console.log('-------------------------------------------------------------');
    console.log('finished.');
    console.log('-------------------------------------------------------------');
  }).catch(function(err) {
    throw err;
  });
}

