const fs = require('fs');
const crypto = require('crypto-js');
const credentials = fs.readFileSync('./auth.json', 'utf8');

const passKey = process.env.AUTH_KEY;

if (!passKey) {
    console.error("Unable to encrypt auth file because no pass key provided");
    return;
}

const encrypted = crypto.AES.encrypt(credentials, passKey);

fs.writeFile('./auth.json.asc', encrypted, () => {
    console.log("Successfully written encrypted 'auth.json.asc' to disk");
});