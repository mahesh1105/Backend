import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

// Generally used for Middlewares OR Configurations
app.use(cors({
    // This will be the IP Address or URL of frontend, so that only frontend can talk with backend not other IPs
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

// app.use(..) is a middleware in express
// app.json(..) is a built-in middleware in express
// It parses the raw JSON body of incoming requests and adds it to req.body.
// Without this, req.body will be undefined when you send JSON data from Postman, React frontend, etc.
// { limit: "16kb" } sets the maximum allowed size for the incoming JSON body.
// If a request has a body larger than 16kb, Express will reject it and throw a PayloadTooLargeError (HTTP status code 413).
app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true, limit: "16kb"}))

// Configurations for storing files, images, favicon and other things in public folder
app.use(express.static("public"))

// Configurations for accessing OR setting the cookies of User Browser via Server, Basically performing the CRUD operations
// There are some ways, you can store the secure cookies in User's Browser and only server can read it or delete it
// Using this we can send cookies to frontend which may includes user details, refresh and access token and
// request object will have access to cookies by using this
app.use(cookieParser())

// routes import
import userRouter from './routes/user.route.js'

// routes declaration
app.use('/api/v1/users', userRouter);

// It will look something like this - users will be used as prefix
// app.use('/users', userRouter)
// http://localhost:8000/users/register OR
// http://localhost:8000/users/login

export default app;