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
    isNull,
    convertObjectIdToString
} = require('../../utility/helper');
const {
    QB_URLS,
    QB_TERMS,
    config
} = require('../../config/constants');

const QBAPIHandler = require('../../utility/apis_handler');

module.exports = function(Qbpayments) {

	Qbpayments.remoteMethod(
        'createPayment', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'paymentId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'paymentInvoiceId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'paymentData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbpayments.createPayment = function(paymentId,paymentInvoiceId,customerId,paymentData, cb) {
    	if (!isNull(paymentData["meta"])) {
            paymentData = paymentData["meta"];
        }
        let lbModels = Qbpayments.app.models;

        lbModels.QBCustomers.findOne({"where":{"customerId":convertObjectIdToString(customerId)}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		let customerRef = customerInfo["metaData"]["Customer"]["Id"];
        		let customerName = customerInfo["metaData"]["Customer"]["DisplayName"];
        		//console.log({"where":{"paymentId":convertObjectIdToString(paymentId)}});
        		//console.log({"where":{"customerId":convertObjectIdToString(customerId)}})
        		lbModels.QBPayments.findOne({"where":{"paymentId":convertObjectIdToString(paymentId)}}).then(paymentInfo=>{
		        	if(isValidObject(paymentInfo)){
		        		cb(new HttpErrors.InternalServerError('The payment Id already exists.', {
				           expose: false
				    	}));
		        	}else{
		        		paymentData["CustomerRef"] = {"value":customerRef,"name":customerName};

		        		if(isNull(paymentInvoiceId)){
		        			QBAPIHandler.funCallApi(QB_URLS["CREATE_PAYMENT"], paymentData,"POST", lbModels).then(responseData => {
					            if (responseData["success"]) {
					            	Qbpayments.create({"paymentId":convertObjectIdToString(paymentId),"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
					    				cb(null, responseData);
					    			}).catch(err=>{
					    				cb(new HttpErrors.InternalServerError('Error While Saving QBPayment Info.', {
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
		        			lbModels.QBInvoices.findOne({"where":{"paymentInvoiceId":convertObjectIdToString(paymentInvoiceId) }}).then(invoiceInfo=>{
		        				if(isValidObject(invoiceInfo)){
		        					let invoiceRef = invoiceInfo["metaData"]["Invoice"]["Id"];

		        					invoiceData["Line"] =  [
									    {
									        "Amount": paymentData["TotalAmt"],
									        "LinkedTxn": [
									        {
									            "TxnId": invoiceRef,
									            "TxnType": "Invoice"
									        }]
    									}];

    								QBAPIHandler.funCallApi(QB_URLS["CREATE_PAYMENT"], invoiceData,"POST", lbModels).then(responseData => {
							            if (responseData["success"]) {
							            	Qbpayments.create({"paymentId":convertObjectIdToString(paymentId),"metaData":responseData["body"],"isActive":true,"createdAt":new Date()}).then(success=>{
							    				cb(null, responseData);
							    			}).catch(err=>{
							    				cb(new HttpErrors.InternalServerError('Error While Saving QBPayment Info.', {
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
		        					cb(new HttpErrors.InternalServerError('Invalid Invoice Id.', {
							           expose: false
							    	}));
		        				}
		        			}).catch(err=>{

		        			})
		        		}
		        		
		        	}

		        })
		      //   .catch(err=>{
		      //   	cb(new HttpErrors.InternalServerError('Error while searching payment info '+JSON.stringify(err), {
				    //             expose: false
				    // }));
		      //   })
        	}else{
        		cb(new HttpErrors.InternalServerError('Invalid payment Id.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer Info.', {
		           expose: false
		    	}));
        });
    }


    Qbpayments.remoteMethod(
        'editPayment', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'paymentId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'paymentInvoiceId', type: 'string', required: false, http: { source: 'query' }},
            	{ arg: 'customerId', type: 'string', required: true, http: { source: 'query' }},
            	{ arg: 'paymentData', type: 'object', required: true, http: { source: 'body' }}
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbpayments.editPayment = function(paymentId,paymentInvoiceId,customerId,paymentData, cb) {
    	if (!isNull(paymentData["meta"])) {
            paymentData = paymentData["meta"];
        }

        let lbModels = Qbpayments.app.models;

        lbModels.QBCustomers.findOne({"where":{"customerId":convertObjectIdToString(customerId)}}).then(customerInfo=>{
        	if(isValidObject(customerInfo)){
        		let customerRef = customerInfo["metaData"]["Customer"]["Id"];
        		let customerName = customerInfo["metaData"]["Customer"]["DisplayName"];

        		Qbpayments.findOne({"where":{"paymentId":convertObjectIdToString(paymentId)}}).then(paymentInfo=>{
		        	if(isValidObject(paymentInfo)){
		        		invoiceData["Id"] = paymentInfo["metaData"]["Payment"]["Id"];
		        		invoiceData["SyncToken"] = parseInt(paymentInfo["metaData"]["Payment"]["SyncToken"]);

		        		invoiceData["CustomerRef"] = {"value":customerRef,"name":customerName};

		        		if(isNull(paymentInvoiceId)){
		        			QBAPIHandler.funCallApi(QB_URLS["EDIT_PAYMENT"], invoiceData, "POST",lbModels).then(responseData => {
					            if (responseData["success"]) {
					            	paymentInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
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

		        			lbModels.QBInvoices.findOne({"where":{"paymentInvoiceId":convertObjectIdToString(paymentInvoiceId) }}).then(invoiceInfo=>{
		        				if(isValidObject(invoiceInfo)){
		        					let invoiceRef = invoiceInfo["metaData"]["Invoice"]["Id"];

		        					invoiceData["Line"] =  [
									    {
									        "Amount": paymentData["TotalAmt"],
									        "LinkedTxn": [
									        {
									            "TxnId": invoiceRef,
									            "TxnType": "Invoice"
									        }]
    									}];

    								QBAPIHandler.funCallApi(QB_URLS["EDIT_PAYMENT"], invoiceData, "POST",lbModels).then(responseData => {
							            if (responseData["success"]) {
							            	paymentInfo.updateAttributes({"metaData":responseData["body"]}).then(success=>{
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
    								cb(new HttpErrors.InternalServerError('Invalid Invoice Id.', {
							           expose: false
							    	}));
    							}
    						});

		        		}
		        		
		        	}else{
		        		cb(new HttpErrors.InternalServerError('The payment Id does not exists.', {
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


    Qbpayments.remoteMethod(
        'getPayment', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbpayments.getPayment = function(paymentId, cb) {

    	let lbModels = Qbpayments.app.models;

        Qbpayments.findOne({"where":{"paymentId":convertObjectIdToString(paymentId)}}).then(paymentInfo=>{
        	if(isValidObject(paymentInfo)){
        		let qbInvId = paymentInfo["metaData"]["Payment"]["Id"];
        		let _url = QB_URLS["GET_PAYMENT"].replace("[PAYMENTID]",qbInvId);

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
        		cb(new HttpErrors.InternalServerError('The payment Id does not exists.', {
		           expose: false
		    	}));
        		
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }


    Qbpayments.remoteMethod(
        'deletePayment', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide customer details"],
            accepts: [
            	{ arg: 'paymentId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Qbpayments.deletePayment = function(paymentInvoiceId, cb) {
    	let lbModels = Qbpayments.app.models;

        Qbpayments.findOne({"where":{"paymentId":convertObjectIdToString(paymentId)}}).then(invoiceInfo=>{
        	if(isValidObject(invoiceInfo)){
        		let qbInvId = invoiceInfo["metaData"]["Payment"]["Id"];
        		let _url = QB_URLS["DELETE_PAYMENT"].replace("[PAYMENTID]",qbInvId);
        		let deleteJson = {
						    "domain": invoiceInfo["metaData"]["Payment"]["domain"],
						    "sparse": true,
						    "Id": qbInvId,
						    "SyncToken": invoiceInfo["metaData"]["Payment"]["SyncToken"],
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
        		cb(new HttpErrors.InternalServerError('The Payment Id does not exists.', {
		           expose: false
		    	}));
        	}
        }).catch(err=>{
        	cb(new HttpErrors.InternalServerError('Error while searching customer info '+JSON.stringify(err), {
		                expose: false
		    }));
        })
    }

    Qbpayments.remoteMethod(
        'getAllPayments', {
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

    Qbpayments.getAllPayments = function(pageNo, cb) {
    	let lbModels = Qbpayments.app.models;
    	let limit = 10; let startPos = parseInt(pageNo) * parseInt(limit);

    	let _query = "Select * from Payment startposition "+startPos+" maxresults "+limit;

        let _url = QB_URLS["GETALL_PAYMENTS"].replace("[QUERY]",_query);

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
