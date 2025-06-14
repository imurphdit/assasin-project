require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const bp = require("body-parser");
const session = require('express-session');

const sequelize = require("./sequelizeConfig")
const { Op } = require('sequelize');
const Agent = require("./agent.model")
sequelize.sync();

app.set('view engine','ejs');
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.use(
  session({
    secret: 'aUniqueKeyLol', // Replace with a unique key
    resave: false,           // Avoid resaving unchanged sessions
    saveUninitialized: false, // Only save sessions with initialized data
    cookie: {},
  })
);

function auth (req, res, next){
  if(req.session.agent){
    console.log(req.session.agent + ' passed authentication.')
    next()
  } else {
    res.redirect('/login')
  }
}

app.get('/admin', (req, res) => {
  res.render('adminPage');
})

app.get('/login', (req, res) => {
  res.render('login');
})


// REDIRECT TO AGENT PAGE VIA PIN
app.post('/login', async (req, res) => {
  const pin = req.body;
  const agent = await Agent.findOne({ where: pin});
  
  if (agent) {
    req.session.agent = agent.name
    req.session.agentID = agent.id
    res.redirect('/agent/' + agent.id.toString());
  } else {
    res.sendStatus(404);
  }
});


//LOAD AGENT PAGE VIA UUID
app.get('/agent/:id', auth, async (req, res) => {
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
app.get('/api/agent/', auth, async (req, res) => {
  const agents = await Agent.findAll();
  res.json(agents); 
});


//CREATE AGENT 
app.post('/api/agent/', async (req, res) => {
  const agent = await Agent.create(req.body);
  res.json(agent);
});


//KILL AGENT
app.post('/api/kill/:target', auth, async (req, res) => {
  const agent = await Agent.findByPk(req.session.agentID)
  const agentKilled = await Agent.findOne( { where: { name: req.params.target }})
  const newTarget = await Agent.findAll({
    where: {
      isdead: false,
      [Op.not]: [
        { name: [req.session.agent, req.params.target]}
      ]
    },
    order: sequelize.random(),
    limit: 1
  })

  //CHECK IF THIS IS THEIR TARGET
  if(agent.target === agentKilled.name){
    agentKilled.isdead = true;
    agentKilled.killedby = agent.name;
    await agentKilled.save();
    console.log(req.session.agent + ' has eliminated ' + agentKilled.name)
  } else {
    console.log(req.session.agent + ' attempted an unauthorized kill...')
    return res.send('This isnt your target...')
  }

  //CHECK IF THERE ARE ANY PLAYERS LEFT
  if(newTarget.length === 0){
    agent.won = true;
    await agent.save();
    console.log(req.session.agent + ' has won the game. Now let us see if they are worthy..')
    res.render('win');
  } else{
    console.log(req.session.agent + ' is given a new target.')
    agent.target = newTarget[0].name;
    await agent.save();
    res.redirect(`/agent/${agent.id.toString()}`)
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
