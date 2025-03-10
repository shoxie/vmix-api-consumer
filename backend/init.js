import { v2 as cloudinary } from 'cloudinary';
import { XmlApi } from 'vmix-js-utils';
import { ConnectionTCP } from 'node-vmix';
import { internalClient, externalClient } from './axiosClient.js';
import config from './config.json' with { type: "json" };

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

var dataid = 1000;
var isInvalidMatch = false;
var isTeamNameUpdated = false;
var isBanListUpdated = false;

export {
    config,
    connection,
    cloudinary,
    dataid,
    isInvalidMatch,
    isTeamNameUpdated,
    isBanListUpdated,
    internalClient, 
    externalClient
}