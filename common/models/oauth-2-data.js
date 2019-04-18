'use strict';
var express = require('express');
var app = express();
var session = require('express-session');
var request = require('request');
var ClientOAuth2 = require('client-oauth2');
var csrf = new (require('csrf'))();
const HttpErrors = require('http-errors');
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

const {
    QB_URLS,QB_TERMS
} = require('../../config/constants');


var authConfig = {
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  redirectUri: config.redirectUri,
  accessTokenUri: QB_URLS["ACCESS_TOKEN_URI"],
  authorizationUri: config.authorizationUri
}
var intuitAuth = new ClientOAuth2(authConfig);
// Get latest config from configuaration endpoint of quickbooks
request({
  url: config.configurationEndpoint,
  headers: {'Accept': 'application/json'}
  }, function(err, response) {
    if(err) {
      console.log(err);
      return err;
    }
    var json = JSON.parse(response.body);
    authConfig.authorizationUri = json.authorization_endpoint;
    authConfig.accessTokenUri = json.token_endpoint;
    intuitAuth = new ClientOAuth2(authConfig);
    console.log('Authconfig updated: ', authConfig);
  }
);

module.exports = function(Oauth2data) {

	Oauth2data.remoteMethod(
        'connectQuickBooks', {
            http: {
                verb: 'get'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{
                    arg: 'req',
                    type: 'object',
                    http: ctx => {
                        return ctx.req;
                    }
                },
                {
                    arg: 'res',
                    type: 'object',
                    http: ctx => {
                        return ctx.res;
                    }
                },
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

     let generateAntiForgery = function(session) {
	    session.secret = csrf.secretSync()
	    return csrf.create(session.secret)
	 }

    Oauth2data.connectQuickBooks = (req,res, cb) => {
    	 authConfig.scopes = [
		    "com.intuit.quickbooks.accounting"
		  ];
		  //"com.intuit.quickbooks.payment"
		 
		  var uri = intuitAuth.code.getUri({
		    state: generateAntiForgery(req.session)
		  })

		  console.log('Redirecting to authorization uri: ' + uri)
		  res.redirect(uri);
    }

    Oauth2data.remoteMethod(
        'callback', {
            http: {
                verb: 'get'
            },
            description: ["This request will provide transaction details"],
            accepts: [
            	{
                    arg: 'req',
                    type: 'object',
                    http: ctx => {
                        return ctx.req;
                    }
                },
                {
                    arg: 'res',
                    type: 'object',
                    http: ctx => {
                        return ctx.res;
                    }
                },
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );


    Oauth2data.callback = (req, res, cb) => {
    	console.log('/callback is invoked from quickbook, with: ');
		  console.log({query: req.query, body: req.body});
		  
		  // Verify anti-forgery
		  if (!csrf.verify(req.session.secret, req.query.state)) {
		    //return res.send('Error - invalid anti-forgery CSRF response!');
		    cb(new HttpErrors.InternalServerError('Error - invalid anti-forgery CSRF response!', {
                expose: false
            }));
		  }

		  // Exchange auth code for access token
		intuitAuth.code.getToken(req.originalUrl).then(async (token) => {
		    //console.log(token);

		    let insertJson = {
		        accessToken: token.accessToken,
		        refreshToken: token.refreshToken,
		        tokenType: token.tokenType,
		        expires: token.expires,
		        refreshTokenExpires: parseInt((new Date()).getTime()) + (token.data.x_refresh_token_expires_in * 1000),
		        realmId: req.query.realmId
		      };
              console.log(insertJson)
              funUpsertTokenInfo(insertJson,cb);
		});
    }

    function funUpsertTokenInfo(insertJson,cb){
        Oauth2data.findOne({"where":{"realmId": insertJson["realmId"] }}).then(oauthData=>{
            if(isValidObject(oauthData)){
                oauthData.updateAttributes(insertJson).then(count=>{
                    cb(null,{"success":true,"oauth_info":insertJson});
                }).catch(err=>{
                    cb(new HttpErrors.InternalServerError('Error while updating document.', {
                        expose: false
                    }));
                    //cb(null,{"success":false,"errorMessage":"Error while updating document."});
                })
            }else{
                Oauth2data.create(insertJson).then(successData=>{
                    cb(null,{"success":true,"oauth_info":insertJson});
                }).catch(err=>{
                    cb(new HttpErrors.InternalServerError('Error while inserting document.', {
                        expose: false
                    }));
                    //cb(null,{"success":false,"errorMessage":"Error while inserting document."});
                })
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError('Error while searching data..', {
                expose: false
            }));
            //cb(null,{"success":false,"errorMessage":"Error while searching data."});
        });
    }


    Oauth2data.remoteMethod(
        'renewToken', {
            http: {
                verb: 'get'
            },
            description: ["This request will renew the token manually."],
            accepts: [
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );


    Oauth2data.renewToken = function(cb) {
        Oauth2data.findOne({"where":{}}).then(oauthData=>{
            if(isValidObject(oauthData)){
                //renewToken(oauth2data,cb);

                if ((oauthData.expires.getTime() - (new Date())) < 3000) {
                    //renew token
                    let token = intuitAuth.createToken(
                        oauthData.accessToken, oauthData.refreshToken,
                        oauthData.tokenType
                      );
                    token.refresh().then( (newToken) => {
                        console.log('New token: ', newToken);
                        let tokenInfo = {
                            accessToken: newToken.accessToken,
                            refreshToken: newToken.refreshToken,
                            tokenType: newToken.tokenType,
                            expires: newToken.expires,
                            realmId: oauthData.realmId,
                            refreshTokenExpires: parseInt((new Date()).getTime()) + (newToken.data.x_refresh_token_expires_in * 1000)
                          };

                        funUpsertTokenInfo(tokenInfo,cb);

                    });
                }else{
                    //still fresh
                    cb(null,{"success":true,"oauth_info": oauthData })
                }
            }else{
                cb(new HttpErrors.InternalServerError('Oauth tokens doesnt exists.', {
                    expose: false
                }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError('Error while searching data.', {
                expose: false
            }));
        })
    }


    Oauth2data.remoteMethod(
        'callQBApi', {
            http: {
                verb: 'get'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'actionName', type: 'string', required: true, http: { source: 'query'} },
                { arg: 'realmId', type: 'string', required: true, http: { source: 'query'} },
                { arg: 'accessToken', type: 'string', required: true, http: { source: 'query'} },
                { arg: 'requestData', type: 'object', required: true, http: { source: 'body'} }
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Oauth2data.callQBApi = function(actionName, realmId, accessToken, requestData, cb) {
        var url = config.api_uri + realmId + QB_URLS[actionName];
          console.log('Making API call to: ' + url)
          var requestObj = {
            url: url,
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Accept': 'application/json',
              'content-type': 'application/json',
            },
            body: requestData,
            json: true
          };

          console.log(requestObj);

        request.post(requestObj, function(err, response) {
          
          if (err) {
            console.log("532")
            cb(new HttpErrors.InternalServerError('Error while requesting data '+JSON.stringify(err), {
                expose: false
            }));
          }

          if (response.statusCode == 401 && trycount < 1) {
            console.log('401 response obtained, Renewing token');
           // let token = await renewToken(oauth2data); 
            Oauth2data.renewToken().then(tokenInfo=>{
                if(tokenInfo) {
                  Oauth2data.callQBApi(actionName, realmId, tokenInfo.accessToken, requestData,function(err,res){
                    cb(null,res);
                  });
                }else{
                    console.log("13241234")
                    cb(new HttpErrors.InternalServerError('Invalid token data !! ', {
                        expose: false
                    }));
                }
            }).catch(err=>{
                console.log("sdadf")
                cb(new HttpErrors.InternalServerError('Error while renewToken !! '+JSON.stringify(err), {
                    expose: false
                }));
            });
          }else{
              console.log('Response body: ', response.body);
              console.log('Response header: ', response.headers);
              //res.send(response.body);
              cb(null,response.body);
          }
        });
    }




};
