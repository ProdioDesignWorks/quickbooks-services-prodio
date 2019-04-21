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

const QBAPIHandler = require('../../utility/apis_handler');

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

        let lbModels = Qbaccounts.app.models;

        Qbaccounts.findOne({"where":{"accountId":accountId}}).then(accountInfo=>{
        	if(isValidObject(accountInfo)){
        		cb(new HttpErrors.InternalServerError('The account Id already exists.', {
		           expose: false
		    	}));
        	}else{
        		QBAPIHandler.funCallApi(QB_URLS["CREATE_ACCOUNT"], accountData,"POST", lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	Qbaccounts.create({"accountId":accountId,"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
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

        let lbModels = Qbaccounts.app.models;

        Qbaccounts.findOne({"where":{"accountId":accountId}}).then(accountInfo=>{
        	if(isValidObject(accountInfo)){
        		accountData["Id"] = accountInfo["metaData"]["Account"]["Id"];
        		accountData["SyncToken"] = parseInt(accountInfo["metaData"]["Account"]["SyncToken"]);

        		QBAPIHandler.funCallApi(QB_URLS["EDIT_ACCOUNT"], accountData, "POST",lbModels).then(responseData => {
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

    	let lbModels = Qbaccounts.app.models;

        Qbaccounts.findOne({"where":{"accountId":accountId}}).then(accountInfo=>{
        	if(isValidObject(accountInfo)){
        		let qbAccId = accountInfo["metaData"]["Account"]["Id"];
        		let _url = QB_URLS["GET_ACCOUNT"].replace("[ACCOUNTID]",qbAccId);

        		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
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