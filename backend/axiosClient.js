const axios = require('axios');
const config = require('./config.json');

const internalClient = axios.create({
    baseURL: 'https://esportsdata-sg.mobilelegends.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    params: {
        authkey: config.authkey
    }
});

const externalClient = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

exports.internalClient = internalClient;
exports.externalClient = externalClient;