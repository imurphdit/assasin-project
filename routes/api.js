const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middleware");
const Agent = require("../models/agent.model");
const {
  getAgents,
  createAgent,
  deleteAgent,
  updateAgent,
  killAgent,
  reassignAgent,
} = require("../controllers/agent.controller");

const { startGame, resetGame } = require("../controllers/setup.controller");

router.get("/agent/", adminAuth, getAgents);

router.post("/agent/", adminAuth, createAgent);

router.get("/agent/:id/reassign", adminAuth, reassignAgent);

router.get("/agent/:id/delete", adminAuth, deleteAgent);

router.put("/agent/:id", adminAuth, updateAgent);

router.post("/kill/:agentID", auth, killAgent);

router.get("/game/start", adminAuth, startGame);

router.get("/game/reset", adminAuth, resetGame);

module.exports = router;
