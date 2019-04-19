'use strict';
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
} = require('../../utility/helper');
const {
    QB_URLS,
    QB_TERMS,
    config
} = require('../../config/constants');


module.exports = function(Qbaccounts) {

    Qbaccounts.remoteMethod(
        'createAccount', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'accountId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'accountData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbaccounts.createAccount = function(accountId,accountData, cb) {
    	if (!isNull(accountData["meta"])) {
            accountData = accountData["meta"];
        }

        Qbaccounts.findOne({"accountId":accountId}).then(accountInfo=>{
        	if(isValidObject(accountInfo)){
        		cb(new HttpErrors.InternalServerError('The account Id already exists.', {
		           expose: false
		    	}));
        	}else{
        		funCallApi(QB_URLS["CREATE_ACCOUNT"], accountData,"POST").then(responseData => {
		            if (responseData["success"]) {
		            	Qbaccounts.create({"accountId":accountId,"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBAccount Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
		            console.log(JSON.stringify(err));
		            let returnMsg = err;
		            if (!isNull(err["body"]["Fault"])) {
		                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
		            }
		            cb(new HttpErrors.InternalServerError((returnMsg), {
		                expose: false
		            }));
		        });
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching account info '+JSON.stringify(err), {
		                expose: false
		    }));
        })

    }

    async function funCallApi(actionName, requestData, apiMethod) {
        return await funQBAPICall(actionName, requestData,apiMethod);
    }

    function funQBAPICall(actionName, requestData, apiMethod) {
        return new Promise((resolve, reject) => {
            Qbaccounts.app.models.Oauth2Data.renewToken(function(err, res) {
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
                        Oauth2data.renewToken().then(tokenInfo => {
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

    Qbaccounts.remoteMethod(
        'editAccount', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'accountId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'accountData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbaccounts.editAccount = function(accountId,accountData, cb) {
    	if (!isNull(accountData["meta"])) {
            accountData = accountData["meta"];
        }

        Qbaccounts.findOne({"accountId":accountId}).then(accountInfo=>{
        	if(isValidObject(accountInfo)){
        		accountData["Id"] = accountInfo["metaData"]["Account"]["Id"];
        		funCallApi(QB_URLS["EDIT_ACCOUNT"], accountData, "POST").then(responseData => {
		            if (responseData["success"]) {
		            	accountInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBAccount Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
		            console.log(JSON.stringify(err));
		            let returnMsg = err;
		            if (!isNull(err["body"]["Fault"])) {
		                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
		            }
		            cb(new HttpErrors.InternalServerError((returnMsg), {
		                expose: false
		            }));
		        });
        	}else{
        		cb(new HttpErrors.InternalServerError('The account Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching account info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbaccounts.remoteMethod(
        'getAccount', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'accountId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbaccounts.getAccount = function(accountId, cb) {

        Qbaccounts.findOne({"accountId":accountId}).then(accountInfo=>{
        	if(isValidObject(accountInfo)){
        		let qbAccId = accountInfo["metaData"]["Account"]["Id"];
        		let _url = QB_URLS["GET_ACCOUNT"].replace("[ACCOUNTID]",qbAccId);

        		funCallApi(_url, {}, "GET").then(responseData => {
		            if (responseData["success"]) {
		            	accountInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBAccount Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
		            console.log(JSON.stringify(err));
		            let returnMsg = err;
		            if (!isNull(err["body"]["Fault"])) {
		                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
		            }
		            cb(new HttpErrors.InternalServerError((returnMsg), {
		                expose: false
		            }));
		        });
        	}else{
        		cb(new HttpErrors.InternalServerError('The account Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching account info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }



};