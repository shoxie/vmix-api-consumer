export interface MatchResponse {
    code:    number;
    message: string;
    dataid:  number;
    data:    MatchData;
}

export interface MatchData {
    battleid:                  string;
    start_time:                Date;
    win_camp:                  number;
    roomname:                  string;
    state:                     string;
    state_left_time:           number;
    game_time:                 number;
    dataid:                    number;
    tortoise_left_time:        number;
    lord_left_time:            number;
    kill_lord_money_advantage: number;
    paused:                    boolean;
    camp_list:                 CampList[];
    incre_event_list:          null;
    rune_2023:                 boolean;
    banpick_paused:            boolean;
}

export interface CampList {
    campid:              number;
    team_name:           string;
    team_simple_name:    string;
    team_id:             number;
    score:               number;
    kill_lord:           number;
    kill_tower:          number;
    total_money:         number;
    player_list:         PlayerList[];
    ban_hero_list:       number[] | null;
    kill_lord_advantage: null;
    enemy_area_get:      null;
    kill_tortoise:       number;
}

export interface PlayerList {
    roleid:             number;
    zoneid:             number;
    name:               string;
    team_name:          string;
    team_simple_name:   string;
    team_id:            number;
    judger:             boolean;
    campid:             number;
    pos:                number;
    banning:            boolean;
    picking:            boolean;
    ban_heroid:         number;
    heroid:             number;
    skillid:            number;
    gold:               number;
    exp:                number;
    level:              number;
    total_hurt:         number;
    total_damage:       number;
    total_heal:         number;
    total_damage_tower: number;
    dead:               boolean;
    revive_left_time:   number;
    major_left_time:    number;
    skill_left_time:    number;
    rune_id:            number;
    kill_num:           number;
    dead_num:           number;
    assist_num:         number;
    rune_map:           null;
    equip_list:         null;
    map_pos:            MapPos;
    xpm:                number;
    hit_rate:           null;
    gold_map:           null;
    ban_order:          number;
    pick_order:         number;
    control_time_ms:    number;
    total_heal_other:   number;
}

export interface MapPos {
    x: number;
    y: number;
}
