'use strict';
module.exports = (sequelize, DataTypes) => {
  const Summoner = sequelize.define('Summoner', {
    // profileIconId: DataTypes.STRING,
    name: DataTypes.STRING,
    // puuid:DataTypes.STRING,
    // summonerLevel: DataTypes.STRING,
    // revisionDate: DataTypes.DATE,
    json: {
      allowNull: false, 
      type: DataTypes.JSON
    },
    id:{
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING
    },
    updated: DataTypes.DATE,
    accountId: DataTypes.STRING
  }, {});
  
  return Summoner;
};