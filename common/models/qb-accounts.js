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
    QB_URLS,QB_TERMS
} = require('../../config/constants');


let configFile = '../../config/QBConfig.dev.json';
console.log(process.env.NODE_ENV);

switch(process.env.NODE_ENV){
  case "alpha":
    configFile = '../../config/QBConfig.alpha.json';
  break;
  case "prod":
    configFile = '../../config/QBConfig.prod.json';
  break;
}

var config = require(configFile);


module.exports = function(Qbaccounts) {

	Qbaccounts.remoteMethod(
        'createAccount', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{ arg: 'accountData', type: 'object', required: true, http: { source: 'body'} }
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    async function funCallApi(actionName,requestData){
    	return await funQBAPICall(actionName,requestData);
    }

    async function funQBAPICall(actionName,requestData){
    	return new Promise((resolve, reject) => {
    		Qbaccounts.app.models.Oauth2Data.renewToken(function(err,res){
	    		var url = config.api_uri + res.oauth_info.realmId + QB_URLS["CREATE_ACCOUNT"];
		          console.log('Making API call to: ' + url)
		          var requestObj = {
		            url: url,
		            headers: {
		              'Authorization': 'Bearer ' + res.oauth_info.accessToken,
		              'Accept': 'application/json',
		              'content-type': 'application/json',
		            },
		            body: requestData,
		            json: true
		          };

		        request.post(requestObj, function(err, response) {
		          
		          if (err) {		            
		             reject({"success":false,"errorMessage":'Error while requesting data '+JSON.stringify(err)});
		          }

		          if (response.statusCode == 401 && trycount < 1) {
		            console.log('401 response obtained, Renewing token');
		           // let token = await renewToken(oauth2data); 
		            Oauth2data.renewToken().then(tokenInfo=>{
		                if(tokenInfo) {
		                	 funQBAPICall(actionName,oauthData,requestData);
		                }else{
		                    reject({"success":false,"errorMessage":"Invalid Token Info","body":null});
		                }
		            }).catch(err=>{
		                reject({"success":false,"errorMessage":JSON.stringify(err),"body":null});
		            });
		          }else{
		              console.log('Response body: ', response.body);
		              console.log('Response header: ', response.headers);
		              //res.send(response.body);

		              if(!isNull(response.body["Fault"])){
		              	reject({"success":false,"errorMessage":"Invalid Payload Request","body":response.body});
		              }else{
		              	resolve({ "success": true, 'body': response.body });
		          	  }
		          }
		        });
		    });
    	});
    }

    Qbaccounts.createAccount = function (accountData, cb) {
    	

    	funCallApi(QB_URLS["CREATE_ACCOUNT"],accountData).then(responseData=>{
    		if(responseData["success"]){
    			cb(null,responseData);
    		}else{
    			cb(new HttpErrors.InternalServerError(responseData["errorMessage"], {
	                expose: false
	            }));
    		}
			
		}).catch(err=>{
			console.log(JSON.stringify(err));
			let returnMsg = err;
			if(!isNull(err["body"]["Fault"])){
				returnMsg = err["body"]["Fault"]["Error"][0]["Detail"];
			}
			cb(new HttpErrors.InternalServerError((returnMsg), {
	                expose: false
	            }));
		});
    }


};
