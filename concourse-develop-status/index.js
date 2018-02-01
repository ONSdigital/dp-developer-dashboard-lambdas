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
    timeout: 10000,
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
                        // Build has never successfully built or is building
                        if (!job.finished_build && !job.next_build) {
                            return false;
                        }

                        // Return status that are of interest to us
                        if (job.next_build && (job.next_build.status === "started" || job.next_build.status === "paused" || job.next_build.status === "pending")) {
                            console.info("Build data for: " + repo_name + "(" + job.name + ") - " + job.next_build.status);
                            return true;
                        }

                        // Return cmd/production develop or master branches
                        if ((job.name).match(/^(cmd-)?(master|develop)/)) {
                            console.info("Build data for: " + repo_name + "(" + job.name + ")");
                            return true
                        }
                        
                        return false;
                    }).map(job => {
                        const jobNameParts = job.name.split('-');
                        return {
                            status: job.finished_build ? job.finished_build.status : job.next_build.status,
                            name: jobNameParts.slice(0, -1).join(" "),
                            type: jobNameParts[jobNameParts.length-1],
                            updated_on: new Date().toISOString(),
                            id: job.finished_build ? job.finished_build.id : job.next_build.id
                        };
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
                }).catch(error => {
                    console.error("Error getting build: ", error);
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