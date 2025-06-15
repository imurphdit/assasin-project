const { Sequelize, Model, DataTypes } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV !== 'production',
  })

  module.exports = sequelize