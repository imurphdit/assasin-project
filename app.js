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


// REDIRECT TO AGENT PAGE VIA PIN
app.post('/login', async (req, res) => {

  const pin = req.body;
  console.log(pin);

  const agent = await Agent.findOne({ where: pin});
  
  if (agent) {
    res.redirect('/agent/' + agent.id.toString());
  } else {
    res.sendStatus(404);
  }
});


//LOAD AGENT PAGE VIA UUID
app.get('/agent/:id', async (req, res) => {
  const agent = await Agent.findByPk(req.params.id)
  
  //IF AGENT ALIVE, LOAD
  if (agent && agent.isdead === false){
    if (agent.won === true){
      res.render('win')
    } else {
      res.render('agentPage', { img: agent.img, target: agent.target, pin: agent.agentpin, name: agent.name });
    }
  } else {
    res.sendStatus(404);
  }
});


//GET AGENTS LIST
app.get('/api/agent/', async (req, res) => {
  const agents = await Agent.findAll();
  res.json(agents); 
});


//CREATE AGENT 
app.post('/api/agent/', async (req, res) => {
  const agent = await Agent.create(req.body);
  res.json(agent);
});


//KILL AGENT
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

  agentKilled.isdead = true;
  agentKilled.killedby = agent.name;
  await agentKilled.save();

  if(newTarget.length === 0){
    agent.won = true;
    await agent.save();
    res.render('win');
  } else{
    agent.target = newTarget[0].name;
    await agent.save();
    res.redirect(`/agent/${agent.id.toString()}`)
  }
});


// // Update player target
// app.post('/api/agent/target', async (req, res)  => {
//   console.log(req.body.target)
//   const agent = await Agent.update(
//     { target: req.body.target},
//     {
//       where: {
//         name: req.body.name,
//       }
//     }
//   )

  
//   res.json(agent)
// });


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
