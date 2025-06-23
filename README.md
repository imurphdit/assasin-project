
# Senior Assassin Express App

I wanted to get my friends all together and involved this summer so I made a sort of spin on the age old senior assassin game.

"Agents" are made with the admin panel. Each Agent needs a PIN and a target to start out. After logging in and killing their Target, it generates a new target until there is no one left, in which case they win.

## Tech Stack

**Client:** HTML & JS 

**Server:** Node, Express, EJS, Sequelize & SQLite


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`

`KEY`

`NODE_ENV`

`ADMIN_NAME`

`ADMIN_TARGET`

`ADMIN_PIN`

`ADMIN_IMG`


## Run Locally

Clone the project

```bash
  git clone https://github.com/imurphdit/assasin-project
```

Go to the project directory

```bash
  cd assasin-project
```

Install dependencies

```bash
  npm install
```

Start the development server

```bash
  npm run dev
```
Go to login page (default port is 3000)

```bash
  http://localhost:3000/login
```

## Lessons Learned

I learned about EJS, session mangement, express middleware(auth), error handling, async/await, sequelize, and real life deadlines.


## Roadmap

- Change API endpoints to use UUID instead of name (breaks when people use other characters)

- Install tailwind for real 

- Figure out proper way to handle update & delete on admin page

- Fix admin account creating ever restart in prod

