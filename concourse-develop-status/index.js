'use strict';

const Firebase = require('firebase');
const fetch = require("fetch").fetchUrl;
const isDevelop = process.env.BUILD === "dev";
const concourseDomain = isDevelop ? "concourse.onsdigital.co.uk" : "172.31.45.62";
const reposURL = "https://raw.githubusercontent.com/ONSdigital/dp-developer-dashboard-lambdas/master/get-github-repos/repos.json";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_KEY,
    databaseURL: "https://" + process.env.FIREBASE_DB_NAME + ".firebaseio.com"
};

const fetchOptions = { 
    method: 'GET',
    mode: 'cors',
    cache: 'default',
    timeout: 3000,
    rejectUnauthorized: false
};

const getBuilds = (name) => {
    return new Promise((resolve, reject) => {
        const url = `https://${concourseDomain}/api/v1/teams/main/pipelines/${name}/jobs`;
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

const getReposConfig = () => {
    return new Promise((resolve, reject) => {
        console.info("Fetching repos: ", reposURL);
        fetch(reposURL, fetchOptions, (error, _, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(JSON.parse(response).repos);
        });
    });
}

exports.handler = (_, context, callback) => {
    if (!Firebase.apps.length) {
        Firebase.initializeApp(firebaseConfig);
    }

    getReposConfig().then(repos => {
        const getAllBuilds = repos.map(repo_name => {
            return new Promise((resolve, reject) => {
                getBuilds(repo_name).then(response => {
                    console.info("Received response for: " + repo_name);
                    const developBuilds = response.filter(job => {
                        // Build has never successfully built
                        if (!job.finished_build) {
                            return false;
                        }

                        // Return cmd/production develop or master branches
                        if ((job.name).match(/^(cmd-)?(master|develop)-build$/)) {
                            console.info("Build data for: " + repo_name + "(" + job.name + ")");
                            return true
                        }
                    }).map(job => {
                        return {
                            status: job.finished_build.status,
                            name: job.name.replace('-build', ''),
                            date: new Date(job.finished_build.end_time)
                        }
                    });
                    Firebase.database().ref("build_statuses").child(`${repo_name}`)
                        .set(developBuilds)
                        .then(function (developBuilds) {
                            resolve();
                        })
                        .catch(function (error) {
                            console.error('Firebase error: ', error);
                            reject(error);
                        });
                });
            })
        });
    
        Promise.all(getAllBuilds).then(responses => {
            context.succeed();
        }).catch(error => {
            context.fail(error);
        });
    }).catch(error => {
        console.error("Error fetching repos: ", error);
        context.fail(error);
    });
}