var http = require('http');
var cheerio = require('cheerio');
var util = require('util');
var _ = require('underscore');
var fs = require('fs');
var jsop = require('jsop');
var EventEmitter = require('events').EventEmitter;

/* 
 * Scraper Constructor
 */
 function Scraper (url, index, schoolId) {

  this.url = url;
  this.index = index;
  this.schoolId = schoolId;

  this.init();

 }

/*
 * Make it an EventEmitter
 */
util.inherits(Scraper, EventEmitter);

/*
 * Initialize scraping
 */
Scraper.prototype.init = function () {
    var model;
    var self = this;

    console.log(self);

    self.on('loaded', function (html) {
        model = self.parsePage(html, self.index, self.schoolId);
        self.emit('complete', model);
    });

    self.loadWebPage();
};

Scraper.prototype.loadWebPage = function () {
  var self = this;
  http.get(self.url, function (res) {
    var body = '';

    if(res.statusCode !== 200) {
      return self.emit('error', STATUS_CODES[res.statusCode]);
    }

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      self.emit('loaded', body);
    });

  })
  .on('error', function (err) {
    self.emit('error', err);
  });      
};

/*
 * Parse html and return an object
**/
Scraper.prototype.parsePage = function (html, index, schoolId) {
  var $ = cheerio.load(html);
  if ( fs.existsSync("data/" + schoolId + '.json') ) {  
    var schoolData = jsop("data/" + schoolId + '.json');
  } else {
    schoolData = undefined;
  }


  if ($('#getSavedSearch').text().trim().indexOf('Get') != -1) {
    console.log('this is the file path ', fs.existsSync("data/" + schoolId + '.json'));
    fs.existsSync("data/" + schoolId + '.json') ? fs.unlinkSync('data/' + schoolId + '.json') : console.log('already deleted ', "data/" + schoolId + '.json')
    return
  }

  if ( index === 0 ) {

    console.log('main page - id # ', schoolId);

    schoolData.idNumber = schoolId;
    schoolData.name = $('.cp_left').find('h1').text();
    schoolData.citystate = $('.cp_left').find('.citystate').text().trim();
    schoolData.descript = $('.overviewtext').text();
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

    var tuitionArray = $('.onecolumntable').eq(-4).find('td').eq(-5).html().split("<br>");

    if (tuitionArray.length > 1) {
      schoolData.tuition = {
        tuitionAndFees: {
          inState: tuitionArray.length > 1 ? tuitionArray[0].split(':')[0].trim() : tuitionArray[0].split(':')[1].trim(),
          outOfState: tuitionArray.length > 1 ? tuitionArray[1].split(':')[0].trim() : tuitionArray[1].split(':')[1].trim()
        },
        roomAndBoard: $('.onecolumntable').eq(-4).find('td').eq(-4).text(),
        averageGraduateDebt: $('.onecolumntable').eq(-4).find('td').eq(-1).text()
      }
    }

    if (tuitionArray.length === 1) {
      schoolData.tuition = {
        tuitionAndFees: tuitionArray[0].trim(),
        roomAndBoard: $('.onecolumntable').eq(-4).find('td').eq(-4).text().trim(),
        averageGraduateDebt: $('.onecolumntable').eq(-4).find('td').eq(-1).text().trim()
      }

    }

  } else if (index === 1 ) {

    // Admissions Details Page
    schoolData.specificAdmissionsData = {};
    console.log('page 2')

    schoolData.idNumber = schoolId;
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
      email: $('.onecolumntable').eq(-10).find('td').eq(-5).text(), 
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

  } else if (index === 2 ) {

    console.log('page 3');

    var len = $('.onecolumntable').eq(-9).find('td').find('a').length;
    schoolData.tuition = {};

    schoolData.idNumber = schoolId;
    schoolData.tuition.financialAid = {
      website: len > 2 ? $('.onecolumntable').eq(-9).find('td').find('a')[len - 2].href : null,
      netPriceCalculator: len > 1 ? $('.onecolumntable').eq(-9).find('td').find('a')[len - 1].href : null,
      applicationDeadline: $('.onecolumntable').eq(-8).find('td').eq(-3).text(),
      awardDate: $('.onecolumntable').eq(-8).find('td').eq(-2).text(),
      FAFSACode: $('.laligntable').find('th').eq(-2).text().slice(14,20),
      freshmen: {
        applicants: $('.onecolumntable').eq(-7).find('td').eq(-10).text(),
        foundToHaveNeed: $('.onecolumntable').eq(-7).find('td').eq(-9).text(),
        receivedAid: $('.onecolumntable').eq(-7).find('td').eq(-8).text(),
        needFullyMet: $('onecolumntable').eq(-7).find('td').eq(-7).text(),
        averagePercentOfNeedMet: $('.onecolumntable').eq(-7).find('td').eq(-6).text(),
        averageAward: $('.onecolumntable').eq(-7).find('td').eq(-5).text(),
        meritBasedGift: $('.onecolumntable').eq(-7).find('td').eq(-1).text
      },
      allUndergraduates: {
        applicants: $('.onecolumntable').eq(-6).find('td').eq(-10).text(),
        foundToHaveNeed: $('.onecolumntable').eq(-6).find('td').eq(-9).text(),
        receivedAid: $('.onecolumntable').eq(-6).find('td').eq(-8).text(),
        needFullyMet: $('onecolumntable').eq(-6).find('td').eq(-7).text(),
        averagePercentOfNeedMet: $('.onecolumntable').eq(-6).find('td').eq(-6).text(),
        averageAward: $('.onecolumntable').eq(-6).find('td').eq(-5).text(),
        meritBasedGift: $('.onecolumntable').eq(-6).find('td').eq(-1).text()
      },
      borrowing: {
        percentOfGraduatesWithLoans: $('.onecolumntable').eq(-5).find('td').eq(-5).text(),
        averageIndebtednessOfGraduates: $('.onecolumntable').eq(-5).find('td').eq(-4).text()
      }
    }

  } else if (index === 3 ) {

    console.log('page 4');
    
    schoolData.idNumber = schoolId;
    schoolData.undergraduateMajors = $('.collist').find('li').map(function(i, el) { return $(this).text().trim() }).get();
    schoolData.mostPopularMajors = $('.onecolumntable').eq(-11).find('td').eq(-5).text().split(',').map(function(el, i) { return el.trim() });
    schoolData.studyAbroad = $('.onecolumntable').eq(-11).find('td').eq(-2).text().indexOf('Offered') > -1 ? true : false;
    schoolData.IBCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-3).text();
    schoolData.APCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-2).text();
    schoolData.sophomoreStanding = $('.onecolumntable').eq(-8).find('td').eq(-1).text();

  } else if (index === 4 ) {

    console.log('page 5');

    schoolData.idNumber = schoolId;
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

  } else if ( index === 5 ) {

    console.log('page 6 - id # ', schoolId);
        
    schoolData.idNumber = schoolId;
    schoolData.demographics = $('.onecolumntable').eq(-3).find('td').eq(-4).html().indexOf('Not reported') === -1 ? $('.onecolumntable').eq(-3).find('td').eq(-4).html().split('<br>').map(function(el, i) { return { race : el.split('%')[1].trim(), percentage: parseFloat(el) }}) : null;
    schoolData.percentInternationalStudents = $('onecolumntable').eq(-3).find('td').eq(-3).text().split('%')[0];
    schoolData.averageStudentAge = $('.onecolumntable').eq(-3).find('td').eq(-2).text();
    schoolData.retention = {
      percentOfFirstYearStudentsReturning: $('.onecolumntable').eq(-2).find('td').eq(-4).text(),
      percentOfGraduatesWithin4Years: $('.onecolumntable').eq(-2).find('td').eq(-3).text(),
      percentOfGraduatesWithin5Years: $('.onecolumntable').eq(-2).find('td').eq(-2).text(),
      percentOfGraduatesWithin6Years: $('.onecolumntable').eq(-2).find('td').eq(-1).text()
    }

  } else {
    console.log('wtf');
  }

  return schoolData;

};

module.exports = Scraper;
