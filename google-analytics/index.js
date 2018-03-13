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
        .then(response => response.text())
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

const activeUsersUpdate = (context, options) => {
    analytics.data.realtime.get(options, (error, response) => {
        activeUsersUpdateCounter++;
        let activeUsers = response.data.totalsForAllResults['rt:activeUsers'];

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
                if (activeUsersUpdateCounter >= 6) {
                    context.succeed();
                    return; 
                }
                timer(context, options);
            })
            .catch(error => {
                console.error('Firebase error: ', error);
                context.fail(error);
            });       
    });
}

const timerDelay = 10000;
let activeUsersUpdateCounter = 0;
const timer = (context, options) => {
    setTimeout(() => {
        activeUsersUpdate(context, options);
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
            timer(context, options);
        });
    }).catch(error => {
        context.fail(error);
    });

}