require('dotenv').config()
const express = require('express')
const app = express()
const port = 5000

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