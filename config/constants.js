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
let minorversion = "4";

exports.QB_URLS = {
    "ACCESS_TOKEN_URI": 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    "CREATE_ACCOUNT": '/account?minorversion='+minorversion,
    "EDIT_ACCOUNT": '/account?operation=update&minorversion='+minorversion,
    "GET_ACCOUNT": '/account/[ACCOUNTID]?minorversion='+minorversion,
    "CREATE_CUSTOMER":"/customer?minorversion="+minorversion,
    "EDIT_CUSTOMER": '/customer?operation=update&minorversion='+minorversion,
    "GET_CUSTOMER": '/customer/[CUSTOMERID]?minorversion='+minorversion,
    "DELETE_CUSTOMER": "/customer?minorversion="+minorversion,
    "GETALL_CUSTOMERS": "/query?query=[QUERY]",
    "CREATE_EMPLOYEE":"/employee?minorversion="+minorversion,
    "EDIT_EMPLOYEE": '/employee?operation=update&minorversion='+minorversion,
    "GET_EMPLOYEE": '/employee/[EMPLOYEEID]?minorversion='+minorversion,
    "DELETE_EMPLOYEE": "/employee?minorversion="+minorversion,
    "GETALL_EMPLOYEES": "/query?query=[QUERY]",
    "CREATE_INVOICE": "/invoice?minorversion="+minorversion,
    "EDIT_INVOICE":'/invoice?operation=update&minorversion='+minorversion,
    "GET_INVOICE": '/invoice/[INVOICEID]?minorversion='+minorversion,
    "GETALL_INVOICES": "/query?query=[QUERY]",
    "VOID_INVOICE": '/invoice?operation=void&minorversion='+minorversion,
    "EMAIL_INVOICE": '/invoice/[INVOICEID]/send?sendTo=[EMAILID]',
    "GET_INVOICE_PDF": 'invoice/[INVOICEID]/pdf',
    "CREATE_PAYMENT":"/payment?minorversion="+minorversion,
    "EDIT_PAYMENT": '/payment?operation=update&minorversion='+minorversion,
    "GET_PAYMENT": '/payment/[PAYMENTID]?minorversion='+minorversion,
    "DELETE_PAYMENT": "/payment?minorversion="+minorversion,
    "GETALL_PAYMENTS": "/query?query=[QUERY]",   
    "CREATE_VENDOR":"/vendor?minorversion="+minorversion,
    "EDIT_VENDOR": '/vendor?operation=update&minorversion='+minorversion,
    "GET_VENDOR": '/vendor/[VENDORID]?minorversion='+minorversion,
    "DELETE_VENDOR": "/vendor?minorversion="+minorversion,
    "GETALL_VENDORS": "/query?query=[QUERY]",
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
    "CREATE_EMPLOYEE":"CREATE_EMPLOYEE",
    "EDIT_EMPLOYEE": "EDIT_EMPLOYEE",
    "GET_EMPLOYEE": "GET_EMPLOYEE",
    "DELETE_EMPLOYEE": "DELETE_EMPLOYEE",
    "GETALL_EMPLOYEES": "GETALL_EMPLOYEES",
    "CREATE_INVOICE":"CREATE_INVOICE",
    "EDIT_INVOICE":"EDIT_INVOICE",
    "GET_INVOICE":"GET_INVOICE",
    "GETALL_INVOICES":"GETALL_INVOICES",
    "VOID_INVOICE":"VOID_INVOICE",
    "EMAIL_INVOICE":"EMAIL_INVOICE",
    "GET_INVOICE_PDF":"GET_INVOICE_PDF",
    "CREATE_PAYMENT":"CREATE_PAYMENT",
    "EDIT_PAYMENT": "EDIT_PAYMENT",
    "GET_PAYMENT": "GET_PAYMENT",
    "DELETE_PAYMENT": "DELETE_PAYMENT",
    "GETALL_PAYMENTS":"GETALL_PAYMENTS",
    "CREATE_VENDOR":"CREATE_VENDOR",
    "EDIT_VENDOR": "EDIT_VENDOR",
    "GET_VENDOR": "GET_VENDOR",
    "DELETE_VENDOR": "DELETE_VENDOR",
    "GETALL_VENDORS": "GETALL_VENDORS"
}

exports.config = config;