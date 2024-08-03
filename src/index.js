// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/connection.js";
import { app } from "./app.js";

dotenv.config();

const port = process.env.PORT || 8000;

// the second way to export function from db folder and execute the function;

connectDB()   // now when ever we call the connection function which is asyncronus function it returns a promise so use .then and .catch to handel the promise and error
.then(() => {

    app.on("error", (error) => {
        console.log("Error connecting to server", error);
            throw error;
    });

    app.listen(port, () => {
        console.log(`Server is up and running on port ${port}`);
    })
})
.catch((error) => {
    console.log("Error connecting to Mongodb Database: ", error);
})



















//    This is one of the way to connect to the mongodb database and handel the errors

/*
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

const app = express();

;( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        .then(() => {
            console.log("Connected to MongoDB");
          })
          .catch(err => {
            console.error("Error connecting to MongoDB:", err);
          });

        app.on("error", (error) => {
            console.log("Error connecting to server", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is up and running on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.log("error connecting to mongodb database", error);
        throw error;
    }
})();

*/
