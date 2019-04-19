const request = require('request');
const {
    isValidObject,
    isValid,
    isObject,
    isNull
} = require('./helper');
const {
    QB_URLS,
    QB_TERMS,
    config
} = require('../config/constants');

function funQBAPICall(actionName, requestData, apiMethod, lbModels) {
    return new Promise((resolve, reject) => {
        lbModels.Oauth2Data.renewToken(function(err, res) {
            console.log(" \n \n");
            console.log(res);
            var url = config.api_uri + res.oauth_info.realmId + actionName;
            console.log('Making API call to: ' + url)
            var requestObj = {
                url: url,
                headers: {
                    'Authorization': 'Bearer ' + res.oauth_info.accessToken,
                    'Accept': 'application/json',
                    'content-type': 'application/json',
                },
                json: true,
                method:apiMethod
            };

            if(apiMethod=="POST"){
                requestObj["body"] = requestData;
            }

            request(requestObj, function(err, response) {

                if (err) {
                    reject({
                        "success": false,
                        "errorMessage": 'Error while requesting data ' + JSON.stringify(err)
                    });
                }

                if (response.statusCode == 401 && trycount < 1) {
                    console.log('401 response obtained, Renewing token');
                    // let token = await renewToken(oauth2data); 
                    lbModels.Oauth2Data.renewToken().then(tokenInfo => {
                        if (tokenInfo) {
                            funQBAPICall(actionName, oauthData, requestData);
                        } else {
                            reject({
                                "success": false,
                                "errorMessage": "Invalid Token Info",
                                "body": null
                            });
                        }
                    }).catch(err => {
                        reject({
                            "success": false,
                            "errorMessage": JSON.stringify(err),
                            "body": null
                        });
                    });
                } else {
                    console.log('Response body: ', response.body);
                    console.log('Response header: ', response.headers);
                    //res.send(response.body);

                    if (!isNull(response.body["Fault"])) {
                        reject({
                            "success": false,
                            "errorMessage": "Invalid Payload Request",
                            "body": response.body
                        });
                    } else {
                        resolve({
                            "success": true,
                            'body': response.body
                        });
                    }
                }
            });
        });
    });
}


class QBAPIHandler {
    async funCallApi(actionName, requestData, apiMethod, lbModels) {
        return await funQBAPICall(actionName, requestData,apiMethod, lbModels);
    }
}

QBAPIHandler = new QBAPIHandler();
module.exports = QBAPIHandler;