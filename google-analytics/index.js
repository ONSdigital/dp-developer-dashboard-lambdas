const fetch = require('node-fetch');
const {google} = require('googleapis');
const analytics = google.analytics('v3');
const OAuth2 = google.auth.OAuth2;
const Firebase = require('firebase');
const crypto = require('crypto-js');
const authKey = process.env.AUTH_KEY;
const authFilePath = process.env.AUTH_FILE_PATH;

const firebaseConfig = {
    apiKey: process.env.FIREBASE_KEY,
    databaseURL: "https://" + process.env.FIREBASE_DB_NAME + ".firebaseio.com"
};

const gaTableID = process.env.GA_TABLE_ID;

const loadCredentials = new Promise((resolve, reject) => {
    if (!authKey) {
        reject("Unable to encrypt auth file because no pass key provided");
        return;
    }

    const encryptedAuthFile = fetch(authFilePath)
        .then(response => {
            if (!response.ok) {
                console.error(response.status);
                reject(response.statusText);
                return;
            }
            return response.text();
        })
        .then(body => {
        const decryptedBytes = crypto.AES.decrypt(body, authKey);
        const decryptedJSON = JSON.parse(decryptedBytes.toString(crypto.enc.Utf8));
        const client = new google.auth.JWT(
            decryptedJSON.client_email,
            null,
            decryptedJSON.private_key,
            ['https://www.googleapis.com/auth/analytics', 'https://www.googleapis.com/auth/analytics.readonly']
        );
        resolve(client);
    }).catch(error => {
        reject(error);
    });
});

const activeUsersUpdate = (context, options, count) => {
    analytics.data.realtime.get(options, (error, response) => {
        console.log("Got response from analytics API (" + count + ")")
        if (error) {
            context.fail(error);
            return;
        }
        let activeUsers = response.data.totalsForAllResults['rt:activeUsers'];
        console.log("Got realtime active users (" + activeUsers + ")");

        try {
            activeUsers = parseInt(activeUsers);
        } catch (error) {
            console.error("Error parsing active users to integer");
            context.fail(error);
            return;
        }

        Firebase.database().ref("analytics").child('active_users')
            .set(activeUsers)
            .then(() => {
                timer(context, options, count);
            })
            .catch(error => {
                console.error('Firebase error: ', error);
                context.fail(error);
            });       
    });
}

const timerDelay = 10000;
const timer = (context, options, count) => {
    count++
    if (count > 6) {
        context.succeed();
        return;
    }
    setTimeout(() => {
        activeUsersUpdate(context, options, count);
    }, timerDelay);
}

exports.handler = (_, context, callback) => {
    if (!Firebase.apps.length) {
        Firebase.initializeApp(firebaseConfig);
    }

    loadCredentials.then(client => {
        client.authorize((error, tokens) => {
            if (error) {
                context.fail(error);
                return
            }
    
            const options = {
                auth: client,
                ids: 'ga:' + gaTableID,
                metrics: 'rt:activeUsers'
            }
            activeUsersUpdate(context, options, 1);
        });
    }).catch(error => {
        context.fail(error);
    });

}