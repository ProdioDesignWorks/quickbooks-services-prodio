var express = require('express');
var app = express();
var session = require('express-session');
var request = require('request');
var ClientOAuth2 = require('client-oauth2');
var csrf = new (require('csrf'))();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let portNumber = 7000;

var config = require('./config.json');

app.use(session({secret: 'secret', resave: 'false', saveUninitialized: 'false'}));


// Database Initialization
let db_host = 'mongodb://localhost:27017/quickbooks-online-dev'
mongoose.Promise = global.Promise;
mongoose.connect(db_host).then(() => {
  console.log('\x1b[32m%s\x1b[0m', 'Database Connection Established!');
});
mongoose.connection.on("error", err => {
  console.log(
    "%s MongoDB connection error. Please make sure MongoDB is running (" +
    db_host +
    ").",
    chalk.red("✗")
  );
  process.exit();
});
const Oauth2Data = mongoose.model('Oauth2Data', new Schema({
  accessToken: {type: String},
  refreshToken: {type: String},
  tokenType: {type: String},
  realmId: {type: String},
  expires: {type: Date},
  refreshTokenExpires: {type: Date}
}));


// Initialize quickbooks configurations
var authConfig = {
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  redirectUri: config.redirectUri,
  accessTokenUri: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
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

  
// Function to renew token
let renewToken = async (data) => {
  if(!data.accessToken) return null;

  let token = intuitAuth.createToken(
    data.accessToken, data.refreshToken,
    data.tokenType
  )
  await token.refresh().then(async (newToken) => {
    console.log('New token: ', newToken);
    let oauth2data = await Oauth2Data.findOneAndUpdate({
      }, {$set: {
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        tokenType: newToken.tokenType,
        expires: newToken.expires,
        refreshTokenExpires: parseInt((new Date()).getTime()) + (newToken.data.x_refresh_token_expires_in * 1000)
      }}, {
        upsert: true,
        returnNewDocument: true
      }
    );
    console.log('Database updated ', oauth2data);
    token = newToken;
  })
  return token;
}


// API to get user authentication
app.get('/connect-quickbook', function(req, res) {
  authConfig.scopes = [
    "com.intuit.quickbooks.accounting",
    "com.intuit.quickbooks.payment"
  ];
  let generateAntiForgery = function(session) {
    session.secret = csrf.secretSync()
    return csrf.create(session.secret)
  }
  var uri = intuitAuth.code.getUri({
    state: generateAntiForgery(req.session)
  })

  console.log('Redirecting to authorization uri: ' + uri)
  res.redirect(uri)
});

// Handle callback from quickbooks
app.get('/callback', function (req, res) {
  console.log('/callback is invoked from quickbook, with: ');
  console.log({query: req.query, body: req.body});
  
  // Verify anti-forgery
  if (!csrf.verify(req.session.secret, req.query.state)) {
    return res.send('Error - invalid anti-forgery CSRF response!')
  }

  // Exchange auth code for access token
  intuitAuth.code.getToken(req.originalUrl).then(async (token) => {
    console.log(token);

    await Oauth2Data.findOneAndUpdate({
      }, {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenType: token.tokenType,
        expires: token.expires,
        refreshTokenExpires: parseInt((new Date()).getTime()) + (token.data.x_refresh_token_expires_in * 1000),
        realmId: req.query.realmId
      }, {
        upsert: true
      }
    );
    console.log('Database updated');

    res.json({data: token.data});
  }, function (err) {
    console.log(err)
    res.send(err)
  })
})


app.get('/call-api', async (req, res) => {
  let oauth2data = await Oauth2Data.findOne().lean();
  if (!oauth2data) res.status(401).send();
  
  console.log((oauth2data.expires.getTime() - (new Date())));
  if ((oauth2data.expires.getTime() - (new Date())) < 3000) { // if expired token or will be expired in 3 sec
    console.log('Renewing token');
    let token = await renewToken(oauth2data);  
    oauth2data = await Oauth2Data.findOne().lean();
  }

  // Set up API call (with OAuth2 accessToken)
  //https://developer.intuit.com/v2/apiexplorer?apiname=V3QBO#?id=Attachable
  var url = config.api_uri + oauth2data.realmId + '/attachable?minorversion=4';
  console.log('Making API call to: ' + url)
  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + oauth2data.accessToken,
      'Accept': 'application/json',
      'content-type': 'application/json',
    },
    body: {
      "AttachableRef": [
        {
          "EntityRef": {
            "value": "95",
            "type": "Invoice"
          },
          "IncludeOnSend": "false"
        }
      ],
      "Note": "This is an attached note."
    },
    json: true
  };

  // Make API call
  let trycount = 0;
  let callApi = function() {
    console.log('Sendign api req: ', requestObj);
    request.post(requestObj, async function(err, response) {
      console.log({err});
      if (err) return res.send(err);

      if (response.statusCode == 401 && trycount < 1) {
        console.log('401 response obtained, Renewing token');
        let token = await renewToken(oauth2data);  
        if(token) {
          requestObj.headers.Authorization = 'Bearer ' + token.accessToken;
          return callApi();
        }
      }
      console.log('Response body: ', response.body);
      console.log('Response header: ', response.headers);
      res.send(response.body);
    })
  };
  callApi();
});

app.get('/renew-token', async (req, res) => {
  let oauth2data = await Oauth2Data.findOne().lean();
  if (!oauth2data) res.status(401).send();
  let token = await renewToken(oauth2data);
  res.json(token.data);
});

app.listen(portNumber, function () {
  console.log('Example app listening on port 3000!')
});

/*
### Route information

Authenticate by user to create connection
    http://localhost:7000/connect-quickbook

Renew access token manually
    http://localhost:7000/renew-token

Call sample api
    http://localhost:7000/call-api
*/
