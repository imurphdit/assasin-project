const Agent = require("../models/agent.model");
const { assignNewTarget } = require("../services/agent.service");

const adminPage = async (req, res) => {
  try {
    const agents = await Agent.findAll();
    // FIND ALL AGENTS AND PASS THEM TO PAGE
    res.render("adminPage", { agents: agents });
  } catch (err) {
    console.error("Error loading admin page: ", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to redirect to load admin page",
    });
  }
};

const handleLogin = async (req, res) => {
  try {
    const pin = req.body.agentpin.replace("#", "");
    const agent = await Agent.findOne({ where: { agentpin: pin } });

    // IF AGENT DOESNT EXIST
    if (!agent) {
      console.log("Someone entered an invalid pin.");
      return res.render("message", { message: "Invalid pin.." });
    }

    // SET SESSION VARIABLES
    req.session.agent = agent.name;
    req.session.agentID = agent.id;
    req.session.isAdmin = agent.isadmin;

    // REDIRECT BASED ON AGENT TYPE
    if (agent.isadmin) {
      return res.redirect("/admin");
    } else {
      return res.redirect("/agent/" + agent.id.toString());
    }
  } catch (err) {
    console.error("Error loggin in: ", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to redirect to login",
    });
  }
};

const agentPage = async (req, res) => {
  try {
    const agent = await Agent.findByPk(req.params.id);
    const target = await Agent.findOne({ where: { id: agent.target } });

    //IF AGENT DOESNT EXIST
    if (!agent) {
      return res.render("message", { message: "Agent doesn't exist" });
    }

    // ACTIVATE AGENT IF NOT ALREADY ACTIVATED
    if (!agent.isactivated) {
      agent.isactivated = true;
      await agent.save();
      console.log(agent.name + " has been activated.");
      return res.render("message", {
        message: "Agent has been activated. Check back soon for your target",
      });
    }

    //IF AGENT IS DEAD
    if (agent.isdead) {
      return res.render("message", { message: "Better luck next time.." });
    }

    // IF AGENT'S TARGET IS DEAD
    if (target && target.isdead) {
      const result = await assignNewTarget(agent.id);
      if (result.status === "SUCCESS" && result.type === "REASSIGNED") {
        return res.render("message", {
          message:
            "Someone got to them first. Your new target is: " +
            result.data.name,
        });
      } else {
        return res.render("message", {
          message: "Failed to assign a new target. Try again later.",
        });
      }
    }

    //IF AGENT HAS NO TARGET
    if (target == null) {
      return res.render("message", {
        message: "Wait for a target to be assigned...",
      });
    }

    //IF AGENT WON
    if (agent.won) {
      return res.render("message", { message: "We'll be in touch.." });
    }
    //ELSE LOGIN NORMALLY
    res.render("agentPage", {
      target: target.name,
      targetID: target.id,
      pin: agent.agentpin,
      name: agent.name,
    });

    console.log(req.session.agent + " has logged into their dashboard.");
  } catch (err) {
    console.error("Error in /agent/:id ", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to find agent via UUID",
    });
  }
};

module.exports = {
  adminPage,
  handleLogin,
  agentPage,
};
