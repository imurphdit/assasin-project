const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("../sequelizeConfig");

class Game extends Model {}

Game.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
  },
  { sequelize, modelName: "Game" },
);

module.exports = Game;
