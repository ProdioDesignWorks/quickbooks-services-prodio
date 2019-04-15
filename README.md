#### Setup

Install NPM dependencies:
```
npm install
```

Launch app:
```
node app.js
```
### Configuring app

All configuration for this app is located in `config.json`.  Locate and open this file.

We will need to update 3 items:

- `clientId`
- `clientSecret`
- `redirectUri`

All of these values must match **exactly** with what is listed in your app settings on [developer.intuit.com](https://developer.intuit.com).  If you haven't already created an app, you may do so there.  Please read on for important notes about client credentials, scopes, and redirect urls.

#### Client Credentials

Once you have created an app on Intuit's Developer Portal, you can find your credentials (Client ID and Client Secret) under the "Keys" section.  These are the values you'll have to copy into `config.json`.

#### Redirect URI

You'll have to set a Redirect URI in both `config.json` *and* the Developer Portal ("Keys" section).

**Note:** Using `localhost` and `http` will only work when developing, using the sandbox credentials.  Once you use production credentials, you'll need to host your app over `https`.


### Route information

#### Authenticate by user to create connection
	http://localhost:3000/connect-quickbook

#### Renew access token manually
	http://localhost:3000/renew-token

#### Call sample api
	http://localhost:3000/call-api