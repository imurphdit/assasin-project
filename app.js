require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const bp = require("body-parser");
const session = require('express-session');

const sequelize = require("./sequelizeConfig")
const { Op } = require('sequelize');
const Agent = require("./agent.model")

const noImg = 'https://upload.wikimedia.org/wikipedia/en/6/67/This_Man_original_drawing.jpg'

const originalConsoleLog = console.log;

// Copied this from web :( adds timestamps to all console logs.
console.log = function(...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleLog.apply(console, [`[${timestamp}]`, ...args]);
};

//SYNC DATABASE
sequelize.sync({ force: process.env.NODE_ENV !== 'production' }).then(() =>{
  console.log('Database is connected');
  const admin = Agent.create({ agentpin: process.env.ADMIN_PIN || 1111, name: process.env.ADMIN_NAME || 'Admin', target: process.env.ADMIN_TARGET || 'Him', img: process.env.ADMIN_IMG || noImg})
});

app.enable('trust proxy')

app.set('view engine','ejs');
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.use(
  session({
    secret: process.env.KEY || 'aUniqueKeyLol',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
    },
  })
);

//AUTH MIDDLEWARE
function auth (req, res, next){
  if(req.session.agent){
    console.log(req.session.agent + ' passed authentication.')
    next()
  } else {
    res.redirect('/login')
  }
}

function adminAuth (req, res, next){
  if(req.session.agent === (process.env.ADMIN_NAME || 'Admin')){
    console.log('User has been authorized as admin.')
    next()
  } else {
    res.render('message', { message: "Nice try. You got close huh."})
  }
}

app.get('/admin', adminAuth, (req, res) => {
  res.render('adminPage');
})

app.get('/login', (req, res) => {
  res.render('login');
})


// REDIRECT TO AGENT PAGE VIA PIN
app.post('/login', async (req, res) => {
  try{
    const pin = req.body.agentpin.replace('#', '')
    const agent = await Agent.findOne({ where: { agentpin: pin}});
    
    if(!agent){
      console.log('Someone entered an invalid pin.')
      return res.render('message', { message: "Invalid pin.."})
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
    const target = await Agent.findOne({ where: { name: agent.target }})

    if(!agent){
      return res.status(404).json({
        error: 'Agent not found',
        message: 'No agent found with this UUID'
      })
    }


    if(agent.isdead) {
      return res.render('message', { message: "Better luck next time.."})
    }

    if(agent.won){
        res.render('message', { message: "We'll be in touch.."})
    } else {
        if(target == null){
          res.render('agentPage', {img: noImg, target: agent.target, pin: agent.agentpin, name: agent.name })
        } else {
          res.render('agentPage', {img: target.img, target: agent.target, pin: agent.agentpin, name: agent.name })
        }
    }

    console.log(req.session.agent + ' has logged into their dashboard.')

  } catch (err){
    console.error('Error in /agent/:id ', err)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to find agent via UUID'
    })
  }
});


//GET AGENTS LIST
app.get('/api/agent/', adminAuth, async (req, res) => {
  try {
    const agents = await Agent.findAll();
    res.json(agents)

  } catch (err){
    console.error('Error in /api/agent/', err)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list all Agents'
    })
  }
});


//CREATE AGENT 
app.post('/api/agent/', adminAuth, async (req, res) => {
  try{
    const agent = await Agent.create(req.body);
    res.json(agent);

  } catch (err){
    console.error('Error in /api/agent/', err)
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
      return res.render('message', { message: "This isn't your target.."})
    }

    //CHECK IF THERE ARE ANY PLAYERS LEFT
    if(newTarget.length === 0){
      agent.won = true;
      await agent.save();
      console.log(req.session.agent + ' has won the game. Now let us see if they are worthy..')
      res.render('message', { message: "We'll be in touch.."});
    }else{
      console.log(req.session.agent + ' is given a new target.')
      agent.target = newTarget[0].name;
      await agent.save();
      res.redirect(`/agent/${agent.id.toString()}`)
    }
  } catch (err) {
    console.error('Error in /api/kill/:target', err)
    res.status(500).json({
      error: 'Internal service error',
      message: 'Failed to kill agent'
    })
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
