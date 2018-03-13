const fs = require('fs');
const crypto = require('crypto-js');
const credentials = fs.readFileSync('./auth.json.asc', 'utf8');

const passKey = process.env.AUTH_KEY;

if (!passKey) {
    console.error("Unable to encrypt auth file because no pass key provided");
    return;
}

const decryptedBytes = crypto.AES.decrypt(credentials, passKey);
const decrypted = decryptedBytes.toString(crypto.enc.Utf8);

console.log("Decrypted auth file: ", JSON.parse(decrypted));