import mongoose from "mongoose";
import {DB_NAME} from '../constants.js'

const connectDB = async() => {
    try {

       const connectionInctance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        
       console.log(`\n MongoDB connected !! DB Host: ${connectionInctance.connection.host}`);

       
        
    } catch (error) {
        console.log("error connecting to database", error);
        // throw error;  we can trow the error and we can also use process to exit using exit code  read once
        process.exit(1);
    }
}

export default connectDB;