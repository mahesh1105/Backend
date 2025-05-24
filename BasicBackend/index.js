require('dotenv').config()
const express = require('express')
const app = express()
const port = 5000

const githubData = {
  "login": "mahesh1105",
  "id": 70122194,
  "node_id": "MDQ6VXNlcjcwMTIyMTk0",
  "avatar_url": "https://avatars.githubusercontent.com/u/70122194?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/mahesh1105",
  "html_url": "https://github.com/mahesh1105",
  "followers_url": "https://api.github.com/users/mahesh1105/followers",
  "following_url": "https://api.github.com/users/mahesh1105/following{/other_user}",
  "gists_url": "https://api.github.com/users/mahesh1105/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/mahesh1105/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/mahesh1105/subscriptions",
  "organizations_url": "https://api.github.com/users/mahesh1105/orgs",
  "repos_url": "https://api.github.com/users/mahesh1105/repos",
  "events_url": "https://api.github.com/users/mahesh1105/events{/privacy}",
  "received_events_url": "https://api.github.com/users/mahesh1105/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": "Mahesh",
  "company": null,
  "blog": "",
  "location": null,
  "email": null,
  "hireable": null,
  "bio": "Passionate Learner",
  "twitter_username": null,
  "public_repos": 6,
  "public_gists": 0,
  "followers": 0,
  "following": 1,
  "created_at": "2020-08-24T02:38:41Z",
  "updated_at": "2025-05-14T07:29:18Z"
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/twitter', (req, res) => {
  res.send('Hello Mahesh, Twitter Here...')
})

app.get('/login', (req, res) => {
  res.send('<h1>Login Page</h1>')
})

app.get('/youtube', (req, res) => {
  res.send('<h2>Welcome to YouTube</h2>')
})

app.get('/github', (req, res) => {
  res.json(githubData)
})

// App will listen on the port for the requests
app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Example app listening on port ${port}`)
})

console.log("Hello World")

/*
  To start with, First you need to create the application with npm (Node Package Manager)
  
  Initialize the application using npm
  Command: npm init
  
  NodeJS - JavaScript Runtime
  ExpressJS - Web Framework for NodeJS

  Note: 
  -----
  If you add any route when the server is running, then you need to restart the server
  so that the code can be processed and routable to it

  -- In React, when such things happen, server will get automatically restarted in the backend
     That's why we never know that we need to restart the server
*/