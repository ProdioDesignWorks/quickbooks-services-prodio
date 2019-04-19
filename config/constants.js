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
}

exports.QB_TERMS = {
    "CREATE_ACCOUNT": "CREATE_ACCOUNT",
    "EDIT_ACCOUNT": "EDIT_ACCOUNT",
    "GET_ACCOUNT": "GET_ACCOUNT"
}

exports.config = config;