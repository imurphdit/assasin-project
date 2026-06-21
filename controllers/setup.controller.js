const {
  runSetup,
  randomizeTargets,
  resetGameState,
} = require("../services/setup.service");

const setup = async (req, res) => {
  try {
    const result = await runSetup();
    if (result.status === "ERROR") {
      return res.render("message", { message: result.message });
    }
    switch (result.type) {
      case "ADMIN":
        return res.render("message", {
          message: "Admin pin is: " + result.data,
        });
      case "PENDING":
        return res.redirect("/admin");
    }
  } catch (err) {
    res.status(500).json({ error: err, message: "Internal server error" });
  }
};

const startGame = async (req, res) => {
  try {
    const result = await randomizeTargets();
    if (result.status === "ERROR") {
      return res.render("message", { message: result.message });
    }
    return res.render("message", { message: "Let the game begin!" });
  } catch (err) {
    res.status(500).json({ error: err, message: "Internal server error" });
  }
};

const resetGame = async (req, res) => {
  try {
    await resetGameState();
    return res.render("message", { message: "Game reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err, message: "Internal server error" });
  }
};

module.exports = {
  setup,
  startGame,
  resetGame,
};
