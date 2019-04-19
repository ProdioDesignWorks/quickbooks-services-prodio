let configFile = './QBConfig.dev.json';
console.log(process.env.NODE_ENV);

switch (process.env.NODE_ENV) {
    case "alpha":
        configFile = './QBConfig.alpha.json';
        break;
    case "prod":
        configFile = './QBConfig.prod.json';
        break;
}

var config = require(configFile);

exports.QB_URLS = {
    "ACCESS_TOKEN_URI": 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    "CREATE_ACCOUNT": '/account?minorversion=4',
    "EDIT_ACCOUNT": '/account?operation=update&minorversion=4',
    "GET_ACCOUNT": '/account/[ACCOUNTID]?minorversion=4',
    "CREATE_CUSTOMER":"/customer?minorversion=4",
    "EDIT_CUSTOMER": '/customer?operation=update&minorversion=4',
    "GET_CUSTOMER": '/customer/[CUSTOMERID]?minorversion=4',
    "DELETE_CUSTOMER": "/customer?minorversion=4",
    "GETALL_CUSTOMERS": "/query?query=[QUERY]"
}

exports.QB_TERMS = {
    "CREATE_ACCOUNT": "CREATE_ACCOUNT",
    "EDIT_ACCOUNT": "EDIT_ACCOUNT",
    "GET_ACCOUNT": "GET_ACCOUNT",
    "CREATE_CUSTOMER":"CREATE_CUSTOMER",
    "EDIT_CUSTOMER": "EDIT_CUSTOMER",
    "GET_CUSTOMER": "GET_CUSTOMER",
    "DELETE_CUSTOMER": "DELETE_CUSTOMER",
    "GETALL_CUSTOMERS": "GETALL_CUSTOMERS",
}

exports.config = config;