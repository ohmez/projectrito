var db = require("../models");
var keys = require("../keys");
var key = keys.riot.id;
var request = require("request");
var jsonfile = require("../public/champion.json");
var itemfile = require("../public/item.json");
var items = JSON.parse(JSON.stringify(itemfile.data));
var champions = JSON.parse(JSON.stringify(jsonfile.data));

module.exports = (app) => {
    app.get("/", (req,res) => {
        res.render("home", {
            title: "My Rito",
            css: ["/assets/css/home-main.css"]
        });
    });
    // this route will build the summoner object throught the API chain and render the content from API chain or database to the client
    app.get("/profile/:sumname", (req,res) => {
        var sum = {};
        sum.name = req.params.sumname;
        // check if summoner already exists in database
        db.Summoner.findOne({where: {name: sum.name}}).then(function(found) {
            if(!found) {
                // run API chain to get summoner information if not found
                getSummoner();
            } else {
                // if found
                var returnSum = JSON.parse(found.dataValues.json)
                var now = new Date();
                var last = new Date(returnSum.updated);
                // if hasn't been updated in last 10 minutes run API chain else populate from database
                now.getTime() > (last.getTime()+600000)?getSummoner():res.render('qwikstats',returnSum);
            }
        })
        //First function to start the API chain to get all of the summoners information for their profile
       function getSummoner() {
            request('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+sum.name+'?api_key='+key, (err, response, body) =>{
                if(!err && response.statusCode === 200) {
                    console.log('api summoner call worked');
                    sum = JSON.parse(body);
                    var utcSeconds = sum.revisionDate;
                    var d = new Date(0);
                    d.setUTCMilliseconds(utcSeconds);
                    sum.revisionDate = d;
                    sum.updated = new Date();
                    sum.name = sum.name.trim();
                    sum.css = [
                            "/assets/css/profile-main.css",
                            "/assets/css/style.css"
                            ]
                    sum.title = '' +sum.name + '\'s rito';
                    getRanked();
                }
                else {
                    sum.errMsg = "Something went wrong retrieving your summoner account information";
                    sum.css = [
                        "/assets/css/profile-main.css",
                        "/assets/css/style.css"
                        ];
                    res.render("qwikstats", sum);
                    console.log(response.body);
                }
            });
        }; // summoner triggers getRanked stats. 
        function getRanked() {
            request('https://na1.api.riotgames.com/lol/league/v4/positions/by-summoner/'+sum.id+'?api_key='+key,(err,response,body) => {
            if(!err && response.statusCode === 200) {
                var a = JSON.parse(body);
                for (x=0; x<a.length; x++) {
                    a[x].games = (a[x].wins + a[x].losses);
                    a[x].wr = (a[x].wins/a[x].losses).toFixed(2);
                    a[x].queueType === 'RANKED_FLEX_SR' ? sum.flex5 = a[x] : a[x];
                    a[x].queueType === 'RANKED_SOLO_5x5' ? sum.solo = a[x] : a[x];
                    a[x].queueType === 'RANKED_FLEX_TT' ? sum.flex3 = a[x] : a[x];
                }
                getMasters();
            }
            else {
                sum.errMsg = "Something went wrong retrieving your ranked information";
                res.render("qwikstats", sum);
                console.log(response.body);
            }
        });
        }; // ranked triggers getMasters stats.
        function getMasters() {
            request('https://na1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=' + key, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    body = JSON.parse(body);
                    var masters = body.entries;
                    var masterWr = [];
                    var total = 0;
                    for (x = 0; x < masters.length; x++) {
                        //loop through all the masters info and calculate the average win rate. 
                        var out = (masters[x].wins / masters[x].losses).toFixed(2);
                        masterWr.push(out);
                        total += parseInt(out);
                    }
                    sum.masters = { avg: (total / masterWr.length) }
                    getMatches();
                }
                else {
                    sum.errMsg = "Something went wrong retrieving masters information";
                    res.render("qwikstats",sum);
                    console.log(response.body);
                }
            });
        }; // masters triggers match history list.
        function getMatches() {
            request('https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/' + sum.accountId + '?api_key=' + key, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    body = JSON.parse(body); //body keys = matches, startIndex, endIndex, totalGames
                    var matches = body.matches;
                    sum.matches = {};
                    sum.matches.first5 = [];
                    // here we loop through all the matches to add the champions name to the object and save it as a key of the match object. 
                    for (x = 0; x < matches.length; x++) {
                        for (var prop in champions) {
                            if (Number(champions[prop].key) === matches[x].champion) {
                                matches[x].championName = champions[prop].id;
                            }
                        }
                        if (x < 5) {
                            sum.matches.first5.push(matches[x]);
                        }
                    }
                    sum.matches.last100 = matches;
                    getMasteries();
                }
                else {
                    sum.errMsg = "Something went wrong retrieving your match history information";
                    res.render("qwikstats",sum);
                    console.log(response.body);
                }
            });
        }; // matches triggers masteries
        function getMasteries() {
            request('https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/' + sum.id + '?api_key=' + key, (err, response, body) => {
                if (err) throw err;
                if (response.statusCode == 200) {
                    console.log('api masteries worked');
                    var masteries = JSON.parse(body);
                    var edited = [];
                    var top3 = [];
                    for (x = 0; x < masteries.length; x++) {
                        var utcSeconds = parseInt(masteries[x].lastPlayTime);
                        var d = new Date(0).setUTCMilliseconds(utcSeconds);
                        masteries[x].lastPlayTime = d;
                        for (var prop in champions) {
                            if (Number(champions[prop].key) === masteries[x].championId) {
                                masteries[x].championName = champions[prop].id;
                            }
                        }
                        edited.push(masteries[x]);
                        if(x<=2) {
                            top3.push(masteries[x])
                        }
                    }
                    sum.masteries = { all: edited };
                    sum.masteries.top3 = top3;
                    sum.matches.first5.forEach((match, index) => {
                        getMatchData(parseInt(match.gameId),sum.id, index, sum.matches.first5.length);
                    });
                } else {
                    sum.errMsg = 'Something went wrong retrieving your champion masteries';
                    res.render('qwikstats', sum);
                    console.log(response.body);
                }
            });
           
        };
        function getMatchData(matchNum,sumId,index, max) {
            request('https://na1.api.riotgames.com/lol/match/v4/matches/' + matchNum + '?api_key=' + key, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    console.log('match data worked');
                    body = JSON.parse(body);
                    body.participantIdentities.forEach(participant => participant.player.summonerId === sumId ? sum.matches.first5[index].playerNum = parseInt(participant.participantId) : participant);
                    var avKda = [];
                    var totKda = 0;
                    body.participants.forEach(player => {
                        var stats = player.stats;
                        var upsum = sum.matches.first5[index];
                        avKda.push(Number(stats.kills + stats.assists / stats.deaths));
                        stats.deaths === 0 ? totKda += Number(stats.kills + stats.assists) : totKda += Number(stats.kills + stats.assists / stats.deaths);
                        if (Number(player.participantId) === Number(upsum.playerNum)) {
                            upsum.win = stats.win,
                            upsum.kills = stats.kills,
                            upsum.assists = stats.assists,
                            upsum.deaths = stats.deaths,
                            upsum.cs = Number(stats.totalMinionsKilled + stats.neutralMinionsKilled),
                            upsum.vs = stats.visionScore,
                            upsum.fb = stats.firstBloodKill || stats.firstBlodAssist ? true : false,
                            upsum.kda = stats.deaths === 0 ? Number(stats.kills + stats.assists).toFixed(2) : Number(Number(stats.kills + stats.assists) / Number(stats.deaths)).toFixed(2)
                        }
                        sum.matches.first5[index] = upsum;
                    });
                    sum.matches.first5[index].avg = { kda: Number(Number(totKda) / Number(avKda.length)).toFixed(2) };
                    if(index >= max -1) {
                        setTimeout(() =>res.render('qwikstats',sum),500);
                        setTimeout(() => {
                            db.Summoner.findAll({where: {id: sum.id}}).then((summoners) => {
                                if(summoners.length === 0) {
                                    //create
                                    db.Summoner.create({
                                        name: sum.name,
                                        id: sum.id,
                                        accountId: sum.accountId,
                                        json: JSON.stringify(sum),
                                        updated: sum.updated
                                    }).then((added) => {
                                        console.log('new summoner added to database');
                                    }).catch((err) => console.log(err));
                                } else {
                                    //update
                                    db.Summoner.update({
                                        name: sum.name,
                                        id: sum.id,
                                        accountId: sum.accountId,
                                        json: JSON.stringify(sum),
                                        updated: sum.updated
                                    }, {where: {id: sum.id}}).then((updated) => {
                                        console.log('summoner has been updated');
                                    })
                                }
                            })
                        },1000);
                    }
                }
                else {
                    sum.errMsg = 'Something went wrong retrieving your match specific data';
                    res.render('qwikstats', sum);
                    console.log(response.body);
                }
            });
        }; // end get match specific data function. 
        

    });// end route to summoners profile page
    
}; // end app exports routing. 