#!/usr/bin/env node
var _ = require('underscore');
var fs = require('fs');
var path = require("path");
var cheerio = require('cheerio');
var Promise = require("bluebird");
var conf = require("./conf.json");

var converters = require('./converters');
var c = converters;

var HTML_PATH = path.join(__dirname, 'raw_html');
var OUTPUT_PATH = path.join(__dirname, 'data');

var parsePageOne = function (html, schoolData) {
  var $ = cheerio.load(html);

  schoolData.name = c.stringy($('.cp_left').find('h1').text());
  var citystate = c.cityState($('.cp_left').find('.citystate').text());
  schoolData.city = citystate ? citystate.city : null;
  schoolData.state = citystate ? citystate.state : null;
  schoolData.country = citystate && citystate.state === "ON" ? "Canada" : "United States";
  schoolData.website = c.validWebsite($('.onecolumntable').eq(-7).find('td > a').text());
  schoolData.schoolType = c.stringy($('.onecolumntable').eq(-7).find('td').eq(-6).text());
  var coed = $('.onecolumntable').eq(-7).find('td').eq(-5).text().trim();
  schoolData.gender = {'Yes': 'coed', 'No, men only': 'Men', 'No, women only': 'Women'}[coed] || null;
  schoolData.population = c.numbery($('.onecolumntable').eq(-7).find('td').eq(-4).text());
  schoolData.women = c.totalAndPercent($('.onecolumntable').eq(-7).find('td').eq(-3).text());
  schoolData.men = c.totalAndPercent($('.onecolumntable').eq(-7).find('td').eq(-2).text());

  var scoreHalfClassRange = function(col) {
    var text = $(".onecolumntable").eq(-5).find("td").eq(col).text();
    var range;
    var parts = text.split('average');
    var average = c.numbery(parts[0]);
    if (parts.length !== 2 || parts[1].indexOf('Not reported') !== -1) {
      range = {low: null, high: null};
    } else {
      range = c.dashRange(parts[1].slice(0,8));
    }
    return {average: average, halfClassRange: range};
  }

  schoolData.generalAdmissionsData = {
    difficulty: c.stringy($('.onecolumntable').eq(-6).find('td').eq(-5).text()),
    acceptanceRate: c.totalAndPercent($('.onecolumntable').eq(-6).find('td').eq(-4).text()),
    earlyAction: c.booly($('.onecolumntable').eq(-6).find('td').eq(-3).text()),
    earlyDecision: c.booly($('.onecolumntable').eq(-6).find('td').eq(-2).text()),
    regularDeadline: c.stringy($('.onecolumntable').eq(-6).find('td').eq(-1).text()),
    SATMath: scoreHalfClassRange(-4),
    SATReading: scoreHalfClassRange(-3),
    SATWriting: scoreHalfClassRange(-2),
    ACTComposite: scoreHalfClassRange(-1)
  };
};
var parsePageTwo = function (html, schoolData) {
  var $ = cheerio.load(html);
  // Admissions Details Page
  schoolData.specificAdmissionsData = {};

  schoolData.specificAdmissionsData.GPA = {
    average: c.numbery($('.onecolumntable').eq(-4).find('td').eq(-7).text()),
    range1: {
      lowRange: 3.75,
      highRange: 4.00,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-4).find('td').eq(-6).text())
    },
    range2: {
      lowRange: 3.50,
      highRange: 3.74,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-4).find('td').eq(-5).text())
    },
    range3: {
      lowRange: 3.25,
      highRange: 3.49,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-4).find('td').eq(-4).text())
    },
    range4: {
      lowRange: 3.00,
      highRange: 3.24,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-4).find('td').eq(-3).text())
    },
    range5: {
      lowRange: 2.50,
      highRange:2.99,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-4).find('td').eq(-2).text())
    },
    range6: {
      lowRange: 2.00,
      highRange: 2.49,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-4).find('td').eq(-1).text())
    }
  };

  schoolData.specificAdmissionsData.SATWriting = {
    range1: {
      lowRange: 700,
      highRange: 800,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-6).text())
    },
    range2: {
      lowRange: 600,
      highRange: 700,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-5).text())
    },
    range3: {
      lowRange: 500,
      highRange: 600,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-4).text())
    },
    range4: {
      lowRange: 400,
      highRange: 500,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-3).text())
    },
    range5: {
      lowRange: 300,
      highRange: 400,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-2).text())
    },
    range6: {
      lowRange: 200,
      highRange: 300,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-1).text())
    }
  }

  schoolData.specificAdmissionsData.SATReading = {
    range1: {
      lowRange: 700,
      highRange: 800,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-13).text())
    },
    range2: {
      lowRange: 600,
      highRange: 700,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-12).text())
    },
    range3: {
      lowRange: 500,
      highRange: 600,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-11).text())
    },
    range4: {
      lowRange: 400,
      highRange: 500,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-10).text())
    },
    range5: {
      lowRange: 300,
      highRange: 400,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-9).text())
    },
    range6: {
      lowRange: 200,
      highRange: 300,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-8).text())
    }
  }

  schoolData.specificAdmissionsData.SATMath = {
    range1: {
      lowRange: 700,
      highRange: 800,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-20).text())
    },
    range2: {
      lowRange: 600,
      highRange: 700,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-19).text())
    },
    range3: {
      lowRange: 500,
      highRange: 600,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-18).text())
    },
    range4: {
      lowRange: 400,
      highRange: 500,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-17).text())
    },
    range5: {
      lowRange: 300,
      highRange: 400,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-16).text())
    },
    range6: {
      lowRange: 200,
      highRange: 300,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-3).find('td').eq(-15).text())
    }
  }

  schoolData.specificAdmissionsData.ACTComposite = {
    range1: {
      lowRange: 30,
      highRange: 36,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-6).text())
    },
    range2: {
      lowRange: 24,
      highRange: 29,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-5).text())
    },
    range3: {
      lowRange: 18,
      highRange: 23,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-4).text())
    },
    range4: {
      lowRange: 12,
      highRange: 17,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-3).text())
    },
    range5: {
      lowRange: 6,
      highRange: 11,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-2).text())
    },
    range6: {
      lowRange: 1,
      highRange: 5,
      percentageOfFreshmen: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-1).text())
    }
  }

  schoolData.specificAdmissionsData.courses = {
    english: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-14).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-13).text())
    },
    mathematics: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-12).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-11).text())
    },
    science: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-10).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-9).text())
    },
    foreignLanguage: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-8).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-7).text())
    },
    socialStudies: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-6).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-5).text())
    },
    history: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-4).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-3).text())
    },
    electives: {
      requiredUnits: c.numbery($('.laligntable').first().find('td').eq(-2).text()),
      recommendedUnits: c.numbery($('.laligntable').first().find('td').eq(-1).text())
    }
  };

  schoolData.specificAdmissionsData.testing = {
    SATorACT: {
      required: c.booly($('.laligntable').last().find('td').eq(-14).text().indexOf('Required') > -1 ? true : false),
      scoresMustBeReceivedBy: c.stringy($('.laligntable').last().find('td').eq(-13).text())
    }
  }

  schoolData.specificAdmissionsData.applying = {
    address: c.stringy($('.onecolumntable').eq(-10).find('td').eq(-5).text() + " " + $('.onecolumntable').eq(-10).find('td').eq(-4).text()),
    phone: c.stringy($('.onecolumntable').eq(-10).find('td').eq(-3).text()),
    fax: c.stringy($('.onecolumntable').eq(-10).find('td').eq(-2).text()),
    email: c.validEmail($('#section6').find('table').first().find('td').last().text()), 
    applicationFee: c.stringy($('.onecolumntable').eq(-9).find('td').eq(-7).text()),
    feeWaiverAvailable: c.stringy($('.onecolumntable').eq(-9).find('td').eq(-6).text()),
    deferOption: c.stringy($('.onecolumntable').eq(-9).find('td').eq(-2).text()),
    earlyDecision: {
      offered: c.booly($('.onecolumntable').eq(-8).find('td').eq(-6).text()),
      deadline: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-5).text()),
      notification: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-4).text())
    },
    earlyAction: {
      offered: c.booly($('.onecolumntable').eq(-8).find('td').eq(-3).text()),
      deadline: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-2).text()),
      notification: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-1).text())
    },
    commonApplication: {
      accepted: c.booly($('.onecolumntable').eq(-7).find('td').eq(-3).text().indexOf('Accepted') > -1 ? true : false),
      supplementRequired: c.booly($('.onecolumntable').eq(-7).find('td').eq(-3).text().indexOf('supp') > -1 ? true : false)
    },
    universalApp: c.booly($('.onecolumntable').eq(-7).find('td').eq(-2).text().indexOf('Accepted') > -1 ? true : false),
    requirements: {
      interview: c.stringy($('.onecolumntable').eq(-6).find('td').eq(-5).text()),
      personalStatement: c.stringy($('.onecolumntable').eq(-6).find('td').eq(-4).text()),
      numberOfRecLettersRequired: c.numbery($('.onecolumntable').eq(-6).find('td').eq(-3).text()),
      other: c.stringy($('.onecolumntable').eq(-6).find('td').eq(-2).text()),
      financialNeed: c.stringy($('.onecolumntable').eq(-6).find('td').eq(-1).text())
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
          inState: c.numbery(totalCostArray[0].split(':')[1]),
          outOfState: c.numbery(totalCostArray[1].split(':')[1])
        },
        tuition: {
          inState: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-5).html().split("<br>")[0].split(':')[1]),
          outOfState: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-5).html().split("<br>")[1].split(':')[1]),
        },
        roomAndBoard: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-4).html()),
        booksAndSupplies: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-3).html()),
        otherExpenses: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-2).html()),
        averageGraduateDebt: c.numbery($('.onecolumntable').eq(-5).find('td').eq(-4).html())
    }
  }

  if (totalCostArray.length === 1) {
    schoolData.tuition.costOfAttendance = {
      totalCost: {
        general: c.numbery(totalCostArray[0]),
      },
      tuition: {
        general: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-5).html()),
      },
      roomAndBoard: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-4).html()),
      booksAndSupplies: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-3).html()),
      otherExpenses: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-2).html()),
      averageGraduateDebt: c.numbery($('.onecolumntable').eq(-5).find('td').eq(-4).html())
    }
  }

  var newPriceCalculator = $("#section10").find("table").eq(-3).find("a")[1];
  var websiteEl = $('#section10').find('table').eq(-3).find('a')[0];
  var website = websiteEl ? websiteEl.attribs.href : null;
  var email = $('#section10').find('table').eq(-3).find('td').eq(-3).text().trim();
  // special cases for bad incoming data.
  if (email === "aacosta.edu") {
    email = "";
  }
  if (email.substring(email.length - 1, email.length) === ".") {
    email = email.substring(0, email.length - 1);
  }
  if (website === "http://www/nysid.edu/netpricecalculator") {
    website = "http://www.nysid.edu/netpricecalculator";
  }

  var fafsaText = $('#section10').find('table').eq(-1).find('tr').last().text();
  var match = /FAFSA\s+Code\s+is\s+(\d+)/.exec(fafsaText);
  var fafsaCode = match ? c.stringy(match[1]) : null;
  var meritBasedGift = function(val) {
    val = c.stringy(val);
    var isnull = val === null;
    var totalMatch = !isnull && /^([\d,]+)/.exec(val);
    var percentMatch = !isnull && /\(([\d\.]+)%\)/.exec(val)
    var averageMatch = !isnull && /\$([\d\.\,]+)$/.exec(val)
    return {
      total: totalMatch ? c.numbery(totalMatch[1]) : null,
      percent: percentMatch ? c.numbery(percentMatch[1]) : null,
      averageAward: averageMatch ? c.numbery(averageMatch[1]) : null
    }
  }

  schoolData.tuition.financialAid = {
    emailContact: c.validEmail(email),
    website: c.validWebsite(website),
    netPriceCalculator: c.validWebsite(newPriceCalculator ? newPriceCalculator.attribs.href : null),
    applicationDeadline: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-3).text()),
    awardDate: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-2).text()),
    FAFSACode: fafsaCode,

    freshmen: {
      applicants: c.totalAndPercent($('.onecolumntable').eq(-7).find('td').eq(-10).text()),
      foundToHaveNeed: c.totalAndPercent($('.onecolumntable').eq(-7).find('td').eq(-9).text()),
      receivedAid: c.totalAndPercent($('.onecolumntable').eq(-7).find('td').eq(-8).text()),
      needFullyMet: c.totalAndPercent($('.onecolumntable').eq(-7).find('td').eq(-7).text()),
      averagePercentOfNeedMet: c.percenty($('.onecolumntable').eq(-7).find('td').eq(-6).text()),
      averageaward: c.numbery($('.onecolumntable').eq(-7).find('td').eq(-5).text()),
      meritBasedGift: meritBasedGift($('.onecolumntable').eq(-7).find('td').eq(-1).text())
    },
    allUndergraduates: {
      applicants: c.totalAndPercent($('.onecolumntable').eq(-6).find('td').eq(-10).text()),
      foundToHaveNeed: c.totalAndPercent($('.onecolumntable').eq(-6).find('td').eq(-9).text()),
      receivedAid: c.totalAndPercent($('.onecolumntable').eq(-6).find('td').eq(-8).text()),
      needFullyMet: c.totalAndPercent($('.onecolumntable').eq(-6).find('td').eq(-7).text()),
      averagePercentOfNeedMet: c.percenty($('.onecolumntable').eq(-6).find('td').eq(-6).text()),
      averageAward: c.numbery($('.onecolumntable').eq(-6).find('td').eq(-5).text()),
      meritBasedGift: meritBasedGift($('.onecolumntable').eq(-6).find('td').eq(-1).text())
    },
    borrowing: {
      percentOfGraduatesWithLoans: c.percenty($('.onecolumntable').eq(-5).find('td').eq(-5).text()),
      averageIndebtednessOfGraduates: c.numbery($('.onecolumntable').eq(-5).find('td').eq(-4).text())
    }
  }
};


