// const express = require('express');
import express from 'express'
import cors from 'cors'
const app = express();

app.get('/', (req, res) => {
  res.send('Server is Ready...');
})

// Whitelist the below URL for all the methods
// const allowedOrigin = 'https://symmetrical-disco-6wpjw75jv6wf67w-5174.app.github.dev';

// app.use(cors({
//   origin: allowedOrigin,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true // if you're using cookies or headers
// }));

// app.use(express.json());

app.get('/api/jokes', (req, res) => {
  const jokes = [
    {
      id: 1,
      title: 'First Joke',
      content: 'This is first joke'
    },
    {
      id: 2,
      title: 'Second Joke',
      content: 'This is second joke'
    },
    {
      id: 3,
      title: 'Third Joke',
      content: 'This is third joke'
    },
    {
      id: 4,
      title: 'Fourth Joke',
      content: 'This is fourth joke'
    },
    {
      id: 5,
      title: 'Fifth Joke',
      content: 'This is fifth joke'
    }
  ]
  
  // Send the data to that route - basically works as an api
  res.send(jokes);
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Serve at http://localhost:${port}`);
})