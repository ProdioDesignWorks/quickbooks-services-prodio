const uuid = require('uuid/v4');
const isEmpty = require('lodash/isEmpty');
//const isNull = require('lodash/isNull');
const isUndefined = require('lodash/isUndefined');
const flatten = require('lodash/flatten');
const compact = require('lodash/compact');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');

const findReplace = (props, template) => {
     return template.replace(/{{\s*([\w\.]+)\s*}}/g, (tag, match) => {
          var nodes = match.split("."), current = props, length = nodes.length, i = 0;
          while (i < length) {
               try {
                    current = current[nodes[i]];
               } catch (e) {
                    return "";
               }
               i++;
          }
          return current;
     });
};

const unique = () => uuid();

const isValidObject = obj => !isUndefined(obj) && !isNull(obj) && !isEmpty(obj);

const isValid = str => !isUndefined(str) && !isNull(str) && str.length;

const flattenArray = arr => flatten(arr);

const clean = arr => compact(arr);

exports.findReplace = (props, template) => findReplace(props, template);
exports.unique = () => unique();
exports.isValidObject = obj => isValidObject(obj);
exports.isValid = str => isValid(str);
exports.flattenArray = arr => flattenArray(arr);
exports.clean = arr => clean(arr);
exports.isArray = arr => isArray(arr);
exports.isObject = obj => isObject(obj);
exports.print = obj => console.log(obj);

const isNull = function(val) {
    if (typeof val === 'string') {
        val = val.trim();
    }
    if (val === undefined || val === null || typeof val === 'undefined' || val === '' || val === 'undefined') {
        return true;
    }
    return false;
};

const convertObjectIdToString = function(objectID) {
    return (objectID.toString().substring(0,10)).toString();
};

exports.isNull = str => isNull(str);
exports.convertObjectIdToString = convertObjectIdToString;
