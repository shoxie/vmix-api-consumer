// imports
const axios = require('axios');
const _ = require('lodash');
const { ConnectionTCP } = require('node-vmix')
const { XmlApi } = require('vmix-js-utils')
const cloudinary = require('cloudinary').v2;
const config = require('./config.json');

var dataid = 1000;
var matchInterval;
var isInvalidMatch = false;
var isTeamNameUpdated = false;
var isBanListUpdated = false;

const connection = new ConnectionTCP('localhost')

connection.on('xml', (xmlData) => {
    const xmlContent = XmlApi.DataParser.parse(xmlData)

    const inputsRawData = XmlApi.Inputs.extractInputsFromXML(xmlContent)
    const inputs = XmlApi.Inputs.map(inputsRawData)

    // console.log(inputs)
})

connection.on('connect', () => {
    console.log('Connected')

    connection.send('XML')
})

cloudinary.config({ 
    cloud_name: config.cloud_name, 
    api_key: config.cloudinary_api_key, 
    api_secret: config.cloudinary_api_secret
});

const playerPositionToVMixInput = {
    1: '34d85afb-2310-4a46-8e32-47100df06500',
    2: '34d85afb-2310-4a46-8e32-47100df06500',
    3: '34d85afb-2310-4a46-8e32-47100df06500',
    4: '34d85afb-2310-4a46-8e32-47100df06500',
    5: '34d85afb-2310-4a46-8e32-47100df06500',
    6: '34d85afb-2310-4a46-8e32-47100df06500',
    7: '34d85afb-2310-4a46-8e32-47100df06500',
    8: '34d85afb-2310-4a46-8e32-47100df06500',
    9: '34d85afb-2310-4a46-8e32-47100df06500',
    10: '34d85afb-2310-4a46-8e32-47100df06500'
};

var banList = [];
var pickList = [];
var commandQueue = [];

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
    if (isInvalidMatch) {
        return;
    }
    console.log(`Begin live match ${matchId}`)
    matchInterval = setInterval(() => {
        axiosClient.get(`/battledata?battleid=${matchId}&dataid=${dataid}`).then(response => {

            handleMatchEvent(response.data.data.state, response.data.data);

            dataid = response.data.dataid;
            // console.log('response.data.dataid', response.data.data.camp_list[0])

            if (!isTeamNameUpdated) {
                isTeamNameUpdated = true;
                updateTeamName(response.data.data.camp_list[0].team_name, response.data.data.camp_list[1].team_name);
            }
            if (!isBanListUpdated) {
                isBanListUpdated = true;
                updateBanList(response.data.data.camp_list[0], response.data.data.camp_list[1]);
            }
        }).catch(error => {
            // console.error(error)
            isInvalidMatch = true;
        })
    }, 3000)
}

const stopLiveMatch = () => {
    clearInterval(matchInterval);
}

const VMixUrlConstructor = (config, data) => {
    // http://127.0.0.1:8088/API/?Input=877bb3e7-58bd-46a1-85ce-0d673aec6bf5
    const baseUrl = 'http://localhost:8088/api';
    const functionString = config.Function;
    const inputString = config.Input;
    const selectedName = config.SelectedName;
    var valueString = _.get(data, config.Value, '');

    if (functionString === 'AddInput') {
        valueString = config.Value
        return `${baseUrl}/?Function=${functionString}&Value=Image|${valueString}`;
    }

    if (functionString === 'ListAdd') {
        return `${baseUrl}/?Function=${functionString}&Input=${inputString}&Value=${valueString}`;
    }

    if (functionString === 'SetImage') {
        valueString = config.Value
        console.log(`${baseUrl}/?Function=${functionString}&Input=${inputString}&Value=${valueString}`)
        return `${baseUrl}/?Function=${functionString}&Input=${inputString}&SelectedName=${selectedName}&Value=${valueString}`;
    }

    return `${baseUrl}/?Function=${functionString}&Input=${inputString}&SelectedName=${selectedName}&Value=${encodeURIComponent(valueString)}`;

}

const updateTeamName = (teamName1, teamName2) => {
    const redTeamInput = "34d85afb-2310-4a46-8e32-47100df06500";  // Replace with the actual vMix input ID/name
    const blueTeamInput = "34d85afb-2310-4a46-8e32-47100df06500";  // Replace with the actual vMix input ID/name
    sendVMixCommand(`SetText&Input=${redTeamInput}&SelectedName=doired.Text&Value=${encodeURIComponent(teamName1)}`);
    sendVMixCommand(`SetText&Input=${blueTeamInput}&SelectedName=doiblue.Text&Value=${encodeURIComponent(teamName2)}`);
}

