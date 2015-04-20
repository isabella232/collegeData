//
// Data conversion functions
//
var _ = require("underscore");


//
// Base converters for data types.  These will be wrapped with a null handler /
// string trimmer before export.
//
var converters = {};
converters.stringy = function(val) {
  if (typeof val === "string") {
    return val;
  }
};
converters.numbery = function(val) {
  if (typeof val === "number") {
    return val;
  } else if (typeof val === "string") {
    if (val === "########") {
      return null;
    }
    val = val.replace(/[^\d\.]/g, '');
    return parseFloat(val);
  }
};

converters.stringy = function(val) {
  return val;
};
converters.percenty = function(val) {
  val = converters.numbery(val);
  if (val === null || (!isNaN(val) && val >= 0 && val <= 100)) {
    return val;
  }
};
converters.booly = function(val) {
  if (val === true || val === false) {
    return val;
  }
  if (typeof val !== "string") { return undefined; }
  val = val.toLowerCase().trim();

  bool = {
    "yes": true,
    "no": false
  }[val];
  if (typeof bool !== "undefined") {
    return bool;
  }
};
converters.cityState = function(val) {
  if (typeof val !== "string") { return undefined; }
  var parts = val.split(", ");
  var state = parts.pop();
  var city = parts.join(", ");
  if (state && city) {
    return {state: state, city: city};
  }
}

converters.validWebsite = function(val) {
  var transforms = [
    [/ /g, "%20"],
    [/\(/g, "%28"],
    [/\)/g, "%29"],
  ];
  if (_.isString(val)) {
    if (!/^https?:\/\//.test(val)) {
      val = "http://" + val;
    }
    for (var i = 0; i < transforms.length; i++) {
      val = val.replace(transforms[i][0], transforms[i][1]);
    }
    return val;
  }
};

// taken from SimpleSchema.RegEx.Email
var emailRe = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
converters.validEmail = function(val) {
  if (typeof val === "string" && emailRe.test(val)) {
    return val;
  }
};

// Wrap all of the converters in something that catches nulls, and throws
// errors for undefined values.
for (var key in converters) {
  (function(key) {
    var func = converters[key];
    module.exports[key] = function converterWrapper(val) {
      // Apply null and trimming rules to val, and execute ``func``.
      if (val === null || val === undefined) {
        return null;
      } else if (typeof val === "string") {
        val = val.trim();
        if (val.length === 0 || val === "Not reported") {
          return null;
        }
      }
      var res = func(val);
      if (typeof res !== "undefined") {
        return res;
      }
      throw new Error("Unexpected value: `" + val + "` for `" + key + "`");
    }
  })(key);
}

//
// These converters skip null checking.
//

module.exports.totalAndPercent = function(val) {
  // e.g. 52% of 396 applicants were admitted
  // or   28 (65.1%) of freshmen
  // or   140 (52.2%)
  var percent, total;
  if (typeof val !== "string") {
    percent = null;
    total = null;
  } else {
    val = val.replace(/[,]/g, '')
    percent = /(?:^|[^\d\.])([\d\.]+%)/.exec(val);
    total = /(?:^|[^\d])([\d\.]+)[^%]/.exec(val);
  }
  return {
    total: total && total[1] ? converters.numbery(total[1]) : null,
    percent: percent && percent[1] ? converters.percenty(percent[1]) : null
  }
};
module.exports.dashRange = function(val) {
  // e.g. "460-580"
  var low, high;
  if (typeof val !== "string") {
    low = high = null;
  } else {
    var parts = val.split("-");
    low = converters.numbery(parts[0]);
    high = converters.numbery(parts[1]);
    if (low !== null && high !== null) {
      // REAL ugly: deal with source data that does ranges like "480-55"
      if (low > high) {
        high = high * 10;
      }
    }
  }
  return {low: low, high: high}
};

