# ons-release-calendar

> Fetches data from our Concourse API to populate build statuses for the develop environments.

## Development

To develop and run the lambda function locally: 

1) Install the dependencies:
```
npm install
```
2) Run the function:
```
FIREBASE_KEY=<firebase api key> FIREBASE_DB_NAME=<firebase db name> npm run lambda
```
