function auth(req, res, next) {
  if (req.session.agent) {
    console.log(req.session.agent + " passed authentication.");
    next();
  } else {
    res.redirect("/login");
  }
}

function agentPageAuth(req, res, next) {
  if (req.session.agentID === req.params.id) {
    next();
  } else {
    console.log(req.session.agent + " tried to access another Agent's page");
    res.redirect("/login");
  }
}

function adminAuth(req, res, next) {
  if (req.session.isAdmin) {
    console.log("User has been authorized as admin.");
    next();
  } else {
    res.render("message", { message: "Nice try. You got close huh." });
  }
}

module.exports = {
  auth,
  adminAuth,
  agentPageAuth,
};
