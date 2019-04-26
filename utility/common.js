
const HttpErrors = require('http-errors');
const request = require('request');
const {
    findReplace,
    unique,
    isValidObject,
    isValid,
    flattenArray,
    clean,
    isArray,
    isObject,
    print,
    isNull
} = require('./helper');
const {
    QB_URLS,
    QB_TERMS,
    config
} = require('../config/constants');

const QBAPIHandler = require('./apis_handler');

exports.HttpErrors = HttpErrors;
exports.request = request
exports.findReplace =findReplace;
exports.unique = unique;
exports.isValidObject =isValidObject;
exports.isValid = isValid;
exports.flattenArray = flattenArray;
exports.clean = clean;
exports.isArray = isArray;
exports.isObject = isObject;
exports.print = print;
exports.isNull = isNull;

exports.QB_URLS = QB_URLS;
exports.QB_TERMS = QB_TERMS;
exports.config = config;

exports.QBAPIHandler = QBAPIHandler;


