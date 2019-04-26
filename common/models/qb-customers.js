'use strict';
const {
	HttpErrors,
	request,
	findReplace,
    unique,
    isValidObject,
    isValid,
    flattenArray,
    clean,
    isArray,
    isObject,
    print,
    isNull,
    QB_URLS,
    QB_TERMS,
    config,
    QBAPIHandler
} = require('../../utility/common');

module.exports = function(Qbcustomers) {

	Qbcustomers.remoteMethod(
        'createCustomer', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'customerId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'customerData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbcustomers.createCustomer = function(customerId,customerData, cb) {
    	if (!isNull(customerData["meta"])) {
            customerData = customerData["meta"];
        }
        let lbModels = Qbcustomers.app.models;

        Qbcustomers.findOne({"where":{"customerId":customerId}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		cb(new HttpErrors.InternalServerError('The customer Id already exists.', {
		           expose: false
		    	}));
        	}else{
        		QBAPIHandler.funCallApi(QB_URLS["CREATE_CUSTOMER"], customerData,"POST", lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	Qbcustomers.create({"customerId":customerId,"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
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
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbcustomers.remoteMethod(
        'editCustomer', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'customerData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbcustomers.editCustomer = function(customerId,customerData, cb) {
    	if (!isNull(customerData["meta"])) {
            customerData = customerData["meta"];
        }

        let lbModels = Qbcustomers.app.models;

        Qbcustomers.findOne({"where":{"customerId":customerId}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		customerData["Id"] = customerInfo["metaData"]["Customer"]["Id"];
        		customerData["SyncToken"] = parseInt(customerInfo["metaData"]["Customer"]["SyncToken"]);

        		QBAPIHandler.funCallApi(QB_URLS["EDIT_CUSTOMER"], customerData, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	customerInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBCustomer Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
		            let returnMsg = err;
		            if (!isNull(err["body"]["Fault"])) {
		                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
		            }
		            cb(new HttpErrors.InternalServerError((returnMsg), {
		                expose: false
		            }));
		        });
        	}else{
        		cb(new HttpErrors.InternalServerError('The customer Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbcustomers.remoteMethod(
        'getCustomer', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbcustomers.getCustomer = function(customerId, cb) {

    	let lbModels = Qbcustomers.app.models;

        Qbcustomers.findOne({"where":{"customerId":customerId}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		let qbCustId = customerInfo["metaData"]["Customer"]["Id"];
        		let _url = QB_URLS["GET_CUSTOMER"].replace("[CUSTOMERID]",qbCustId);

        		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	customerInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBCustomer Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
		            let returnMsg = err;
		            if (!isNull(err["body"]["Fault"])) {
		                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
		            }
		            cb(new HttpErrors.InternalServerError((returnMsg), {
		                expose: false
		            }));
		        });
        	}else{
        		cb(new HttpErrors.InternalServerError('The customer Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbcustomers.remoteMethod(
        'deleteCustomer', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbcustomers.deleteCustomer = function(customerId, cb) {
    	let lbModels = Qbcustomers.app.models;

        Qbcustomers.findOne({"where":{"customerId":customerId}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		let qbCustId = customerInfo["metaData"]["Customer"]["Id"];
        		let _url = QB_URLS["DELETE_CUSTOMER"].replace("[CUSTOMERID]",qbCustId);
        		let deleteJson = {
						    "domain": customerInfo["metaData"]["Customer"]["domain"],
						    "sparse": true,
						    "Id": qbCustId,
						    "SyncToken": customerInfo["metaData"]["Customer"]["SyncToken"],
						    "Active": false
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	customerInfo.updateAttributes({"isActive": false}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBCustomer Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
		            let returnMsg = err;
		            if (!isNull(err["body"]["Fault"])) {
		                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
		            }
		            cb(new HttpErrors.InternalServerError((returnMsg), {
		                expose: false
		            }));
		        });
        	}else{
        		cb(new HttpErrors.InternalServerError('The customer Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbcustomers.remoteMethod(
        'getAllCustomers', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'pageNo', type: 'number', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbcustomers.getAllCustomers = function(pageNo, cb) {
    	let lbModels = Qbcustomers.app.models;
    	let limit = 10; let startPos = parseInt(pageNo) * parseInt(limit);

    	let _query = "Select * from Customer startposition "+startPos+" maxresults "+limit;

        let _url = QB_URLS["GETALL_CUSTOMERS"].replace("[QUERY]",_query);

		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
            if (responseData["success"]) {
            	cb(null, {"success":true,"body": responseData["body"]["QueryResponse"]["Customer"] });
            } else {
                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
                    expose: false
                }));
            }

        }).catch(err => {
            let returnMsg = err;
            if (!isNull(err["body"]["Fault"])) {
                returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
            }
            cb(new HttpErrors.InternalServerError((returnMsg), {
                expose: false
            }));
        });
    }

};
