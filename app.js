const express = require('express')
const app = express()
const port = 3000
const bp = require("body-parser");
app.set('view engine','ejs');

const sequelize = require("./sequelizeConfig")
const { Op } = require('sequelize');
const Agent = require("./agent.model")
sequelize.sync();


app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.get('/admin', (req, res) => {
  res.render('adminPage');
})

app.get('/login', (req, res) => {
  res.render('login');
})


// Login redirect
app.post('/login', async (req, res) => {

  const pin = req.body;
  console.log(pin);

  const agent = await Agent.findOne({ where: pin});
  
  if (agent) {
    const pin = agent.id.toString();
    res.redirect('/agent/' + Buffer.from(pin).toString('base64'));
  } else {
    res.sendStatus(404);
  }
});


// Player login via base64ID
app.get('/agent/:id', async (req, res) => {

  //Convert ID from base64 to agent ID in database
  const agentId = Buffer.from(req.params.id, 'base64').toString('ascii')

  const agent = await Agent.findByPk(agentId)
  if (agent){
    res.render('agentPage', { img: agent.img, target: agent.target, pin: agent.agentpin, name: agent.name });
  } else {
    res.sendStatus(404);
  }
});


// Get all players
app.get('/api/agent/', async (req, res) => {
  const agents = await Agent.findAll();
  res.json(agents); 
});


// Create a player 
app.post('/api/agent/', async (req, res) => {
  const agent = await Agent.create(req.body);
  res.json(agent);
});


// Kill a player
app.post('/api/:agent/kill/:target', async (req, res) => {
  const agent = await Agent.findOne({ where: { name: req.params.agent } })
  const agentKilled = await Agent.findOne( { where: { name: req.params.target }})
  const newTarget = await Agent.findAll({
    where: {
      isdead: false,
      [Op.not]: [
        { name: [req.params.agent, req.params.target]}
      ]
    },
    order: sequelize.random(),
    limit: 1
  })
  console.log(newTarget)

  agentKilled.isdead = true;
  agentKilled.killedby = agent.name;
  await agentKilled.save();

  if(newTarget.length === 0){
    res.send("You won!")
  } else{
    agent.target = newTarget[0].name;
    await agent.save();
    res.send("Killed " + req.params.target)
  }
});


// Update player target
app.post('/api/agent/target', async (req, res)  => {
  console.log(req.body.target)
  const agent = await Agent.update(
    { target: req.body.target},
    {
      where: {
        name: req.body.name,
      }
    }
  )

  
  res.json(agent)
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
