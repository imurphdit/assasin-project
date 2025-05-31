const { Sequelize, Model, DataTypes } = require('sequelize')
const sequelize = require("./sequelizeConfig")

class Agent extends Model {}

Agent.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  agentpin: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: DataTypes.STRING,
  target: DataTypes.STRING,
  isdead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  img: DataTypes.STRING,
  killedby: DataTypes.STRING,
}, { sequelize, modelName: "agent" })

module.exports = Agent