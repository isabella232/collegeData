
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var fs = require('fs');

var schoolData = {}

var scrape = function(schoolId) {

  console.log(schoolId);

  schoolData.admissionsData = {};
  schoolData.tuition = {};
  schoolData.admissionsData.SATMath = {};
  schoolData.admissionsData.SATReading = {};
  schoolData.admissionsData.SATWriting = {};
  schoolData.admissionsData.ACTComposite = {};


  request({
    uri: "http://www.collegedata.com/cs/data/college/college_pg01_tmpl.jhtml?schoolId=" + schoolId
  }, function(err, res, body) {
    var $ = cheerio.load(body);

    // Overview Page
    console.log('page 1');

    schoolData.idNumber = schoolId;
    schoolData.name = $('.cp_left').find('h1').text();
    schoolData.citystate = $('.cp_left').find('.citystate').text().trim();
    schoolData.description = $('.overviewtext').text()
    schoolData.website = $('.onecolumntable').eq(-7).find('td > a').text();
    schoolData.schoolType = $('.onecolumntable').eq(-7).find('td').eq(-6).text();
    schoolData.coed = $('.onecolumntable').eq(-7).find('td').eq(-5).text();
    schoolData.population = $('.onecolumntable').eq(-7).find('td').eq(-4).text();
    schoolData.women = $('.onecolumntable').eq(-7).find('td').eq(-3).text();
    schoolData.men = $('.onecolumntable').eq(-7).find('td').eq(-2).text();

    schoolData.admissionsData = {
      difficulty: $('.onecolumntable').eq(-6).find('td').eq(-5).text(),
      acceptanceRate: $('.onecolumntable').eq(-6).find('td').eq(-4).text(),
      earlyAction: $('.onecolumntable').eq(-6).find('td').eq(-3).text(),
      earlyDecision: $('.onecolumntable').eq(-6).find('td').eq(-2).text(),
      regularDeadline: $('.onecolumntable').eq(-6).find('td').eq(-1).text(),
      SATMath: {
        average: $('.onecolumntable').eq(-5).find('td').eq(-4).text().split('average')[0].trim(),
        halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-4).text().split('average')[1].slice(0,8).trim()
      },
      SATReading: {
        average: $('.onecolumntable').eq(-5).find('td').eq(-3).text().split('average')[0].trim(),
        halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-3).text().split('average')[1].slice(0,8).trim()
      },
      SATWriting: {
        average: $('.onecolumntable').eq(-5).find('td').eq(-2).text().split('average')[0].trim(),
        halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-2).text().split('average')[1].slice(0,8).trim()
      },
      ACTComposite: {
        average: $('.onecolumntable').eq(-5).find('td').eq(-1).text().split('average')[0].trim(),
        halfClassRange: $('.onecolumntable').eq(-5).find('td').eq(-1).text().split('average')[1].slice(0,6).trim()
      }
    };

    var tuitionArray = $('.onecolumntable').eq(-4).find('td').eq(-5).html().split("<br>");

    schoolData.tuition = {
      tuitionAndFees: {
        inState: tuitionArray[0].split(':')[1].trim(),
        outOfState: tuitionArray[1].split(':')[1].trim()
      },
      roomAndBoard: $('.onecolumntable').eq(-4).find('td').eq(-4).text(),
      averageGraduateDebt: $('.onecolumntable').eq(-4).find('td').eq(-1).text()
    }
    
  });

  request({
    uri: "http://www.collegedata.com/cs/data/college/college_pg02_tmpl.jhtml?schoolId=" + schoolId
  }, function(err, res, body) {
    var $ = cheerio.load(body);

    // Admissions Details Page
    schoolData.admissionsData.GPA = {};
    console.log('page 2')

      schoolData.admissionsData.GPA.ranges = {
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

      schoolData.admissionsData.SATWriting.ranges = {
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

      schoolData.admissionsData.SATReading.ranges = {
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

      schoolData.admissionsData.SATMath.ranges = {
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

      schoolData.admissionsData.ACTComposite.ranges = {
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

      schoolData.admissionsData.courses = {
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

      schoolData.admissionsData.testing = {
        SATorACT: {
          required: $('.laligntable').last().find('td').eq(-14).text().indexOf('Required') > -1 ? true : false,
          scoresMustBeReceivedBy: $('.laligntable').last().find('td').eq(-13).text()
        }
      }

      schoolData.admissionsData.applying = {
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
      console.log(schoolData.admissionsData.GPA);
    });

  request({
    uri: "http://www.collegedata.com/cs/data/college/college_pg03_tmpl.jhtml?schoolId=" + schoolId
  }, function(err, res, body) {
    var $ = cheerio.load(body);
    console.log('page 3');

      var len = $('.onecolumntable').eq(-9).find('td').find('a').length

      schoolData.tuition.financialAid = {
        website: $('.onecolumntable').eq(-9).find('td').find('a')[len - 2].href,
        netPriceCalculator: $('.onecolumntable').eq(-9).find('td').find('a')[len - 1].href,
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
    });

  request({
    uri: "http://www.collegedata.com/cs/data/college/college_pg04_tmpl.jhtml?schoolId=" + schoolId
  }, function(err, res, body) {
    var $ = cheerio.load(body);
    console.log('page 4');
    
      schoolData.undergraduateMajors = $('.collist').find('li').map(function(i, el) { return $(this).text().trim() }).get();
      schoolData.mostPopularMajors = $('.onecolumntable').eq(-11).find('td').eq(-5).text().split(',').map(function(el, i) { return el.trim() });
      schoolData.studyAbroad = $('.onecolumntable').eq(-11).find('td').eq(-2).text().indexOf('Offered') > -1 ? true : false;
      schoolData.IBCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-3).text();
      schoolData.APCreditsAccepted = $('.onecolumntable').eq(-8).find('td').eq(-2).text();
      schoolData.sophomoreStanding = $('.onecolumntable').eq(-8).find('td').eq(-1).text()
    });

  request({
    uri: "http://www.collegedata.com/cs/data/college/college_pg05_tmpl.jhtml?schoolId=" + schoolId
  }, function(err, res, body) {
    var $ = cheerio.load(body);
    console.log('page 5');

      schoolData.campusSetting = {
        localPopulation: $('.onecolumntable').eq(-10).find('td').eq(-4).text(),
        environment: $('.onecolumntable').eq(-10).find('td').eq(-2).text(),
        nearestMetropolitanArea: $('.onecolumntable').eq(-10).find('td').eq(-3).text(),
        averageLowTempJanuary: parseInt($('.onecolumntable').eq(-9).find('td').eq(-2).text().split(',')[0]),
        averageHighTempSeptember: parseInt($('.onecolumntable').eq(-9).find('td').eq(-2).text().split(',')[1]),
        rainyDaysPerYear: parseInt($('.onecolumntable').eq(-9).find('td').eq(-1).text()),
        linkToCampusMap: $('.onecolumntable').eq(-8).find('td').find('a')[0].href,
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
    });

  request({
    uri: "http://www.collegedata.com/cs/data/college/college_pg06_tmpl.jhtml?schoolId=" + schoolId
  }, function(err, res, body) {
    var $ = cheerio.load(body);
    console.log('page 6');
      
      schoolData.demographics = $('.onecolumntable').eq(-3).find('td').eq(-4).html().split('<br>').map(function(el, i) { return { race : el.split('%')[1].trim(), percentage: parseFloat(el) }});
      schoolData.percentInternationalStudents = $('onecolumntable').eq(-3).find('td').eq(-3).text().split('%')[0];
      schoolData.averageStudentAge = $('.onecolumntable').eq(-3).find('td').eq(-2).text();
      schoolData.retention = {
        percentOfFirstYearStudentsReturning: $('.onecolumntable').eq(-2).find('td').eq(-4).text(),
        percentOfGraduatesWithin4Years: $('.onecolumntable').eq(-2).find('td').eq(-3).text(),
        percentOfGraduatesWithin5Years: $('.onecolumntable').eq(-2).find('td').eq(-2).text(),
        percentOfGraduatesWithin6Years: $('.onecolumntable').eq(-2).find('td').eq(-1).text()
      }
  });

  setTimeout(function(){
    console.log(schoolData.admissionsData);
    var data = JSON.stringify(schoolData, null, 4);
    fs.writeFileSync('data/' + schoolId + "- " + schoolData.name + '.JSON', data);
  }, 9000)

}

scrape(100);

// for (var i = 6; i < 3341; i++) {
//   scrape(i);
// }
