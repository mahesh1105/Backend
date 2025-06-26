// require('dotenv').config({path: './env'})

// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';

// import express from 'express'
// const app = express();

import dotenv from 'dotenv'
import connectDB from './db/index.js';
import app from './app.js';

dotenv.config({path: './.env'});

connectDB()
.then((res) => {
  const port = process.env.PORT || 5000;

  // If unable to connect with DB
  app.on("error", (error) => {
    console.log("ERRR: ", error);
    throw error;
  })

  // After the connection of MongoDB, we need to listen to some PORT
  app.listen(port, () => {
    console.log(`Server is running at PORT: ${port}`);
  })
}).catch((err) => {
  console.log("MongoDB Connection Failed !!! ", err);
})

/*

//IIFE - Connect to DataBase
(async ()=> {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    // If unable to connect with DB
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    })

    // If DB is connected properly
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on PORT ${process.env.PORT}`);
    })
  } catch(err) {
    console.error("ERROR: ", err);
    throw err;
  }
})()

*/

// Note:
// Nodemon will restart the server automatically if any changes happens
// But if environment variables got changed then we have to restart the server manually