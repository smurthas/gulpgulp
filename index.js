#!/usr/bin/env node

var qs = require('querystring');
var fs = require('fs');
var moment = require('moment-timezone');

var express = require('express');

var app = express();


var AUTH_FILE = process.env.HOME + '/.fitbit_auth.json';

var request = require('request');

var CONSUMER_KEY = process.env.FITBIT_CONSUMER_KEY;
var CONSUMER_SECRET = process.env.FITBIT_CONSUMER_SECRET;

var oauth = {
  callback: 'https://smurthas.com/callback/',
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET
};

var url = 'https://api.fitbit.com/oauth/request_token';

function doAuth(callback) {
  request.post({url:url, oauth:oauth}, function (e, r, body) {
    var req_data = qs.parse(body);
    var uri = 'https://api.fitbit.com/oauth/authenticate' +
      '?' + qs.stringify({oauth_token: req_data.oauth_token});

    console.log('Open', uri);

    var readline = require('readline');

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Paste in the PIN here:', function(answer) {
      rl.close();

      var oauth = {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
        token: req_data.oauth_token,
        token_secret: req_data.oauth_token_secret,
        verifier: answer
      };

      var url = 'https://api.fitbit.com/oauth/access_token';
      request.post({url:url, oauth:oauth}, function (e, r, body) {
        console.error('e', e);
        console.error('body', qs.parse(body));
        callback(null, qs.parse(body));
      });
    });
  });
}

function readAuthFromEnv() {
  if (process.env.FITBIT_OAUTH_TOKEN && process.env.FITBIT_OAUTH_TOKEN_SECRET) {
    return {
      oauth_token: process.env.FITBIT_OAUTH_TOKEN,
      oauth_token_secret: process.env.FITBIT_OAUTH_TOKEN_SECRET,
    };
  }
}

function readAuthFromFile(callback) {
  fs.readFile(AUTH_FILE, function(err, data) {
    if (err) {
      return callback(err, data);
    }

    try {
      data = JSON.parse(data);
    } catch(err) {
      return callback(err, data);
    }

    callback(null, data);
  });
}

function writeAuthToFile(auth, callback) {
  fs.writeFile(AUTH_FILE, JSON.stringify(auth, 2, 2), callback);
}

function getAuth(callback) {
  readAuthFromFile(function(err, auth) {
    if (!err && auth) {
      return callback(null, auth);
    }

    auth = readAuthFromEnv();

    if (auth && auth.oauth_token) {
      return callback(null, auth);
    }

    doAuth(function(err, perm_data) {
      if (!err && perm_data) {
        return writeAuthToFile(perm_data, function(err) {
          if (err) {
            console.error('err', err);
          }

          callback(null, perm_data);
        });
      }
    });
  });
}

function getOAuth(callback) {
  getAuth(function(err, perm_data) {
    var oauth = {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      token: perm_data.oauth_token,
      token_secret: perm_data.oauth_token_secret
    };
    callback(err, oauth);
  });
}

function getWater(date, callback) {
  getOAuth(function(err, oauth) {
    var url = 'https://api.fitbit.com/1/user/-/foods/log/water/date/' + date +
      '.json';
    request.get({
      url:url,
      json: true,
      oauth: oauth,
      headers: {
        'Accept-Language': 'en_US'
      }
    }, function(e, r, body) {
      callback(e, body);
    });
  });
}

function logWater(amount, date, callback) {
  getOAuth(function(err, oauth) {
    var url = 'https://api.fitbit.com/1/user/-/foods/log/water.json';
    request.post({
      url:url,
      form: {
        amount: amount,
        date: date,
        unit: 'fl oz'
      },
      oauth: oauth,
      headers: {
        'Accept-Language': 'en_US'
      }
    }, function(e, r, body) {
      callback(err, body);
    });
  });
}


app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/log/:amount', function(req, res) {
  var date = moment().tz('America/Los_Angeles').format('YYYY-MM-DD');

  function doGetWater() {
    getWater(date, function(err, getBody) {
      if (err || !getBody) {
        console.error('got err while getting water:', err);
        console.error('body from get error;', getBody);
        // send error back
        return res.status(500).json({
          err: err,
          body: getBody
        });
      }
      var oz = getBody && getBody.summary && getBody.summary.water;
      var msg = 'water|' + oz;
      console.log('replying with:', msg);
      res.status(200).send(msg);
    });
  }

  if (process.env.LOG_WATER) {
    console.log('Logging water for date:', date);
    logWater(req.params.amount, date, function(err, logBody) {
      if (err || !logBody) {
        console.error('got err while logging water:', err);
        console.error('body from log error:', logBody);
        // send error back
        return res.status(500).json({
          err: err,
          body: logBody
        });
      }

      doGetWater();
    });
  } else {
    console.log('Just getting water for date:', date);
    doGetWater();
  }

});

var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;

  console.log('Listening on port', port);
});

