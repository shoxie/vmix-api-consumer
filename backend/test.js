const data = require('./data.json');
const _ = require('lodash');

console.log(_.get(data, 'data.camp_list[0].team_name', ''));