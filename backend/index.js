// imports
const axios = require('axios');
const _ = require('lodash');
const { ConnectionTCP } = require('node-vmix')
const { XmlApi } = require('vmix-js-utils')

const config = require('./config.json');

var dataid = 1000;
var matchInterval;
var isInvalidMatch = false;

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

const playerPositionToVMixInput = {
    1: 'Input1', 
    2: 'Input2',
    3: 'Input2',
    4: 'Input2',
    5: 'Input2',
    6: 'Input2',
    7: 'Input2',
    8: 'Input2',
    9: 'Input2',
    10: 'Input10'
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
            // sendDataToVMix(response.data);

            handleMatchEvent(response.data.data.state, response.data.data);

            console.log(response.data.data.camp_list[0].ban_hero_list)
            console.log(response.data.data.state)
        }).catch(error => {
            // console.error(error)
            isInvalidMatch = true;
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
    return `${baseUrl}/?Function=${functionString}&Input=${inputString}&SelectedName=${selectedName}&Value=${valueString}`;
}

const handleMatchEvent = async (event, matchData) => {
    if (event === 'init') {
    }

    if (event === 'start') {
    }

    if (event === 'ban' || event === 'pick') {
        const camp_list_1 = matchData.camp_list[0];
        const camp_list_2 = matchData.camp_list[1];
        
        // get newly added ban hero
        const newBanHero = _.difference(camp_list_1.ban_hero_list, banList);
        if (newBanHero.length > 0) {
            banList.push(newBanHero[0]);
            console.log('ban hero', newBanHero[0]);
        }
        // get newly added ban hero
        const newBanHero2 = _.difference(camp_list_2.ban_hero_list, banList);
        if (newBanHero2.length > 0) {
            banList.push(newBanHero2[0]);
            console.log('ban hero', newBanHero2[0]);
        }

        matchData.camp_list.forEach(camp => {
            camp.player_list.forEach(async player => {
                if (player.picking || player.banning) {
                    const heroId = player.picking ? player.heroid : player.ban_heroid;

                    if (heroId == 0) {
                        return;
                    }
                    
                    const heroData = await getHeroData(heroId);
                    const heroName = heroData.hero_name;
                    const heroImageUrl = heroData.hero_image;
                    const action = player.picking ? 'Picking' : 'Banning';
                    // const playerName = player.name;
                    const playerPos = player.pos;

                    console.log(`Active Player: ${playerName}, Pos: ${playerPos}, Action: ${action}, Hero: ${heroName}`);

                    
                    updateVMixOverlay(playerPos, playerName, action, heroImageUrl);
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
    return response.data;
};

const updateVMixOverlay = (playerPos, playerName, action, heroImageUrl) => {
    const vMixInput = playerPositionToVMixInput[playerPos];
    if (!vMixInput) {
        console.error(`No vMix input mapped for player position: ${playerPos}`);
        return;
    }
    
    switch (action) {
        case 'Picking':
            sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=HeroImage&Value=${heroImageUrl}`);
            break;
        case 'Banning':
            sendVMixCommand(`SetImage&Input=${vMixInput}&SelectedName=HeroImage&Value=${heroImageUrl}`);
            break;
        default:
            console.error(`Unknown action: ${action}`);
            break;
    }
};

const sendVMixCommand = (command) => {
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