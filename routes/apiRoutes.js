var db = require("../models");
var keys = require("../keys");
var key = keys.riot.id;
var request = require("request");
var jsonfile = require("../public/champion.json");
var champions = JSON.parse(JSON.stringify(jsonfile.data));
module.exports = (app) => {
    app.post("/search",(req,res) => {
        var name = req.body.summonerName.trim();
        if(name.length > 3) {
            res.redirect("/profile/"+name);
        } else {
            res.redirect("/");
        }
    })
};