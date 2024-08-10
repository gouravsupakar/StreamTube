import { ApiError } from "../utils/apiErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


// now if you dont use the res method then there you can write it as _

export const verifyJwt = asyncHandler( async(req, _, next) => {

   try {
     // get the tokens from the cookies and also check if the user is sending any token through req.headers;
 
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
 
     // if we dont have the token
     if (!token) {
         throw new ApiError(401, "Unauthorized request")
     }
 
     // if we have the token then
     const tokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
 
     // get the user info from database
 
     const user = await User.findById(tokenInfo?._id).select("-password -refreshToken");         // _id we are getting from like we specified in user.models.js
 
 
     // if user is not there then
 
     if (!user) {
        
        throw new ApiError(401, "Invalid Access token");
     }
 
     // now if we have the user then we we will set a new object
 
     req.user = user;           // here req.user user is just a name we can use any name
     next();
 
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
   }

})