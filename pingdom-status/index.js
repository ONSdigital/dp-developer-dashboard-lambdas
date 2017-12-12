'use strict';

const Firebase = require('firebase');
const fetch = require("fetch").fetchUrl;
const pingdomKey = process.env.PINGDOM_KEY;
const pingdomEmail = process.env.PINGDOM_EMAIL;
const pingdomPass = process.env.PINGDOM_PASS;
const pingdomAuth = 'Basic ' + new Buffer(pingdomEmail + ':' + pingdomPass).toString('base64');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_KEY,
    databaseURL: "https://" + process.env.FIREBASE_DB_NAME + ".firebaseio.com"
};

const fetchOptions = { 
    method: 'GET',
    mode: 'cors',
    cache: 'default',
    timeout: 3000,
    headers: {
        "App-Key": pingdomKey,
        "Authorization": pingdomAuth
    }
};

const getPingdomData = () => {
    return new Promise((resolve, reject) => {
        console.log("Fetching pingdom data");
        fetch("https://api.pingdom.com/api/2.1/checks", fetchOptions, (error, _, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(JSON.parse(response));
        });
    });
}

exports.handler = (_, context, callback) => {
    if (!Firebase.apps.length) {
        Firebase.initializeApp(firebaseConfig);
    }

    getPingdomData().then(checks => {
        Firebase.database().ref("pingdom")
            .set(checks)
            .then(function () {
                context.succeed();
            })
            .catch(function (error) {
                console.log('Firebase error: ', error);
                context.fail(error);
            });
    }).catch(error => {
        console.error("Error fetching pingdom data: ", error);
        context.fail(error);
    });
}