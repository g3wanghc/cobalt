UofT Course API
===============

This is a RESTful web API built to interface with the University of Toronto undergraduate courses amongst all 3 campuses. It is developed as part of a collection of public data APIs for UofT called [Cobalt](https://github.com/cobalt-io).

There are 4 endpoints for the course API. (optional parameters are within square brackets)

All course end points need to have a specified year in which to apply calls within (`GET http://cobalt.qas.im/api/1.0/courses/:year/:action`). As an example, the year `2014` would include courses from Fall 2014, Winter 2015, and Summer 2015.

End Points
----------
##### **`GET http://cobalt.qas.im/api/1.0/courses/:year/list`**
* **Description**
    - Gets a list of courses
* **Parameters**
    - `:year` academic session to perform calls on
        * `/courses/2014` would include Fall 2014, Winter 2015, and Summer 2015
    - `limit` number of results to return
        * `limit=10` is the default value
        * `limit=200` is the maximum amount of documents that can be returned
    - `skip` number of results to skip
        * `skip=0` is the default value
* **Examples**
    - [`GET http://cobalt.qas.im/api/1.0/courses/2014/list`](#)

- - - - - - - - - - - -

##### **`GET http://cobalt.qas.im/api/1.0/courses/:year/show/:id`**
* **Description**
    - Gets a specific course.
* **Parameters**
    - `:id` the identifier for a specific course
* **Examples**
    - [`GET http://cobalt.qas.im/api/1.0/courses/2014/show/CSC148H1F20149`](#)

- - - - - - - - - - - -

##### **`GET http://cobalt.qas.im/api/1.0/courses/:year/search`**
* **Description**
    - Gets a list of courses that match a fuzzy search.
* **Parameters**
    - `q` the search text
    - `limit` number of results to return
        * `limit=10` is the default value
        * `limit=200` is the maximum amount of documents that can be returned
    - `skip` number of results to skip
        * `skip=0` is the default value
* **Examples**
    - [`GET http://cobalt.qas.im/api/1.0/courses/2014/search?q=natural language computing`](#)

- - - - - - - - - - - -

##### **`GET http://cobalt.qas.im/api/1.0/courses/:year/filter`**
* **Description**
    - Gets a list of courses that match specified filters.
* **Parameters**
    - `q` the filter query
        * Each parameter within the filter query can be joined with either an `AND` or an `OR`
        * For numerical parameters:
            - "**>**" indicates **GREATER THAN** (eg. `class_size:">30"`)
            - "**<**" indicates **LESS THAN** (eg. `start_time:"<18:00"`)
            - "**>=**" indicates **GREATER THAN OR EQUAL TO** (eg. `class_enrolment:">=1"`)
            - "**<=**" indicates **LESS THAN OR EQUAL TO** (eg. `course_level:"<=200"`)
            - No operator indicates **EQUAL TO** (eg. `breadth:"5"`)
        * For string parameters:
            - No operator indicates **CONTAINS** (eg. `code:"CSC"`)
            - “**-**” indicates **NOT** (eg. `department:"-architecture"`)
    - `limit` number of results to return
        * `limit=10` is the default value
        * `limit=200` is the maximum amount of documents that can be returned
    - `skip` number of results to skip
        * `skip=0` is the default value
* **Examples**
    - [`GET http://cobalt.qas.im/api/1.0/courses/2014/filter?q=instructor:"D Liu" AND code:"CSC" AND level:"<=200"`](#)