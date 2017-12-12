# pingdom-status

> Fetches data from Pingdom to populate response times and availability.

## Development

To develop and run the lambda function locally: 

1) Install the dependencies:
```
npm install
```
2) Run the function:
```
PINGDOM_EMAIL=<pingdom email> PINGDOM_PASS=<pingdom password> PINGDOM_KEY=<pingdom key> FIREBASE_KEY=<firebase api key> FIREBASE_DB_NAME=<firebase db name> npm run lambda
```
