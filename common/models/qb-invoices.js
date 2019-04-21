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

module.exports = function(Qbinvoices) {

	Qbinvoices.remoteMethod(
        'createInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'invoiceData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.createInvoice = function(paymentInvoiceId,customerId,invoiceData, cb) {
    	if (!isNull(invoiceData["meta"])) {
            invoiceData = invoiceData["meta"];
        }
        let lbModels = Qbinvoices.app.models;

        lbModels.QBCustomers.findOne({"where":{"customerId":customerId}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		let customerRef = customerInfo["metaData"]["Customer"]["Id"];
        		//let customerName = customerInfo["metaData"]["Customer"]["DisplayName"];

        		Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
		        	if(isValidObject(invoiceInfo)){
		        		cb(new HttpErrors.InternalServerError('The paymentInvoice Id already exists.', {
				           expose: false
				    	}));
		        	}else{
		        		invoiceData["CustomerRef"] = {"value":customerRef};

		        		QBAPIHandler.funCallApi(QB_URLS["CREATE_INVOICE"], invoiceData,"POST", lbModels).then(responseData => {
				            if (responseData["success"]) {
				            	Qbinvoices.create({"paymentInvoiceId":paymentInvoiceId,"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
				    				cb(null, responseData);
				    			}).catch(err=>{
				    				cb(new HttpErrors.InternalServerError('Error While Saving QBInvoice Info.', {
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
		        	cb(new HttpErrors.InternalServerError('Error while searching invoice info '+JSON.stringify(err), {
				                expose: false
				    }));
		        })
        	}else{
        		cb(new HttpErrors.InternalServerError('Invalid customer Id.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer Info.', {
		           expose: false
		    	}));
        });
    }


    Qbinvoices.remoteMethod(
        'editInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'invoiceData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.editInvoice = function(paymentInvoiceId,customerId,invoiceData, cb) {
    	if (!isNull(invoiceData["meta"])) {
            invoiceData = invoiceData["meta"];
        }

        let lbModels = Qbinvoices.app.models;

        lbModels.QBCustomers.findOne({"where":{"customerId":customerId}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		let customerRef = customerInfo["metaData"]["Customer"]["Id"];
        		//let customerName = customerInfo["metaData"]["Customer"]["DisplayName"];

        		Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
		        	if(isValidObject(invoiceInfo)){
		        		invoiceData["Id"] = invoiceInfo["metaData"]["Invoice"]["Id"];
		        		invoiceData["SyncToken"] = parseInt(invoiceInfo["metaData"]["Invoice"]["SyncToken"]);

		        		invoiceData["CustomerRef"] = {"value":customerRef};

		        		QBAPIHandler.funCallApi(QB_URLS["EDIT_INVOICE"], invoiceData, "POST",lbModels).then(responseData => {
				            if (responseData["success"]) {
				            	invoiceInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
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
		        		cb(new HttpErrors.InternalServerError('The invoice Id does not exists.', {
				           expose: false
				    	}));
		        		
		        	}
		        }).catch(err=>{
		        	cb(new HttpErrors.InternalServerError('Error while searching invoice info '+JSON.stringify(err), {
				                expose: false
				    }));
		        })
        	}else{
        		cb(new HttpErrors.InternalServerError('Invalid customer Id.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer Info.', {
		           expose: false
		    	}));
        });
        
    }


    Qbinvoices.remoteMethod(
        'getInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.getInvoice = function(paymentInvoiceId, cb) {

    	let lbModels = Qbinvoices.app.models;

        Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
        	if(isValidObject(invoiceInfo)){
        		let qbInvId = invoiceInfo["metaData"]["Invoice"]["Id"];
        		let _url = QB_URLS["GET_INVOICE"].replace("[INVOICEID]",qbInvId);

        		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	invoiceInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
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


    Qbinvoices.remoteMethod(
        'deleteInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.deleteInvoice = function(paymentInvoiceId, cb) {
    	let lbModels = Qbinvoices.app.models;

        Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
        	if(isValidObject(invoiceInfo)){
        		let qbInvId = invoiceInfo["metaData"]["Invoice"]["Id"];
        		let _url = QB_URLS["DELETE_INVOICE"].replace("[INVOICEID]",qbInvId);
        		let deleteJson = {
						    "domain": invoiceInfo["metaData"]["Invoice"]["domain"],
						    "sparse": true,
						    "Id": qbInvId,
						    "SyncToken": invoiceInfo["metaData"]["Invoice"]["SyncToken"],
						    "Active": false
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	invoiceInfo.updateAttributes({"isActive": false}).then(success=>{
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
        		cb(new HttpErrors.InternalServerError('The invoice Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }

    Qbinvoices.remoteMethod(
        'voidInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.voidInvoice = function(paymentInvoiceId, cb) {
    	let lbModels = Qbinvoices.app.models;

        Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
        	if(isValidObject(invoiceInfo)){
        		let qbInvId = invoiceInfo["metaData"]["Invoice"]["Id"];
        		let _url = QB_URLS["VOID_INVOICE"].replace("[INVOICEID]",qbInvId);
        		let deleteJson = {
						    "domain": invoiceInfo["metaData"]["Invoice"]["domain"],
						    "Id": qbInvId,
						    "SyncToken": invoiceInfo["metaData"]["Invoice"]["SyncToken"]
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	invoiceInfo.updateAttributes({"isActive": false}).then(success=>{
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
        		cb(new HttpErrors.InternalServerError('The invoice Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbinvoices.remoteMethod(
        'emailInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'emailId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.voidInvoice = function(paymentInvoiceId,emailId, cb) {
    	let lbModels = Qbinvoices.app.models;

        Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
        	if(isValidObject(invoiceInfo)){
        		let qbInvId = invoiceInfo["metaData"]["Invoice"]["Id"];
        		let _url = QB_URLS["EMAIL_INVOICE"].replace("[INVOICEID]",qbInvId);
        		_url = _url.replace("[EMAILID]",emailId);

        		let deleteJson = {
        					"action":"EMAIL_INVOICE"
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	cb(null, responseData);
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
        		cb(new HttpErrors.InternalServerError('The invoice Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbinvoices.remoteMethod(
        'getPDFInvoice', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentInvoiceId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbinvoices.getPDFInvoice = function(paymentInvoiceId, cb) {
    	let lbModels = Qbinvoices.app.models;

        Qbinvoices.findOne({"where":{"paymentInvoiceId":paymentInvoiceId}}).then(invoiceInfo=>{
        	if(isValidObject(invoiceInfo)){
        		let qbInvId = invoiceInfo["metaData"]["Invoice"]["Id"];
        		let _url = QB_URLS["GET_INVOICE_PDF"].replace("[INVOICEID]",qbInvId);

        		let deleteJson = {
        					"action":"GET_INVOICE_PDF"
						};

        		QBAPIHandler.funCallApi(_url, deleteJson, "POST",lbModels).then(responseData => {
		            if (responseData["success"]) {
		            	cb(null, responseData);
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
        		cb(new HttpErrors.InternalServerError('The invoice Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }

    Qbinvoices.remoteMethod(
        'getAllInvoices', {
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

    Qbinvoices.getAllInvoices = function(pageNo, cb) {
    	let lbModels = Qbinvoices.app.models;
    	let limit = 10; let startPos = parseInt(pageNo) * parseInt(limit);

    	let _query = "Select * from Invoice startposition "+startPos+" maxresults "+limit;

        let _url = QB_URLS["GETALL_INVOICES"].replace("[QUERY]",_query);

		QBAPIHandler.funCallApi(_url, {}, "GET",lbModels).then(responseData => {
            if (responseData["success"]) {
            	cb(null, {"success":true,"body": responseData["body"]["QueryResponse"]["Invoice"] });
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
