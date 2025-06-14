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
  try{
    const pin = req.body;
    const agent = await Agent.findOne({ where: pin});
    
    if(!agent){
      return res.status(404).json({
        error: 'User not found',
        message: 'No agent found with matching pin.'
      })
    } else {
        req.session.agent = agent.name
        req.session.agentID = agent.id
        res.redirect('/agent/' + agent.id.toString());
    }
  } catch (err) {
    console.error('Error loggin in: ', err)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to redirect to login'
    })
  }
});


//LOAD AGENT PAGE VIA UUID
app.get('/agent/:id', auth, async (req, res) => {
  try{
    const agent = await Agent.findByPk(req.params.id)

    if(!agent){
      return res.status(404).json({
        error: 'Agent not found',
        message: 'No agent found with this UUID'
      })
    }


    if(agent.isdead) {
      return res.status(404).json({
        error: 'Failed to log in',
        message: 'This agent has been eliminated'
      })
    }

    if(agent.won){
        res.render('win')
    } else {
        res.render('agentPage', {img: agent.img, target: agent.target, pin: agent.agentpin, name: agent.name })
    }

  } catch (err){
    console.error('', err)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to find agent via UUID'
    })
  }
});


//GET AGENTS LIST
app.get('/api/agent/', auth, async (req, res) => {
  try {
    const agents = await Agent.findAll();
    res.json(agents)

  } catch (err){
    console.error('', err)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list all Agents'
    })
  }
});


//CREATE AGENT 
app.post('/api/agent/', async (req, res) => {
  try{
    const agent = await Agent.create(req.body);
    res.json(agent);

  } catch (err){
    console.error('', err)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create new agent'
    })
  }
});


//KILL AGENT
app.post('/api/kill/:target', auth, async (req, res) => {
  try{
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

    if(!agent){
      return res.status(404).json({
        error: 'Unable to find Agent',
        message: 'Does the agentID exist?'
      })
    }

    if(!agentKilled){
      return res.status(404).json({
        error: 'Unable to find target',
        message: 'Does the target exist?'
      })
    }

    //CHECK IF THIS IS THEIR TARGET
    if(agent.target === agentKilled.name){
      
      //KILL THEM
      agentKilled.isdead = true;
      agentKilled.killedby = agent.name;
      await agentKilled.save();

      console.log(req.session.agent + ' has eliminated ' + agentKilled.name)

    } else {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You are not authorized to kill this Agent'
      })
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
  } catch (err) {
    console.error('', err)
    res.status(500).json({
      error: 'Internal service error',
      message: 'Failed to kill agent'
    })
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
