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

const getReleases = (date, isUpcoming) => {
    const fromDate = date;
    const toDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));
    const fromDateParams = `fromDateDay=${fromDate.getDate()}&fromDateMonth=${fromDate.getMonth()+1}&fromDateYear=${fromDate.getFullYear()}`;
    const toDateParams = `toDateDay=${toDate.getDate()}&toDateMonth=${toDate.getMonth()+1}&toDateYear=${toDate.getFullYear()}`;

    return new Promise((resolve, reject) => {
        const url = `https://www.ons.gov.uk/releasecalendar/data?${fromDateParams}&${toDateParams}&view=upcoming`;
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

exports.handler = (_, context, callback) => {
    if (!Firebase.apps.length) {
        Firebase.initializeApp(firebaseConfig);
    }

    const todaysDate = new Date();
    const tomorrowsDate = new Date(todaysDate.getTime() + (24 * 60 * 60 * 1000));
    const todaysReleases = getReleases(todaysDate);
    const tomorrowsReleases = getReleases(tomorrowsDate, true);

    function mapResponseToRelease(response) {
        try {
            return {
                title: response.description.title,
                isNationalStatistic: response.description.nationalStatistic,
                description: response.description.summary,
                isPublished: response.description.published,
                releaseDate: response.description.releaseDate,
                isFinalised: response.description.finalised,
                provisionalDate: response.description.provisionalDate,
                isCancelled: response.description.cancelled
            };
        } catch (error) {
            console.error("Failure whilst mapping API response to release structure: ", error);
        }
    }

    Promise.all([todaysReleases, tomorrowsReleases]).then(responses => {
        const releases = {
            today: responses[0].result.results.map(release => {
                return mapResponseToRelease(release)
            }),
            tomorrow: responses[1].result.results.map(release => {
                return mapResponseToRelease(release)
            })
        };
        Firebase.database().ref().child("releases")
            .set(releases)
            .then(function (releases) {
                context.succeed();                  // important that you don't call succeed until you are called back otherwise nothing will be saved to the database!
            })
            .catch(function (error) {
                console.log('Firebase error: ', error);
                context.fail();
            });
    }).catch(error => {
        console.log("Error fetching releases", error);
    });
}