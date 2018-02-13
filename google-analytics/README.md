# google-analytics

> Fetches data from a Google Analytics account and updates a Firebase database.

## Development

To develop and run the lambda function locally: 

1) Install the [AWS Sam](https://github.com/awslabs/aws-sam-local):
```
npm install -g aws-sam-local
```
2) Run the function:
```
FIREBASE_KEY=<firebase api key> FIREBASE_DB_NAME=<firebase db name> make run
```
