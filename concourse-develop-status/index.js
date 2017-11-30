'use strict';

const Firebase = require('firebase');
const fetch = require("fetch").fetchUrl;

const firebaseConfig = {
    apiKey: process.env.FIREBASE_KEY,
    databaseURL: "https://" + process.env.FIREBASE_DB_NAME + ".firebaseio.com"
};

const fetchOptions = { 
    method: 'GET',
    mode: 'cors',
    cache: 'default' 
};

const getBuilds = (name) => {
    return new Promise((resolve, reject) => {
        const url = `https://concourse.onsdigital.co.uk/api/v1/teams/main/pipelines/${name}/jobs`;
        console.log("Fetching for URL: ", url);
        fetch(url, fetchOptions, (error, _, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(JSON.parse(response.toString()));
        });
    });
};

exports.handler = (event, context, callback) => {
    if (!Firebase.apps.length) {
        Firebase.initializeApp(firebaseConfig);
    }

    event.repos.forEach(repo_name => {
        getBuilds(repo_name).then(response => {
            const developBuilds = response.filter(job => {
                return (
                    job.name === ("cmd-develop-build")
                    ||
                    job.name === ("develop-build")
                )
            }).map(job => {
                return {
                    status: job.finished_build.status,
                    name: job.name,
                    date: new Date(job.finished_build.end_time)
                }
            });
            Firebase.database().ref("develop_build_statuses").child(`${repo_name}`)
                .set(developBuilds)
                .then(function (developBuilds) {
                    context.succeed();                  // important that you don't call succeed until you are called back otherwise nothing will be saved to the database!
                })
                .catch(function (error) {
                    console.log('Firebase error: ', error);
                    context.fail();
                });
        }).catch(error => {
            console.log("Error fetching releases", error);
        });
    })
}