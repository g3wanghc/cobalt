var Course = require('../model')

var limit = 10
var skip = 0

var PARAMS = [
  "code", "name", "description", "division", "department", "prerequisite",
  "exclusion", "level", "breadth", "campus", "term", "instructor",
  "location", "rating", "day", "start", "end", "duration", "size",
  "session"
]

//The flat (relative to first root) keymap
var KEYMAP = {
  "code": "code",
  "name": "name",
  "description": "description",
  "division": "division",
  "department": "department",
  "prerequisite": "prerequisites",
  "exclusion": "exclusions",
  "level": "level",
  "breadth": "breadths",
  "campus": "campus",
  "term": "term",
  "meeting_code": "code",
  "instructor": "instructors",
  "day": "day",
  "start": "start",
  "end": "end",
  "duration": "duration",
  "location": "location",
  "size": "size",
  "enrolment": "enrolment"
}

//The absolute (from main root) keymap
var KEYMAP2 = {
  "code": "code",
  "name": "name",
  "description": "description",
  "division": "division",
  "department": "department",
  "prerequisite": "prerequisites",
  "exclusion": "exclusions",
  "level": "level",
  "breadth": "breadths",
  "campus": "campus",
  "term": "term",
  "meeting_code": "meeting_sections.meeting_code",
  "instructor": "meeting_sections.instructors",
  "day": "meeting_sections.times.day",
  "start": "meeting_sections.times.start",
  "end": "meeting_sections.times.end",
  "duration": "meeting_sections.times.duration",
  "location": "meeting_sections.times.location",
  "size": "meeting_sections.size",
  "enrolment": "meeting_sections.enrolment"
}

var main = function(req, res) {

  if(!Course.hasOwnProperty(req.params.year)) {
    return res.json({
      "error": {
        "code": 0,
      "message": "Invalid year."
      }
    })
  }

  if(req.query.q) {

    var qLimit = limit
    if(req.query.limit) {

      if(req.query.limit <= 100) {
        qLimit = req.query.limit
      } else {
        return res.json({
          "error": {
            "code": 0,
          "message": "Limit must be less than or equal to 100."
          }
        })
      }

    }

    var qSkip = skip
    if(req.query.skip) {
      qSkip = req.query.skip
    }

    var q = req.query.q
    q = q.split('AND')

    var queries = 0
    var isMapReduce = false
    var mapReduceData = []

    var filter = { $and: q }

    for(var i = 0; i < filter.$and.length; i++) {
      filter.$and[i] = { $or: q[i].trim().split('OR') }
      var mapReduceOr = []
      for(var j = 0; j < filter.$and[i].$or.length; j++) {
        var part = filter.$and[i].$or[j].trim().split(":")
        var x = formatPart(part[0], part[1].substr(1, part[1].length - 2))

        if(x.isValid) {
          if(x.isMapReduce) {
            isMapReduce = true
            x.mapReduceData.key = KEYMAP[x.key]
            mapReduceOr.push(x.mapReduceData)
          }

          filter.$and[i].$or[j] = x.query

          queries++
        }
      }


      if(mapReduceOr.length > 0) {
        mapReduceData.push(mapReduceOr)
      }

    }

    if(queries > 0) {

      if(isMapReduce) {

        if(filter.$and.length == 0) {
          filter = {}
        }

        var o = {
          query: filter,
          scope: {
            data: mapReduceData
          },
          limit: qLimit
        }

        o.map = function() {

          var matchedSections = []

          for(var h = 0; h < this.meeting_sections.length; h++) {
              var s = this.meeting_sections[h]

              var currentData = []

              for(var i = 0; i < data.length; i++) {
                currentData[i] = []
                for(var j = 0; j < data[i].length; j++) {
                  currentData[i][j] = false
                  var p = data[i][j]
                  var value = undefined

                  if(["code", "size", "enrolment", "instructors"].indexOf(p.key) > -1) {
                      value = s[p.key]
                  } else if(["day", "start", "end", "duration", "location"].indexOf(p.key) > -1) {
                    value = []
                    for(var l = 0; l < s.times.length; l++) {
                      value.push(s.times[l][p.key])
                    }
                  }

                  if(value.constructor === Array) {

                    /*
                      Have to search through arrays of values here, efficiently.
                      If one of the conditions are true, the whole value is considered
                      true
                    */

                    bools = []

                    if(p.operator == "-") {
                      for(var l = 0; l < value.length; l++) {
                        bools.push(!value[l].match(p.value))
                      }
                    } else if(p.operator == ">") {
                      for(var l = 0; l < value.length; l++) {
                        bools.push(value[l] > p.value)
                      }
                    } else if(p.operator == "<") {
                      for(var l = 0; l < value.length; l++) {
                        bools.push(value[l] < p.value)
                      }
                    } else if(p.operator == ".>") {
                      for(var l = 0; l < value.length; l++) {
                        bools.push(value[l] >= p.value)
                      }
                    } else if(p.operator == ".<") {
                      for(var l = 0; l < value.length; l++) {
                        bools.push(value[l] <= p.value)
                      }
                    } else {
                      for(var l = 0; l < value.length; l++) {
                        if(!isNaN(value[l])) {
                          bools.push(value[l] == p.value)
                        } else {
                          bools.push(value[l].match(p.value))
                        }
                      }
                    }

                    currentData[i][j] = bools.some(Boolean)

                  } else {

                    if(p.operator == "-") {
                      currentData[i][j] = !value.match(p.value)
                    } else if(p.operator == ">") {
                      currentData[i][j] = value > p.value
                    } else if(p.operator == "<") {
                      currentData[i][j] = value < p.value
                    } else if(p.operator == ".>") {
                      currentData[i][j] = value >= p.value
                    } else if(p.operator == ".<") {
                      currentData[i][j] = value <= p.value
                   } else {
                     if(!isNaN(value)) {
                       currentData[i][j] = value == p.value
                     } else {
                       currentData[i][j] = value.match(p.value)
                     }
                   }

                  }

                }

              }


              for(var i = 0; i < currentData.length; i++) {
                currentData[i] = currentData[i].some(Boolean)
              }

              currentData = currentData.every(Boolean)

              if(currentData) {
                matchedSections.push(s)
              }

          }
          if(matchedSections.length > 0) {
            this.matched_meeting_sections = matchedSections
            emit(this._id, this)
          }
        }

        o.reduce = function(key, values) {
          return values[0]
        }

        Course[req.params.year].mapReduce(o, function(err, docs) {
          if(err) {
            return res.json(err)
          }

          formattedDocs = []

          docs.forEach(function(doc) {
            delete doc.value["_id"]
            formattedDocs.push(doc.value)
          })

          res.json(formattedDocs)
        })

      } else {
        Course[req.params.year].find(filter).skip(qSkip).limit(qLimit).exec(function(err, docs) {
          if (err) {
            res.json(err)
          }
          res.json(docs)
        })
      }

    }

  }

}

