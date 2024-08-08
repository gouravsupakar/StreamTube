import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true        // read about this it is used for searching 
    },

    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        min: 8
    },

    refreshToken: {
        type: String,
    },

    avatar: {
        type: String,    // cloudinary url
        required: true
    },

    coverImage: {
        type: String,    // cloudinary url
    },

    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ]


}, {timestamps: true});

// we will use Pre hook in mongodb middleware
// Pre middleware functions are executed one after another, when each middleware calls next.

// this pre middleware executes a certain code just before saving in mongodb or any other curd function

// we dont use arrow function format () => {} because context of this cannot be passed in arrow function 

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();   // if password is not modified then exit else  hash the password

    this.password = await bcrypt.hash(this.password, 10);
    next();
})


// Now mongoose lets us make custom methods

userSchema.methods.isPasswordCorrect = async function (password)  {
   return await bcrypt.compare(password ,this.password);  // this will return in true or false;
}

// this is to generate access token

userSchema.methods.generateAccessToken =  function () {
   return jwt.sign(
        {                                   // first pass inside an object the payload the data you want to send in the token
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },

        process.env.ACCESS_TOKEN_SECRET,         // second pass the access token secret

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY       // third pass the expiry inside a object
        }
    )
}

userSchema.methods.generateRefreshToken =  function () {
    return jwt.sign(
        {                                   // first pass inside an object the payload the data you want to send in the token
            _id: this._id,
        },

        process.env.REFRESH_TOKEN_SECRET,         // second pass the access token secret

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY       // third pass the expiry inside a object
        }
    )
}

export const User = mongoose.model("User", userSchema);