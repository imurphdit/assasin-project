const Agent = require("../models/agent.model");
const {
  killAgentService,
  assignNewTarget,
} = require("../services/agent.service");

const getAgents = async (req, res) => {
  try {
    const agents = await Agent.findAll();
    res.json(agents);
  } catch (err) {
    console.error("Error in /api/agent/", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to list all Agents",
    });
  }
};

const createAgent = async (req, res) => {
  try {
    const agent = await Agent.create(req.body);
    res.redirect("/admin");
  } catch (err) {
    console.error("Error in /api/agent/", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create new agent",
    });
  }
};

const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.destroy({
      where: {
        id: req.params.id,
      },
    });
    return res.redirect(`/admin/`);
  } catch (err) {
    console.error("Error in /api/agent/:id DELETE", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete agent",
    });
  }
};

const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    res.json(agent);
  } catch (err) {
    console.error("Error in /api/agent/:id UPDATE", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update agent",
    });
  }
};

const killAgent = async (req, res) => {
  try {
    const result = await killAgentService(
      req.session.agentID,
      req.params.agentID,
    );

    if (result.status === "ERROR") {
      return res.render("message", { message: result.message });
    }

    switch (result.type) {
      case "WIN":
        return res.render("message", { message: "You won. We'll be in touch" });
      case "REASSIGNED":
        return res.redirect(`/agent/${req.session.agentID.toString()}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
      message: "Failed to kill agent",
    });
  }
};

const reassignAgent = async (req, res) => {
  try {
    const result = await assignNewTarget(req.params.id);

    if (result.status === "ERROR") {
      return res.render("message", { message: result.message });
    }

    if (result.status === "SUCCESS") {
      switch (result.type) {
        case "WIN":
          return res.render("message", {
            message: "They won. Get be in touch",
          });
        case "REASSIGNED":
          return res.redirect(`/admin/`);
      }
    }
  } catch (err) {
    res.status(500).json({
      error: err,
      message: "Failed to reassign agent",
    });
  }
};

module.exports = {
  getAgents,
  createAgent,
  deleteAgent,
  updateAgent,
  killAgent,
  reassignAgent,
};
