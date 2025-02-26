// imports
const axios = require('axios');
const _ = require('lodash');

const config = require('./config.json');

var dataid = 1000;
var matchInterval;

const axiosClient = axios.create({
    baseURL: 'https://esportsdata-sg.mobilelegends.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    params: {
        authkey: config.authkey
    }
});

const beginLiveMatch = async (matchId) => {
    matchInterval = setInterval(() => {
        axiosClient.get(`/battledata?battleid=${matchId}&dataid=${dataid}`).then(response => {
            sendDataToVMix(response.data)
        }).catch(error => {
            console.log(error)
        })
    }, 1000)
}

const stopLiveMatch = () => {
    clearInterval(matchInterval);
}

const VMixUrlConstructor = (config, data) => {
    // http://127.0.0.1:8088/API/?Function=Fade&Duration=1000&Input=877bb3e7-58bd-46a1-85ce-0d673aec6bf5
    const baseUrl = 'http://localhost:8088/api';
    const functionString = config.Function;
    const inputString = config.Input;
    const selectedName = config.SelectedName;
    const valueString = _.get(data, config.Value, '');
    return `${baseUrl}/?Function=${functionString}&Input=${inputString}&SelectedName=${selectedName}&Value=${valueString}`;
}

const sendDataToVMix = async (data) => {
    axios.all(config.pairConfigs.map(item => {
        console.table(Object.assign(item, { TargetValue: _.get(data, item.Value, '') }))
        return axiosClient.get(VMixUrlConstructor(item, data), item)
    })).then(axios.spread((...responses) => {
        for (let i = 0; i < responses.length; i++) {
            console.log(responses[i].data)
        }
    }))
}

const getLiveMatch = () => {
    axiosClient.get(`/battlelist/playing`).then(response => {
        console.log(response.data)
        // beginLiveMatch(response.data.battleids[0])
    }).catch(error => {
        console.log(error)
    })
}

getLiveMatch();

beginLiveMatch(config.matchId);