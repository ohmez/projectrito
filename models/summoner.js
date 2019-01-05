'use strict';
module.exports = (sequelize, DataTypes) => {
  const Summoner = sequelize.define('Summoner', {
    profileIconId: DataTypes.STRING,
    name: DataTypes.STRING,
    puuid:DataTypes.STRING,
    summonerLevel: DataTypes.STRING,
    revisionDate: DataTypes.DATE,
    id:{
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING
    },
    accountId: DataTypes.STRING
  }, {});
  Summoner.associate = function(models) {
    // associations can be defined here
    // Summoner.hasMany(models.Mastery, {
    //   onDelete: "cascade"
    // });
  };
  return Summoner;
};