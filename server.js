const path = require('path')
const fs = require('fs')
const https = require('https')
const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');

webPush.setVapidDetails(
  //your email,
  //VAPID_PUBLIC_KEY,
  // process.env.VAPID_PRIVATE_KEY
);

const app = express();
const html = fs.readFileSync('index.html', 'utf8');
const certOptions = {
  key: fs.readFileSync(path.resolve('./ssl/server.key')),
  cert: fs.readFileSync(path.resolve('./ssl/server.crt'))
}

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use('/dist', express.static(__dirname + '/dist'));
app.use('/', express.static(__dirname + '/'));
app.use('/resources', express.static(__dirname + '/resources'));

app.get('/', (req, res) => { res.send(html) });

app.post('/push/subscribe', function (req, res) {
  console.log("REQ",req.body);
  const subscription = {
      endpoint: req.body.endpoint,
      keys: {
        p256dh: req.body.keys.p256dh,
        auth: req.body.keys.auth
      }
    };
    
  const payload = JSON.stringify({
    title: 'Welcome',
    body: 'Thank you for enabling push notifications',
    icon: '/android-chrome-192x192.png'
  });

  const options = {
      TTL: 3600 // 1sec * 60 * 60 = 1h
  };

  webPush.sendNotification(
      subscription, 
      payload,
      options
      ).then(function() {
        console.log('Send welcome push notification');
        res.status(200).send('subscribe');
        return;
      }).catch(err => {
        console.error('Unable to send welcome push notification', err );
        res.status(500).send('subscription not possible');
        return;
    });
})

app.post('/push/unsubscribe', function (req, res) {
  // remove from database
  webPush.findOneAndRemove({endpoint: endpoint}, function (err,data) {
    if (err) { 
      console.error('error with unsubscribe', error);
      res.status(500).send('unsubscription not possible'); 
    }
    console.log('unsubscribed');
    res.status(200).send('unsubscribe');
  });
})


const server = https.createServer(certOptions, app).listen(3000,() => console.log('started on 3000'))



