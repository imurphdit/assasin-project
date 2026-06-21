const Agent = require("../models/agent.model");
const { Op } = require("sequelize");
const sequelize = require("../sequelizeConfig");

const killAgentService = async (agentKillerID, agentVictimID) => {
  const agentKiller = await Agent.findByPk(agentKillerID);
  const agentVictim = await Agent.findByPk(agentVictimID);

  if (!agentKiller) {
    return { status: "ERROR", message: "Agent not found" };
  }

  if (!agentVictim) {
    return { status: "ERROR", message: "Target not found" };
  }

  //CHECK IF THIS IS THEIR TARGET
  if (agentKiller.target === agentVictim.id) {
    //KILL TARGET
    agentVictim.isdead = true;
    agentVictim.killedby = agentKiller.name;
    await agentVictim.save();

    console.log(agentKiller.name + " has eliminated " + agentVictim.name);
  } else {
    return { status: "ERROR", message: "This is not your target.." };
  }

  //IF ALL GOES RIGHT CONTINUE WITH REASSIGNMENT
  return await assignNewTarget(agentKillerID);
};

const assignNewTarget = async (agentID) => {
  const agent = await Agent.findByPk(agentID);
  const newTarget = await Agent.findAll({
    where: {
      isdead: false,
      isadmin: false,
      isactivated: true,
      [Op.not]: [{ id: agentID }],
    },
    order: sequelize.random(),
    limit: 1,
  });

  if (!agent) {
    return {
      status: "ERROR",
      message: "Trouble finding agent in target reassignment",
    };
  }

  if (newTarget.length === 0) {
    agent.won = true;
    await agent.save();
    console.log(
      agent.name + " has won the game. Now let us see if they are worthy..",
    );
    return { status: "SUCCESS", type: "WIN" };
  } else {
    //IF PLAYERS LEFT, ASSIGN NEW TARGET
    console.log(agent.name + " is given a new target.");
    agent.target = newTarget[0].id;
    await agent.save();
    return { status: "SUCCESS", type: "REASSIGNED", data: newTarget[0] };
  }
};

module.exports = {
  killAgentService,
  assignNewTarget,
};
