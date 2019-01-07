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
            title: "My_Rito",
            css: ["/assets/css/home-main.css"]
        });
    });
    app.post("/profile", (req,res) => {
        var sum = req.body;
        res.render("profile", {
            name: sum.name,
            summonerLevel: sum.summonerLevel,
            profileIconId: sum.profileIconId,
            revisionDate: sum.revisionDate,
            id: sum.id,
            title: '' + sum.name + "'s rito"
        });
        res.location('/profile');
    });
    app.get("/stats/:sumname", (req,res) => {
        var sum = {};
        sum.name = req.params.sumname;
        // first we get the summoner information and store it as an object. 
        request('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+sum.name+'?api_key='+key, (err, response, body) =>{
            if(err) throw err;
            if(response.statusCode === 200) {
                console.log('api summoner call worked');
                sum = JSON.parse(body);
                var utcSeconds = sum.revisionDate;
                var d = new Date(0);
                d.setUTCMilliseconds(utcSeconds);
                sum.revisionDate = d;
                sum.updated = new Date().toDateString();
                sum.name = sum.name.trim();
                sum.css = {
                    css: ["/assets/css/profile-main.css"]
                }
                // then we get the ranked information and store it as children of the summoner object henceforth known as `sum`
                request('https://na1.api.riotgames.com/lol/league/v4/positions/by-summoner/'+sum.id+'?api_key='+key,(err,response,body) => {
                    if(err) throw err;
                    if(response.statusCode === 200) {
                        var a = JSON.parse(body);
                        for (x=0; x<a.length; x++) {
                            a[x].games = (a[x].wins + a[x].losses);
                            a[x].wr = (a[x].wins/a[x].losses).toFixed(2);
                            a[x].queueType === 'RANKED_FLEX_SR' ? sum.flex5 = a[x] : a[x];
                            a[x].queueType === 'RANKED_SOLO_5x5' ? sum.solo = a[x] : a[x];
                            a[x].queueType === 'RANKED_FLEX_TT' ? sum.flex3 = a[x] : a[x];
                        }
                        // then we get the ranked masters information for win rate comparison and store it as child of sum.
                        request('https://na1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key='+key, (err,response,body) => {
                            if(err) throw err;
                            if(response.statusCode === 200) { 
                                body = JSON.parse(body);
                                var masters = body.entries;
                                var masterWr = [];
                                var total = 0;
                                for (x=0; x<masters.length; x++ ) {
                                    //loop through all the masters info and calculate the average win rate. 
                                    var out = (masters[x].wins/masters[x].losses).toFixed(2);
                                    masterWr.push(out);
                                    total += parseInt(out);
                                }
                                sum.masters = {avg:(total/masterWr.length)}
                                // then we get the summoners match history by their account id.
                                request('https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/'+sum.accountId+'?api_key='+key, (err,response,body) => {
                                    if(err) throw err;
                                    if(response.statusCode === 200) {
                                        body = JSON.parse(body); //body keys = matches, startIndex, endIndex, totalGames
                                        var matches = body.matches;
                                        sum.first5 = [];
                                        // here we loop through all the matches to add the champions name to the object and save it as a key of the match object. 
                                        for(x=0; x<matches.length; x++) {
                                            for(var prop in champions) {
                                                if(Number(champions[prop].key) === matches[x].champion) {
                                                    matches[x].championName = champions[prop].name;
                                                }
                                            }
                                            if(x<5) {
                                                sum.first5.push(matches[x]);
                                            }
                                        }
                                        sum.last100 = matches;
                                        function getMatch(matchNum,sumId,index,cb) {
                                            request('https://na1.api.riotgames.com/lol/match/v4/matches/'+matchNum+'?api_key='+key, (err,response,body) => {
                                                if(err) throw err;
                                                if(response.statusCode === 200) {
                                                    body = JSON.parse(body);
                                                    // for(var prop in body) {
                                                    //     console.log(prop);
                                                    // }
                                                    // console.log('thats all the keys of response body');
                                                    for (var x = 0; x < body.participantIdentities.length; x++) {
                                                        if (sumId === body.participantIdentities[x].player.summonerId) {
                                                            sum.first5[index].playerNum = parseInt(body.participantIdentities[x].participantId);
                                                        }
                                                    } // end loop to find particpantidentity associated with summoner.
                                                    var avKda = [];
                                                    var totKda = 0;
                                                    for (var y = 0; y < body.participants.length; y++) {
                                                        var stats = body.participants[y].stats;
                                                        avKda.push(Number(stats.kills+stats.assists/stats.deaths));
                                                        if(stats.deaths === 0) {
                                                            totKda += Number(stats.kills + stats.assists);
                                                        } else {
                                                            totKda += Number(stats.kills+stats.assists/ stats.deaths);
                                                        }
                                                        if (Number(body.participants[y].participantId) === Number(sum.first5[index].playerNum)) {
                                                            // Stats have been found for player in said match
                                                            sum.first5[index].win = stats.win;
                                                            sum.first5[index].kills = stats.kills;
                                                            sum.first5[index].assists = stats.assists;
                                                            sum.first5[index].deaths = stats.deaths;
                                                            sum.first5[index].cs = Number(stats.totalMinionsKilled + stats.neutralMinionsKilled);
                                                            sum.first5[index].vs = stats.visionScore;
                                                            sum.first5[index].fb = stats.firstBloodKill || stats.firstBlodAssist ? true : false;
                                                            sum.first5[index].kda = stats.deaths === 0 ? Number(stats.kills + stats.assists).toFixed(2) : Number(Number(stats.kills + stats.assists) / Number(stats.deaths)).toFixed(2);
                                                        }
                                                    } // end loop for finding if game is a win or loss + gathering game stats after identifying playeridentity.
                                                    sum.first5[index].avg = {kda: Number(Number(totKda)/Number(avKda.length)).toFixed(2)};
                                                    if(index === cb) {
                                                        
                                                        request('https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/' + sum.id + '?api_key=' + key, (err, response, body) => {
                                                            if (err) throw err;
                                                            if (response.statusCode == 200) {
                                                                console.log('api masteries worked');
                                                                var masteries = JSON.parse(body);
                                                                var edited = [];
                                                                for (x = 0; x < masteries.length; x++) {
                                                                    var utcSeconds = parseInt(masteries[x].lastPlayTime);
                                                                    var d = new Date(0).setUTCMilliseconds(utcSeconds);
                                                                    masteries[x].lastPlayTime = d;
                                                                    for (var prop in champions) {
                                                                        if (Number(champions[prop].key) === masteries[x].championId) {
                                                                            masteries[x].championName = champions[prop].name;
                                                                        }
                                                                    }
                                                                    edited.push(masteries[x]);
                                                                }
                                                                sum.masteries = {all: edited};
                                                                sum.masteries.top3 = [edited[0],edited[1],edited[3]];
                                                                console.log(sum.masteries.top3);
                                                                res.render('qwikstats',sum);
                                                            } else {
                                                                res.render('home',{errMsg: 'something went wrong fetching masteries'});
                                                            }
                                                        });
                                                    } else {return sum} // end promise loop, this waits until last item in array returns then sends response to client else returns var sum and keeps looping
                                                } else {
                                                    res.render('home',{errMsg:'something went wrong fetching match data'})
                                                }
                                            }); // end match api call

                                        }; // end getMatch Function
                                        for(x=0; x<sum.first5.length; x++) {
                                            getMatch(sum.first5[x].gameId, sum.id, x, sum.first5.length-1);
                                        } // loops throught the first 5 matches and performs the getmatch function on all the game id's. 
                                    } else {
                                        res.render('home', {errMsg:'something went wrong with fetching matchlist' + response.statusCode});
                                    }
                                }); // end matchlist api call
                            } else {
                                res.render('home',{errMsg:'something went wrong with fetching Masters Stats:' + response.statusCode});
                            }
                        }); // end masters stats api call
                    } else {
                        res.render('home', {errMsg:'something went wrong with fetching ranked stats:' + response.statusCode});
                    }
                }); // end ranked league api call
            } else {
                res.render('home', {errMsg:'something went wrong fetching that summoner name, check spelling and try again' + response.statusCode});
            }
        }); // end summoner api call
    });
}; // end app exports routing. 