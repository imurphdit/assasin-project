const Agent = require("../models/agent.model");
const Game = require("../models/game.model");
const { Op } = require("sequelize");
const sequelize = require("../sequelizeConfig");
const { assignNewTarget } = require("../services/agent.service");

const runSetup = async () => {
  console.log("running setup");
  const admins = await Agent.findAll({
    where: {
      isadmin: true,
    },
  });
  const gameStatus = await Game.findAll({
    where: {
      status: "Started",
    },
  });
  if (admins.length === 0) {
    const admin = await createAdmin();
    if (!admin) {
      return { status: "ERROR", message: "Couldn't create admin" };
    }
    return { status: "SUCCESS", type: "ADMIN", data: admin.agentpin };
  } else if (gameStatus.length === 0) {
    return { status: "SUCCESS", type: "PENDING" };
  } else {
    return { status: "ERROR", message: "Setup not needed" };
  }
};

const randomizeTargets = async () => {
  const agents = await Agent.findAll({
    where: {
      isadmin: false,
      isactivated: true,
      isdead: false,
    },
  });
  if (agents.length === 0) {
    return { status: "ERROR", message: "No players found" };
  }
  for (const agent of agents) {
    await assignNewTarget(agent.id);
  }
  return { status: "SUCCESS", message: "Targets randomized successfully" };
};

const createAdmin = async () => {
  const randomPin = Math.floor(Math.random() * (99999 - 0) + 0);
  const admin = await Agent.create({
    name: "Admin",
    agentpin: randomPin,
    isadmin: true,
  });
  console.log("Admin created with pin: " + randomPin);
  return admin;
};

const resetGameState = async () => {
  await Agent.update(
    { isdead: false, isactivated: false },
    { where: { isadmin: false } },
  );
};

module.exports = {
  createAdmin,
  runSetup,
  randomizeTargets,
  resetGameState,
};
