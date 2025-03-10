// imports
const _ = require('lodash');
const axios = require('axios');
var { connection, cloudinary, dataid, isInvalidMatch, isTeamNameUpdated, isBanListUpdated, internalClient, externalClient, config } = require('./init');
var matchInterval;
var pickedPlayer = [];
var bannedHeroes = [];

const beginLiveMatch = async (matchId) => {
    if (isInvalidMatch) {
        return;
    }
    console.log(`Begin live match ${matchId}`)
    matchInterval = setInterval(() => {
        internalClient.get(`/battledata?battleid=${matchId}&dataid=${dataid}`).then(response => {

            handleMatchEvent(response.data.data.state, response.data.data);
            console.log('response.data.data.state', response.data.data.state)
            dataid = response.data.dataid;

            // if (!isTeamNameUpdated) {
            //     isTeamNameUpdated = true;
            //     updateTeamName(response.data.data.camp_list[0].team_name, response.data.data.camp_list[1].team_name);
            // }
            // if (!isBanListUpdated) {
            //     isBanListUpdated = true;
            //     updateBanList(response.data.data.camp_list[0], response.data.data.camp_list[1]);
            // }
        }).catch(error => {
            // console.error(error)
            isInvalidMatch = true;
        })
    }, 1000)
}

const handleMatchEvent = async (event, matchData) => {
    if (event === 'init') {
        console.log("Match initialized.");
    }

    if (event === 'start') {
        console.log("Match started.");
    }

    if (event === 'pick') {
        matchData.camp_list.forEach(camp => {
            camp.player_list.forEach(async player => {
                if (pickedPlayer.includes(player.pos)) return;
                const heroId = player.heroid;
                if (!heroId || heroId === 0) return;

                const heroData = await getHeroData(heroId);
                const heroImageUrl = heroData.portrait;
                const action = 'Picking';
                const playerName = player.name;
                const playerPos = player.pos;
                const vMixConfig = config[`team_` + camp.campid][`pick` + "_phase"].keyPairs[playerPos - (playerPos > 5 ? 5 : 0) - 1];
                const vMixGuid = config[`team_` + camp.campid][`pick` + "_phase"].GUID;

                // console.log(`Action: ${action}, Player: ${playerName}, Pos: ${playerPos}, Hero: ${heroData.hero_name}`);
                processCommand(heroImageUrl, vMixConfig, vMixGuid);
                pickedPlayer.push(playerPos);
            });
        });
    };

    if (event === 'ban') {
        matchData.camp_list.forEach(camp => {
            if (!camp.ban_hero_list) return;

            if (camp.campid === 5) return;
            console.log(camp.team_name, config[`team_`+ camp.campid].team_name, config[`team_` + camp.campid][`ban` + "_phase"].GUID)
            processCommand(camp.team_name, config[`team_`+ camp.campid].team_name, config[`team_` + camp.campid][`ban` + "_phase"].GUID);

            // banned_hero_list
            camp.ban_hero_list.forEach(async (heroId, index) => {
                if (bannedHeroes.includes(heroId)) return;
                const heroData = await getHeroData(heroId);
                const heroImageUrl = heroData.icon;
                const action = 'Banning';
                const playerName = camp.player_list[index].name;
                const playerPos = index;
                const vMixConfig = config[`team_` + camp.campid][`ban_phase`].keyPairs[playerPos];
                const vMixGuid = config[`team_` + camp.campid][`ban_phase`].GUID;
                console.log('1', vMixConfig, playerPos)
                // console.log(`Action: ${action}, Player: ${playerName}, Pos: ${playerPos}, Hero: ${heroData.hero_name}`);
                processCommand(heroImageUrl, vMixConfig, vMixGuid);
                bannedHeroes.push(heroId);
            });
        })
    }

    if (event === 'play') {
        console.log("Match is now playing.");
        updateTextContent(matchData);
    }
    if (event === 'end') { // Assuming 'end' is the event when the match finishes
        console.log("Match ended. Resetting vMix overlay...");
        // resetVMixOverlay();
    }
};

const processCommand = (value, vMixConfig, vMixGuid) => {
    if (!vMixConfig && !vMixGuid) {
        return;
    }

    var command;
    switch (vMixConfig.Function) {
        case 'SetImage':
            command = `SetImage&Input=${vMixGuid}&SelectedName=${vMixConfig.SelectedName}.Source&Value=${value}`;
            updateVMixOverlay(command);
            break;
        case 'SetText':
            command = `SetText&Input=${vMixGuid}&SelectedName=${vMixConfig.SelectedName}.Text&Value=${value}`;
            updateVMixOverlay(command);
            break;
        default:
            console.error(`Unknown function: ${vMixConfig.Function}`);
            break;
    }
};

const updateTextContent = async (data) => {
    config['team_1'].play_phase.keyPairs.map(item => {
        processCommand(_.get(data, item.Value, ''), item, config['team_1'].play_phase.GUID)
    })
    config['team_2'].play_phase.keyPairs.map(item => {
        processCommand(_.get(data, item.Value, ''), item, config['team_2'].play_phase.GUID)
    })
}

const updateVMixOverlay = (command) => {
    externalClient.get(`http://localhost:8088/api/?Function=${command}`).then((response) => {
        console.log(`vMix command sent: ${command}`);
    }).catch((error) => {
        console.error(`Error sending vMix command: ${command}`, error);
    });
};

const getHeroData = async (heroid) => {
    const paddedHeroid = heroid.toString().padStart(3, '0');
    const response = await externalClient.get(`https://mlbb-wiki-api.vercel.app/api/heroes/HE${paddedHeroid}`);
    // get full image using cloudinary
    const heroPortraitURL = cloudinary.url(`${heroid}.png`);
    const temp = { ...response.data.data, portrait: heroPortraitURL };
    // console.log('temp', temp)
    return temp;
};

const resetVMixOverlay = () => {
    console.log('Resetting vMix overlay...');

    for (let playerPos = 1; playerPos <= 10; playerPos++) {
        updateVMixOverlay(`SetImage&Input=${`f07486a4-26d2-4d05-ad01-e85b69b0da8b`}&SelectedName=${playerPos > 5 ? 'pickdo' : 'pickxanh'}${playerPos > 5 ? playerPos - 5 : playerPos}.Source&Value=`);
        updateVMixOverlay(`SetImage&Input=${`f07486a4-26d2-4d05-ad01-e85b69b0da8b`}&SelectedName=${playerPos > 5 ? 'bando' : 'banxanh'}${playerPos > 5 ? playerPos - 5 : playerPos}.Source&Value=`);
    }

    console.log('vMix overlay reset complete.');
};

// console.log(config[`team_` + 1]["ban" + "_phase"].keyPairs[0].SelectedName)
resetVMixOverlay()
beginLiveMatch(config.matchId)