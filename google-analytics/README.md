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
FIREBASE_KEY=<firebase api key> FIREBASE_DB_NAME=<firebase db name> GA_TABLE_ID=<Google Analytics Table ID> AUTH_KEY=<Passkey to decrypt authorisation file> AUTH_FILE_PATH=<Address of authorisation file> npm run lambda
```
3) If you need to decrypt/encrypt the authorisation file uploaded then run
```
AUTH_KEY=<Passkey to encrypt the authorisation file with> npm run encrypt
```
or
```
AUTH_KEY=<Passkey to decrypt the authorisation file> npm run decrypt
```
