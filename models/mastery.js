'use strict';
module.exports = (sequelize, DataTypes) => {
  const Mastery = sequelize.define('Mastery', {
    championName: DataTypes.STRING,
    championId: DataTypes.STRING,
    championLevel: DataTypes.INTEGER,
    championPoints: DataTypes.INTEGER,
    lastPlayTime: DataTypes.DATE,
    championPointsSinceLastLevel: DataTypes.INTEGER,
    championPointsUntilNextLevel: DataTypes.INTEGER,
    chestGranted: DataTypes.BOOLEAN,
    tokensEarned: DataTypes.TINYINT,
    summonerId: DataTypes.STRING
  }, {});
  Mastery.associate = function(models) {
    // associations can be defined here
    // Summoner.hasMany(models.Mastery, {
    //   onDelete: "cascade"
    // });
  };
  return Mastery;
};