var parsePageFour = function(html, schoolData) {
  var $ = cheerio.load(html);
  schoolData.undergraduateMajors = _.uniq($('.collist').find('li').map(function(i, el) {
    return c.stringy($(this).text())
  }).get());
  schoolData.mostPopularMajors = $('.onecolumntable').eq(-11).find('td').eq(-5).text().split(',').map(function(el, i) {
    return c.stringy(el);
  });
  schoolData.studyAbroad = $('.onecolumntable').eq(-11).find('td').eq(-2).text().indexOf('Offered') > -1 ? true : false;
  schoolData.IBCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-3).text();
  schoolData.APCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-2).text();
  schoolData.sophomoreStanding = $('.onecolumntable').eq(-8).find('td').eq(-1).text();
};

var parsePageFive = function(html, schoolData) {
  var $ = cheerio.load(html);
  schoolData.campusSetting = {
    localPopulation: c.numbery($('.onecolumntable').eq(-10).find('td').eq(-4).text()),
    environment: c.stringy($('.onecolumntable').eq(-10).find('td').eq(-2).text()),
    nearestMetropolitanArea: c.stringy($('.onecolumntable').eq(-10).find('td').eq(-3).text()),
    averageLowTempJanuary: c.numbery($('.onecolumntable').eq(-9).find('td').eq(-2).text().split(',')[0]),
    averageHighTempSeptember: c.numbery($('.onecolumntable').eq(-9).find('td').eq(-2).text().split(',')[1]),
    rainyDaysPerYear: c.numbery($('.onecolumntable').eq(-9).find('td').eq(-1).text()),
    linkToCampusMap: c.validWebsite($('.onecolumntable').eq(-8).find('td').find('a').length > 0 ? $('.onecolumntable').eq(-8).find('td').find('a')[0].href : null),
    nearestAirport: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-3).text()),
    nearestBusStation: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-2).text()),
    nearestTrainStation: c.stringy($('.onecolumntable').eq(-8).find('td').eq(-1).text()),
    housing: {
      types: _.map($('.onecolumntable').eq(-7).find('td').eq(-6).text().split(','), c.stringy),
      freshmenGuarantee: c.stringy($('.onecolumntable').eq(-7).find('td').eq(-3).text()),
      studentsInCollegeHousing: c.stringy($('.onecolumntable').eq(-7).find('td').eq(-5).text()),
      percentOfStudentsCommuting: c.percenty($('.onecolumntable').eq(-7).find('td').eq(-2).text()),
      requirements: c.stringy($('.onecolumntable').eq(-7).find('td').eq(-4).text()) 
    },
    sports: {
      athleticConferences: c.stringy($('.onecolumntable').eq(-4).find('td').eq(-3).text()),
      mascot: c.stringy($('.onecolumntable').eq(-4).find('td').eq(-2).text()),
      varsitySportsOffered: {
        mens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-2).text().indexOf('x') > -1 }).map(function (i, el) { return c.stringy($(this).text()) }).get(),
        womens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-4).text().indexOf('x') > -1 }).map(function (i, el) { return c.stringy($(this).text()) }).get()
      },
      sportsScholarshipsGiven: {
        mens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-1).text().indexOf('x') > -1 }).map(function (i, el) { return c.stringy($(this).text()) }).get(),
        womens: $('div #section24').find('table').eq(-3).find('th').filter(function(i, el){ return $(this).siblings().eq(-3).text().indexOf('x') > -1 }).map(function (i, el) { return c.stringy($(this).text()) }).get()
      }
    },
    popularActivitiesAndOrganizations: _.map($('.onecolumntable').eq(-1).find('td').eq(-4).text().split(','), c.stringy),
    greekLife: {
      percentofWomenInSororities: c.numbery($('.onecolumntable').eq(-1).find('td').eq(-3).text()),
      percentOfMenInFraternities: c.numbery($('.onecolumntable').eq(-1).find('td').eq(-2).text())
    } ,
    ROTC: c.stringy($('.onecolumntable').eq(-1).find('td').eq(-1).text())
  }
}