const updateBanList = async (camp_list_1, camp_list_2) => {
    // // update ban list and show in vmix in case of late script running
    // const newBanHero = _.difference(camp_list_1.ban_hero_list, banList);
    // if (newBanHero.length > 0) {
    //     banList.push(newBanHero[0]);
    //     var { data: heroData } = await getHeroData(newBanHero[0]);
    //     updateVMixOverlay(banList.length, "", 'Banning', newBanHero[0], heroData.icon);
    // }
    // // get newly added ban hero
    // const newBanHero2 = _.difference(camp_list_2.ban_hero_list, banList);
    // if (newBanHero2.length > 0) {
    //     banList.push(newBanHero2[0]);
    //     var { data: heroData } = await getHeroData(newBanHero2[0]);
    //     console.log('heroData', heroData)
    //     updateVMixOverlay(banList.length, "", 'Banning', newBanHero2[0], heroData.icon);
    // }
}

const handleMatchEvent = async (event, matchData) => {
    if (event === 'init') {
        console.log("Match initialized.");
    }

    if (event === 'start') {
        console.log("Match started.");
    }

    if (event === 'ban' || event === 'pick') {
        matchData.camp_list.forEach(camp => {
            camp.player_list.forEach(async player => {
                const heroId = event === 'ban' ? player.ban_heroid : player.heroid;
                if (!heroId || heroId === 0) return;

                const heroData = await getHeroData(heroId);
                const heroImageUrl = event === 'ban' ? heroData.icon : heroData.portrait;
                const action = event === 'ban' ? 'Banning' : 'Picking';
                const playerName = player.name;
                const playerPos = player.pos;

                console.log(`Action: ${action}, Player: ${playerName}, Pos: ${playerPos}, Hero: ${heroData.hero_name}`);

                updateVMixOverlay(playerPos, playerName, action, heroImageUrl);
            });
        });
    };

    if (event === 'play') {
        console.log("Match is now playing.");
        sendDataToVMix(matchData);
    }
    if (event === 'end') { // Assuming 'end' is the event when the match finishes
        console.log("Match ended. Resetting vMix overlay...");
        resetVMixOverlay();
    }
};

const getHeroData = async (heroid) => {
    const paddedHeroid = heroid.toString().padStart(3, '0');
    const response = await axios.get(`https://mlbb-wiki-api.vercel.app/api/heroes/HE${paddedHeroid}`);
    // get full image using cloudinary
    const heroPortraitURL = cloudinary.url(`${heroid}.png`);
    const temp = { ...response.data.data, portrait: heroPortraitURL };
    // console.log('temp', temp)
    return temp;
};

const updateVMixOverlay = (playerPos, playerName, action, heroImageUrl) => {
    console.log('action', action);
    const vMixInput = playerPositionToVMixInput[playerPos];

    if (!vMixInput) {
        console.error(`No vMix input mapped for player position: ${playerPos}`);
        return;
    }

    let selectedName = '';

    if (action === 'Picking') {
        selectedName = playerPos > 5 ? `pickdo${playerPos - 5}` : `pickxanh${playerPos}`;
    } else if (action === 'Banning') {
        selectedName = playerPos > 5 ? `bando${playerPos - 5}` : `banxanh${playerPos}`;
    } else {
        console.error(`Unknown action: ${action}`);
        return;
    }

    sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=${selectedName}.Source&Value=${heroImageUrl}`);
};

const sendVMixCommand = (command) => {
    console.log('command', command)
    axios.get(`http://localhost:8088/api/?Function=${command}`).then((response) => {
        console.log(`vMix command sent: ${command}`);
    }).catch((error) => {
        console.error(`Error sending vMix command: ${command}`, error);
    });
};

const sendDataToVMix = async (data) => {
    axios.all(config.pairConfigs.map(item => {
        console.log('data', data)
        // console.log(item.Value, ' data: ', _.get(data, item.Value, ''))
        console.table(Object.assign(item, { TargetValue: _.get(data, item.Value, '') }))
        return axiosClient.get(VMixUrlConstructor(item, data), item)
    })).then(axios.spread((...responses) => {
        for (let i = 0; i < responses.length; i++) {
            // console.log(responses[i].data)
        }
    }))
}

const resetVMixOverlay = () => {
    console.log('Resetting vMix overlay...');

    for (let playerPos = 1; playerPos <= 10; playerPos++) {
        const vMixInput = playerPositionToVMixInput[playerPos];
        if (!vMixInput) continue;

        sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=${playerPos > 5 ? 'pickdo' : 'pickxanh'}${playerPos > 5 ? playerPos - 5 : playerPos}.Source&Value=`);
        sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=${playerPos > 5 ? 'bando' : 'banxanh'}${playerPos > 5 ? playerPos - 5 : playerPos}.Source&Value=`);
    }

    console.log('vMix overlay reset complete.');
};

const getLiveMatch = () => {
    axiosClient.get(`/battlelist/playing`).then(response => {
        console.log(response.data)
        // beginLiveMatch(response.data.battleids[0])
    }).catch(error => {
        console.log(error)
    })
}

// getLiveMatch();

beginLiveMatch(config.matchId);


