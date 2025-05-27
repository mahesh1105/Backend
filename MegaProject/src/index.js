// require('dotenv').config({path: './env'})

// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';

// import express from 'express'
// const app = express();

import dotenv from 'dotenv'
import connectDB from './db/index.js';

dotenv.config({path: './env'});

connectDB();

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