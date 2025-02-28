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

    console.log(inputs)
})

connection.on('connect', () => {
    console.log('Connected')

    connection.send('XML')
})

cloudinary.config({ 
    cloud_name: 'dgwxadfh7', 
    api_key: '', 
    api_secret: '' // Click 'View API Keys' above to copy your API secret
});
// CLOUDINARY_URL=cloudinary://914164364216995:l_OvqBX4EhF0-0cO9KWXHxBQ77I@dgwxadfh7
const playerPositionToVMixInput = {
    1: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    2: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    3: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    4: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    5: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    6: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    7: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    8: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    9: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9',
    10: 'a2f2ebc0-6822-4f12-8702-5c3069b12ef9'
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
            console.log('response.data.dataid', response.data.dataid)

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
    // http://127.0.0.1:8088/API/?Function=Fade&Duration=1000&Input=877bb3e7-58bd-46a1-85ce-0d673aec6bf5
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
    sendVMixCommand(`SetText&Input=${playerPositionToVMixInput[1]}&SelectedName=TextBlock2.Text&Value=${teamName1}`);
    sendVMixCommand(`SetText&Input=${playerPositionToVMixInput[2]}&SelectedName=TextBlock1.Text&Value=${teamName2}`);
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
    }

    if (event === 'start') {
    }

    if (event === 'ban' || event === 'pick') {
        // const camp_list_1 = matchData.camp_list[0];
        // const camp_list_2 = matchData.camp_list[1];

        // // get newly added ban hero
        // const newBanHero = _.difference(camp_list_1.ban_hero_list, banList);
        // if (newBanHero.length > 0) {
        //     banList.push(newBanHero[0]);
        //     console.log('ban hero', newBanHero[0]);
        // }
        // // get newly added ban hero
        // const newBanHero2 = _.difference(camp_list_2.ban_hero_list, banList);
        // if (newBanHero2.length > 0) {
        //     banList.push(newBanHero2[0]);
        //     console.log('ban hero', newBanHero2[0]);
        // }
        // console.log('matchData', matchData)
        matchData.camp_list.forEach(camp => {
            camp.player_list.forEach(async player => {
                // console.log('player', player)
                const heroId = player.picking ? player.heroid : player.ban_heroid;

                console.log('heroId', heroId)

                if (heroId !== 0) {
                    const heroData = await getHeroData(heroId);
                    const heroName = heroData.hero_name;
                    const heroImageUrl = heroData.icon;
                    const action = player.banning ? 'Banning' : 'Picking'
                    const playerName = player.name;
                    const playerPos = player.pos;
                    // console.log('heroData', heroData)

                    // console.log(`Active Player: ${playerName}, Pos: ${playerPos}, Action: ${action}, Hero: ${heroName} `);


                    updateVMixOverlay(playerPos, playerName, action, action === 'Banning' ? heroImageUrl : heroData.portrait);
                }
            });
        });

    }

    // if (event === 'pick') {
    // }

    if (event === 'playing') {
    }
}

const getHeroData = async (heroid) => {
    heroid = heroid.toString().padStart(3, '0');
    const response = await axios.get(`https://mlbb-wiki-api.vercel.app/api/heroes/HE${heroid}`);
    // get full image using cloudinary
    const heroPortraitURL = cloudinary.url(`${heroid}`);
    const temp = { ...response.data.data, portrait: heroPortraitURL };
    // console.log('temp', temp)
    return temp;
};

const updateVMixOverlay = (playerPos, playerName, action, heroImageUrl) => {
    console.log('action', action)
    const vMixInput = playerPositionToVMixInput[playerPos];
    if (!vMixInput) {
        console.error(`No vMix input mapped for player position: ${playerPos}`);
        return;
    }

    switch (action) {
        case 'Picking':
            sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=${playerPos > 5 ? 'pickdo' : 'pickxanh'}${playerPos > 5 ? playerPos - 5 : playerPos}.Source&Value=${heroImageUrl}`);
            break;
        case 'Banning':
            sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=${playerPos > 5 ? 'bando' : 'banxanh'}${playerPos > 5 ? playerPos - 5 : playerPos}.Source&Value=${heroImageUrl}`);
            break;
        default:
            console.error(`Unknown action: ${action}`);
            break;
    }
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

// getLiveMatch();

beginLiveMatch(config.matchId);