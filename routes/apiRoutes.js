var db = require("../models");
var keys = require("../keys");
var key = keys.riot.id;
var request = require("request");
var jsonfile = require("../public/champion.json");
var champions = JSON.parse(JSON.stringify(jsonfile.data));
module.exports = (app) => {
    app.post("/findsumm", (req,res) => {
        var name = req.body.summonerName;
        request('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+name+'?api_key='+key, (err, response, body) =>{
            if(err) throw err;
            if(response.statusCode === 200) {
                console.log('api summoner call worked');
                var summoner = JSON.parse(body);
                var utcSeconds = summoner.revisionDate;
                var d = new Date(0);
                d.setUTCMilliseconds(utcSeconds);
                summoner.revisionDate = d;
                db.Summoner.findAll({where: {id: summoner.id}}).then((summoners) => {
                    if (summoners.length === 0) {
                        db.Summoner.create({
                            profileIconId: summoner.profileIconId,
                            name: summoner.name,
                            puuid: summoner.puuid,
                            summonerLevel: summoner.summonerLevel,
                            revisionDate: summoner.revisionDate,
                            id: summoner.id,
                            accountId: summoner.accountId
                        }).then((result) =>{
                            var sum = result.dataValues;
                            res.render('profile',{
                                name: sum.name,
                                summonerLevel: sum.summonerLevel,
                                profileIconId: sum.profileIconId,
                                revisionDate: sum.revisionDate,
                                id: sum.id,
                                title: '' + sum.name + "'s rito"
                                }
                            );
                        });
                    } else {
                        db.Summoner.update({
                            profileIconId: summoner.profileIconId,
                            name: summoner.name,
                            puuid: summoner.puuid,
                            summonerLevel: summoner.summonerLevel,
                            revisionDate: summoner.revisionDate,
                            id: summoner.id,
                            accountId: summoner.accountId
                        },{where: {id: summoner.id}}).then((upsums) => {
                            if(upsums[0] === 1) {
                                db.Summoner.findAll({where: {id: summoner.id}}).then((upsum) => {
                                    var sum = upsum[0].dataValues;
                                    res.render('profile',{
                                        name: sum.name,
                                        summonerLevel: sum.summonerLevel,
                                        profileIconId: sum.profileIconId,
                                        revisionDate: sum.revisionDate,
                                        id: sum.id,
                                        title: '' + sum.name + "'s rito"
                                        });
                                });
                            }
                        });
                    }
                });
            } if (response.statusCode === 404) {
                res.render('home',{errMsg: 'Please provide valid summoner name'});
            }
        });
    });
    app.post("/masteries", (req,res) => {
        var sum= req.body;
        request('https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/'+sum.id+'?api_key='+key,(err,response, body) => {
            if(err) throw err;
            if(response.statusCode == 200) {
                console.log('api masteries worked');
                var masteries = JSON.parse(body);
                var edited = [];
                for(x=0; x<masteries.length; x++) {
                    var utcSeconds = parseInt(masteries[x].lastPlayTime);
                    var d = new Date(0).setUTCMilliseconds(utcSeconds);
                    masteries[x].lastPlayTime = d; 
                    for(var prop in champions) {
                        if(Number(champions[prop].key) === masteries[x].championId) {
                            masteries[x].championName = champions[prop].name;
                        }
                    }
                    edited.push(masteries[x]);
                }
                db.Mastery.findAll({where: {summonerId: sum.id}}).then((summoners) => {
                    if (summoners.length === 0) {
                        // create
                        db.Mastery.bulkCreate(edited)
                            .then(() => {
                                db.Mastery.findAll({ where: { summonerId: sum.id } })
                                    .then(results => {
                                        res.render('profile',
                                            {
                                                name: sum.name,
                                                summonerLevel: sum.summonerLevel,
                                                profileIconId: sum.profileIconId,
                                                revisionDate: sum.revisionDate,
                                                id: sum.id,
                                                masteries: results,
                                                title: '' + sum.name + "'s rito"
                                            });
                                    });

                            })
                            .catch((err) => {
                                console.log(err, request.body);
                            })
                     } else {
                         //update
                         db.Mastery.destroy({
                             where: {
                                 summonerId: sum.id
                             }
                         })
                         .then((results) => {
                             console.log('rows deleted:',results);
                             db.Mastery.bulkCreate(edited)
                            .then(() => {
                                db.Mastery.findAll({ where: { summonerId: sum.id } })
                                    .then(results => {
                                        res.render('profile',
                                            {
                                                name: sum.name,
                                                summonerLevel: sum.summonerLevel,
                                                profileIconId: sum.profileIconId,
                                                revisionDate: sum.revisionDate,
                                                id: sum.id,
                                                masteries: results,
                                                title: '' + sum.name + "'s rito"
                                            });
                                    });

                            })
                            .catch((err) => {
                                console.log(err, request.body);
                            })
                         })
                     }
                });
                
            } else {
                // riot api didn't work
                console.log(response);
            }
        });
    })
    app.get("/rank", (req,res) => {
        var sum = {id:'HBopRONAR_0vscm4rxWUIup1Bi-zdXJQv0S7TkLukR6auCk'}
       request('https://na1.api.riotgames.com/lol/league/v4/positions/by-summoner/'+sum.id+'?api_key='+key,(err,response,body) => {
           if(err) throw err;
           console.log(body);
       })
    })
    
};