var db = require("../models");
var keys = require("../keys");
var key = keys.riot.id;
var request = require("request");
var jsonfile = require("../public/champion.json");
var champions = JSON.parse(JSON.stringify(jsonfile.data));

module.exports = (app) => {
    app.get("/", (req,res) => {
        res.render("home", {
            title: "My_Rito"
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
        request('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+sum.name+'?api_key='+key, (err, response, body) =>{
            if(err) throw err;
            if(response.statusCode === 200) {
                console.log('api summoner call worked');
                var summoner = JSON.parse(body);
                var utcSeconds = summoner.revisionDate;
                var d = new Date(0);
                var u = new Date();
                d.setUTCMilliseconds(utcSeconds);
                summoner.revisionDate = d;
                sum.revisionDate = summoner.revisionDate;
                sum.profileIconId = summoner.profileIconId;
                sum.puuid = summoner.puuid;
                sum.summonerLevel = summoner.summonerLevel;
                sum.revisionDate = summoner.revisionDate;
                sum.id = summoner.id;
                sum.accountId = summoner.accountId;
                sum.updated = u.toDateString();
                sum.name = summoner.name.trim();
                request('https://na1.api.riotgames.com/lol/league/v4/positions/by-summoner/'+sum.id+'?api_key='+key,(err,response,body) => {
                    if(err) throw err;
                    if(response.statusCode === 200) {
                        var a = JSON.parse(body);
                        // console.log(a);
                        if(a.length > 1) {
                            if(a[0].queueType === 'RANKED_FLEX_SR'){
                                sum.solo = a[1];
                                sum.solo.wr = (a[1].wins/a[1].losses).toFixed(2);
                                sum.solo.games = (a[1].wins + a[1].losses);
                                sum.flex = a[0];
                                sum.flex.wr = (a[0].wins/a[0].losses).toFixed(2);
                                sum.flex.games = (a[0].wins + a[0].losses);
                            } else {
                                sum.flex = a[1];
                                sum.flex.wr = (a[1].wins/a[1].losses).toFixed(2);
                                sum.flex.games = (a[1].wins + a[1].losses);
                                sum.solo = a[0];
                                sum.solo.wr = (a[0].wins/a[0].losses).toFixed(2);
                                sum.solo.games = (a[0].wins + a[0].losses);
                            }
                        } else {
                            if(a[0].queueType ==='RANKED_FLEX_SR' ) {
                                sum.flex = a[0];
                                sum.flex.wr = (a[0].wins/a[0].losses).toFixed(2);
                                sum.flex.games = (a[0].wins + a[0].losses);
                            } else {
                                sum.solo = a[0];
                                sum.solo.wr = (a[0].wins/a[0].losses).toFixed(2);
                                sum.solo.games = (a[0].wins + a[0].losses);
                            }
                        }
                        
                        // console.log(sum);
                        request('https://na1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key='+key, (err,response,body) => {
                            if(err) throw err;
                            if(response.statusCode === 200) { 
                                body = JSON.parse(body);
                                var masters = body.entries;
                                var masterWr = [];
                                for (x=0; x<masters.length; x++ ) {
                                    //loop
                                    var out = (masters[x].wins/masters[x].losses).toFixed(2);
                                    masterWr.push(out);
                                }
                                var total = 0;
                                for (x=0; x<masterWr.length; x++) {
                                    total += parseInt(masterWr[x]);
                                }
                                var avg = total/masterWr.length;
                                // console.log(total);
                                // console.log('total above then average mster WR');
                                // console.log(avg);
                                sum.masters = {avg:avg};
                                var flexFr; 
                                var soloFr;
                                if(sum.solo) {
                                    if (sum.solo.wr < 1) {
                                        soloFr = ((avg - sum.solo.wr) * 100).toFixed(1);
                                        soloFr += '% Short of a Positive Win Rate'
                                    }
                                    else {
                                        soloFr = (((avg - sum.solo.wr) + 0.50) * 100).toFixed(1);
                                        soloFr += '% Win rate is a climbing win rate'
                                    }
                                    sum.solo.fr = soloFr;
                                }
                                if(sum.flex) {
                                    if (sum.flex.wr < 1) {
                                        flexFr = ((avg - sum.flex.wr) * 100).toFixed(1);
                                        flexFr += '% Short of a climbing win rate'
                                    }
                                    else {
                                        flexFr = (((avg - sum.flex.wr) + 0.50) * 100).toFixed(1);
                                        flexFr += '% Win rate is a climbing win rate'
                                    }
                                    sum.flex.fr = flexFr;
                                }
                                request('https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/'+sum.accountId+'?api_key='+key, (err,response,body) => {
                                    if(err) throw err;
                                    if(response.statusCode === 200) {
                                        body = JSON.parse(body); //keys-matches, startIndex, endIndex, totalGames
                                        var matches = body.matches;
                                        sum.first5 = [];
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
                                                            if(stats.firstBloodKill || stats.firstBlodAssist) {
                                                                sum.first5[index].fb = true;
                                                            } else { 
                                                                sum.first5[index].fb = false;
                                                            }
                                                            if(Number(stats.deaths) === 0) {
                                                                sum.first5[index].kda = Number(stats.kills + stats.assists).toFixed(2);
                                                            } else {
                                                                sum.first5[index].kda = Number(Number(stats.kills)+Number(stats.assists) / Number(stats.deaths)).toFixed(2);
                                                            }
                                                            console.log('win/loss updated',index, sum.first5[index].win);
                                                            console.log(stats);
                                                        }
                                                    } // end loop for finding if game is a win or loss after identifying playeridentity.
                                                    sum.first5[index].avg = {kda: Number(Number(totKda)/Number(avKda.length)).toFixed(2)};
                                                    console.log(avKda);
                                                    if(index === cb) {
                                                        res.render('qwikstats',sum);
                                                        console.log(sum.first5);
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