function formatPart(key, part) {

  // Response format
  var response = {
    key: key,
    isValid: true,
    isMapReduce: false,
    mapReduceData: {},
    query: {}
  }


  // Checking if the start of the segment is an operator (-, >, <, .>, .<)
  if(part.indexOf("-") === 0) {
    // Negation
    part = {
      operator: "-",
      value: part.substring(1)
    }
  } else if(part.indexOf(">=") === 0) {
    part = {
      operator: ">=",
      value: part.substring(2)
    }
  } else if(part.indexOf("<=") === 0) {
    part = {
      operator: "<=",
      value: part.substring(2)
    }
  } else if(part.indexOf(">") === 0) {
    part = {
      operator: ">",
      value: part.substring(1)
    }
  } else if(part.indexOf("<") === 0) {
    part = {
      operator: "<",
      value: part.substring(1)
    }
  } else {
    part = {
      operator: undefined,
      value: part
    }
  }

  /*
    WE STILL GOTTA VALIDATE THE QUERY HERE, WOW I KEEP PUTTING IT OFF.

    Basically, if the query is valid, we're good to go. If it isn't, set
    response.isValid to false and return the response object.
  */

  if (["breadth", "level", "size", "enrolment"].indexOf(key) > -1) {
    // Integers and arrays of integers (mongo treats them the same)

    part.value = parseInt(part.value)

    if(["size", "enrolment"].indexOf(key) > -1) {
      response.isMapReduce = true
      response.mapReduceData = part
    }

    if(part.operator == "-") {
      response.query[KEYMAP2[key]] = { $ne: part.value }
    } else if(part.operator == ">") {
      response.query[KEYMAP2[key]] = { $gt: part.value }
    } else if(part.operator == "<") {
      response.query[KEYMAP2[key]] = { $lt: part.value }
    } else if(part.operator == ">=") {
      response.query[KEYMAP2[key]] = { $gte: part.value }
    } else if(part.operator == "<=") {
      response.query[KEYMAP2[key]] = { $lte: part.value }
    } else {
      // Assume equality if no operator
      response.query[KEYMAP2[key]] = part.value
    }

  } else if(["start", "end", "duration"].indexOf(key) > -1) {
    //time related

    part.value = parseInt(part.value)

    response.isMapReduce = true
    response.mapReduceData = part

    if(part.operator == "-") {
      response.query[KEYMAP2[key]] = { $ne: part.value }
    } else if(part.operator == ">") {
      response.query[KEYMAP2[key]] = { $gt: part.value }
    } else if(part.operator == "<") {
      response.query[KEYMAP2[key]] = { $lt: part.value }
    } else if(part.operator == ">=") {
      response.query[KEYMAP2[key]] = { $gte: part.value }
    } else if(part.operator == "<=") {
      response.query[KEYMAP2[key]] = { $lte: part.value }
    } else {
      // Assume equality if no operator
      response.query[KEYMAP2[key]] = part.value
    }

  } else if(key.match("instructor")) {
    // Array of strings

    response.isMapReduce = true
    response.mapReduceData = part

    if(part.operator == "-") {
      response.query[KEYMAP2[key]] = { $not: {
        $elemMatch: { $regex: "(?i).*" + escapeRe(part.value) + ".*" }
      } }
    } else {
      response.query[KEYMAP2[key]] = {
        $elemMatch: { $regex: "(?i).*" + escapeRe(part.value) + ".*" }
      }
    }

  } else {
    // Just your average string
    if(["location", "meeting_code"].indexOf(key) > -1) {
      response.isMapReduce = true
      response.mapReduceData = part
    }

    if(part.operator == "-") {
      response.query[KEYMAP2[key]] = {
        $regex: "^((?!" + escapeRe(part.value) + ").)*$",
        $options: 'i'
      }
    } else {
      response.query[KEYMAP2[key]] = { $regex: "(?i).*" + escapeRe(part.value) + ".*" }
    }

  }

  return response

}

function escapeRe(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = main
