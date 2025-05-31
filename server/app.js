const express = require('express')
const app = express()
const port = 3000
const bp = require("body-parser");
app.set('view engine','ejs');

const sequelize = require("./sequelizeConfig")
const Agent = require("./agent.model")
sequelize.sync({ force: true });


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
    res.render('agentPage', { img: agent.img, target: agent.target, pin: agent.agentpin });
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
app.post('/api/agent/kill/:name', async (req, res) => {
  const agent = await Agent.findOne({ where: { target: req.params.name } })
  const agentKilled = await Agent.findOne( { where: { name: req.params.name }})
  
  agentKilled.isdead = true;
  agentKilled.killedby = agent.name;
  await agentKilled.save();


  agent.target = agentKilled.target;
  await agent.save();

  res.send("Killed " + req.params.name)
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