var parsePageSix = function(html, schoolData) {
  var $ = cheerio.load(html);
  var raceHtml = $('.onecolumntable').eq(-3).find('td').eq(-4).html();
  if (raceHtml.indexOf('Not reported') === -1) {
    schoolData.demographics = raceHtml.split('<br>').map(function(el, i) {
      var parts = el.split('%');
      return {
        race : c.stringy(parts[1]),
        percentage: c.percenty(parts[0])
      }
    });
  } else {
    schoolData.demographics = [];
  }
  schoolData.percentInternationalStudents = c.percenty($('.onecolumntable').eq(-3).find('td').eq(-3).text().split('%')[0]);
  schoolData.averageStudentAge = c.numbery($('.onecolumntable').eq(-3).find('td').eq(-2).text());
  // Fix a dirty data special case
  var returning = $('.onecolumntable').eq(-2).find('td').eq(-4).text().trim();
  if (returning === "712.0%") {
    returning = "71.2%";
  }
  schoolData.retention = {
    percentOfFirstYearStudentsReturning: c.percenty(returning),
    percentOfGraduatesWithin4Years: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-3).text()),
    percentOfGraduatesWithin5Years: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-2).text()),
    percentOfGraduatesWithin6Years: c.percenty($('.onecolumntable').eq(-2).find('td').eq(-1).text())
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



var noData = [];
var parseAll = function(concurrency) {
  var idRange = _.range(conf.minSchoolId, conf.maxSchoolId + 1);
  //var idRange = [1111];
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
              err.log = false;
              noData.push(idNumber);
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
  parseAll(32).then(function() {
    console.log("No data: ", noData);
    console.log('-------------------------------------------------------------');
    console.log('finished.');
    console.log('-------------------------------------------------------------');
  }).catch(function(err) {
    throw err;
  });
}

