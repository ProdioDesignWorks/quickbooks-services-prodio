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

module.exports = function(Qbvendors) {

	Qbvendors.remoteMethod(
        'createVendor', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'vendorId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'vendorData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbvendors.createVendor = function(vendorId,vendorData, cb) {
    	if (!isNull(vendorData["meta"])) {
            vendorData = vendorData["meta"];
        }
        let lbModels = Qbvendors.app.models;

        Qbvendors.findOne({"where":{"vendorId":vendorId}}).then(vendorInfo=>{
        	if(isValidObject(vendorInfo)){
        		cb(new HttpErrors.InternalServerError('The vendor Id already exists.', {
		           expose: false
		    	}));
        	}else{
        		QBAPIHandler.funCallApi(QB_URLS["CREATE_VENDOR"], vendorData,"POST", lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	Qbvendors.create({"vendorId":vendorId,"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBVendor Info.', {
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
        	cb(new HttpErrors.InternalServerError('Error while searching vendor info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbvendors.remoteMethod(
        'editVendor', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'vendorId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'vendorData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbvendors.editVendor = function(vendorId,vendorData, cb) {
    	if (!isNull(vendorData["meta"])) {
            vendorData = vendorData["meta"];
        }

        let lbModels = Qbvendors.app.models;

        Qbvendors.findOne({"where":{"vendorId":vendorId}}).then(vendorInfo=>{
        	if(isValidObject(vendorInfo)){
        		vendorData["Id"] = vendorInfo["metaData"]["Vendor"]["Id"];
        		vendorData["SyncToken"] = parseInt(vendorInfo["metaData"]["Vendor"]["SyncToken"]);

        		QBAPIHandler.funCallApi(QB_URLS["EDIT_VENDOR"], vendorData, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	vendorInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
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
        		cb(new HttpErrors.InternalServerError('The vendor Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching vendor info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbvendors.remoteMethod(
        'getVendor', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'vendorId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbvendors.getVendor = function(vendorId, cb) {

    	let lbModels = Qbvendors.app.models;

        Qbvendors.findOne({"where":{"vendorId":vendorId}}).then(vendorInfo=>{
        	if(isValidObject(vendorInfo)){
        		let qbVenId = vendorInfo["metaData"]["Vendor"]["Id"];
        		let _url = QB_URLS["GET_VENDOR"].replace("[VENDORID]",qbVenId);

        		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	vendorInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBVendor Info.', {
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
        		cb(new HttpErrors.InternalServerError('The vendor Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching vendor info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbvendors.remoteMethod(
        'deleteVendor', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'vendorId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbvendors.deleteVendor = function(vendorId, cb) {
    	let lbModels = Qbvendors.app.models;

        Qbvendors.findOne({"where":{"vendorId":vendorId}}).then(vendorInfo=>{
        	if(isValidObject(vendorInfo)){
        		let qbVendId = vendorInfo["metaData"]["Vendor"]["Id"];
        		let _url = QB_URLS["DELETE_VENDOR"].replace("[VENDORID]",qbVendId);
        		let deleteJson = {
						    "domain": vendorInfo["metaData"]["Vendor"]["domain"],
						    "sparse": true,
						    "Id": qbVendId,
						    "SyncToken": vendorInfo["metaData"]["Vendor"]["SyncToken"],
						    "Active": false
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	vendorInfo.updateAttributes({"isActive": false}).then(success=>{
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
        		cb(new HttpErrors.InternalServerError('The VENDOR Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching vendor info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbvendors.remoteMethod(
        'getAllVendors', {
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

    Qbvendors.getAllVendors = function(pageNo, cb) {
    	let lbModels = Qbvendors.app.models;
    	let limit = 10; let startPos = parseInt(pageNo) * parseInt(limit);

    	let _query = "Select * from Vendor startposition "+startPos+" maxresults "+limit;

        let _url = QB_URLS["GETALL_VENDORS"].replace("[QUERY]",_query);

		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
            if (responseData["success"]) {
            	cb(null, {"success":true,"body": responseData["body"]["QueryResponse"]["Vendor"] });
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
