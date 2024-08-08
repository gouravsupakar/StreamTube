import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"

const app = express();


// middlewares

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit: "20kb"}));     // this means we accept json data upto only 20 kb so we dont crash the server and database
app.use(express.urlencoded({extended: true, limit: "16kb"}));  // this is to configure and pass data that we get from the urls

app.use(express.static("public")); //to serve up static file like images, favicons, pdfs from the public folder
app.use(cookieParser());


//routes import 

import userRouter from "./routes/user.routes.js"

// routes declaration in the form middleware


app.use("/api/v1/users", userRouter)

export { app }