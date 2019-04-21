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

module.exports = function(Qbemployees) {

	Qbemployees.remoteMethod(
        'createEmployee', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'employeeId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'employeeData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbemployees.createEmployee = function(employeeId,employeeData, cb) {
    	if (!isNull(employeeData["meta"])) {
            employeeData = employeeData["meta"];
        }
        let lbModels = Qbemployees.app.models;

        Qbemployees.findOne({"where":{"employeeId":employeeId}}).then(employeeInfo=>{
        	if(isValidObject(employeeInfo)){
        		cb(new HttpErrors.InternalServerError('The customer Id already exists.', {
		           expose: false
		    	}));
        	}else{
        		QBAPIHandler.funCallApi(QB_URLS["CREATE_EMPLOYEE"], employeeData,"POST", lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	Qbemployees.create({"employeeId":employeeId,"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBEmployee Info.', {
			                    expose: false
			                }));
		    			})
		                
		            } else {
		                cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
		                    expose: false
		                }));
		            }

		        }).catch(err => {
                    console.log(err);
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
        	cb(new HttpErrors.InternalServerError('Error while searching employee info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbemployees.remoteMethod(
        'editEmployee', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'employeeId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'employeeData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbemployees.editEmployee = function(employeeId,employeeData, cb) {
    	if (!isNull(employeeData["meta"])) {
            employeeData = employeeData["meta"];
        }

        let lbModels = Qbemployees.app.models;

        Qbemployees.findOne({"where":{"employeeId":employeeId}}).then(employeeInfo=>{
        	if(isValidObject(employeeInfo)){
        		employeeData["Id"] = employeeInfo["metaData"]["Employee"]["Id"];
        		employeeData["SyncToken"] = parseInt(employeeInfo["metaData"]["Employee"]["SyncToken"]);

        		QBAPIHandler.funCallApi(QB_URLS["EDIT_EMPLOYEE"], employeeData, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	employeeInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
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
        		cb(new HttpErrors.InternalServerError('The employee Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching employee info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbemployees.remoteMethod(
        'getEmployee', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'employeeId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbemployees.getEmployee = function(employeeId, cb) {

    	let lbModels = Qbemployees.app.models;

        Qbemployees.findOne({"where":{"employeeId":employeeId}}).then(employeeInfo=>{
        	if(isValidObject(employeeInfo)){
        		let qbCustId = employeeInfo["metaData"]["Employee"]["Id"];
        		let _url = QB_URLS["GET_EMPLOYEE"].replace("[EMPLOYEEID]",qbCustId);

        		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	employeeInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
		    				cb(null, responseData);
		    			}).catch(err=>{
		    				cb(new HttpErrors.InternalServerError('Error While Saving QBEmployee Info.', {
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
        		cb(new HttpErrors.InternalServerError('The employee Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching Employee info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbemployees.remoteMethod(
        'deleteEmployee', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'employeeId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbemployees.deleteEmployee = function(employeeId, cb) {
    	let lbModels = Qbemployees.app.models;

        Qbemployees.findOne({"where":{"employeeId":employeeId}}).then(employeeInfo=>{
        	if(isValidObject(employeeInfo)){
        		let qbCustId = employeeInfo["metaData"]["Employee"]["Id"];
        		let _url = QB_URLS["DELETE_EMPLOYEE"].replace("[EMPLOYEEID]",qbCustId);
        		let deleteJson = {
						    "domain": employeeInfo["metaData"]["Employee"]["domain"],
						    "sparse": true,
						    "Id": qbCustId,
						    "SyncToken": employeeInfo["metaData"]["Employee"]["SyncToken"],
						    "Active": false
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	employeeInfo.updateAttributes({"isActive": false}).then(success=>{
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


    Qbemployees.remoteMethod(
        'getAllEmployees', {
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

    Qbemployees.getAllEmployees = function(pageNo, cb) {
    	let lbModels = Qbemployees.app.models;
    	let limit = 10; let startPos = parseInt(pageNo) * parseInt(limit);

    	let _query = "Select * from Employee startposition "+startPos+" maxresults "+limit;

        let _url = QB_URLS["GETALL_EMPLOYEES"].replace("[QUERY]",_query);

		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
            if (responseData["success"]) {
            	cb(null, {"success":true,"body": responseData["body"]["QueryResponse"]["Employee"] });
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
