import dotenv from "dotenv"
dotenv.config()
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { uploadOnCloudinary } from "../utils/fileUpload.Coludinary.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";



const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // after creating refresh token set refresh token in data base and the save it ;
       
        user.refreshToken = refreshToken; 
        user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};  // return object of access and refresh token

    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Something went wrong while generating Access and Refresh tokens");
    }
}

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token firlds from response
    // check for user creation,
    // return response


    const {username, fullName, email, password} = req.body;

    // console.log(email);

    // validations
    if(
        [username, fullName, email, password].some((userData) => {  
            return userData?.trim() === "";                         // some checks and returns true if all the fiels are empty
        })
    ){
        throw new ApiError(400, "All fields are required");
    }

    // email validation
    if(!email.includes("@")){
        throw new ApiError(400, "Please enter a valid email id.")
    }

    const userExists = await User.findOne({
        $or: [{username}, {email}]            // using $ we and use many operators
    });

    if(userExists) throw new ApiError(409, "User with email or username already exists");

    // handeling file using multer

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log(avatarLocalPath);
    console.log(coverImageLocalPath);

    if(!avatarLocalPath) throw new ApiError(400, "Avatar image path is required");

    // now if we get the avatar and coverImage then we will upload them to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if(!avatar) console.log(avatar);;

    // creating the user entry in database;

   const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",    // check if  coverImage is not there then send "" (empty string)
        username: username.toLowerCase(),
        email,
        password
    });

    const createdUser = await User.findById(user._id).select(     // here we are selecting things we dont want in our response that we will return to frontend
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});


const loginUser = asyncHandler( async (req, res) => {

    // take login credentials from the user
    // find the user
    // check the login credentials of the existing user
    // check password
    // send access and refresh token
    // send tokens in cookies
    // then send response

    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    });

    if(!user) {
        throw new ApiError(404, "user does not exist");
    }

    // now we will use ispasswordCorrect that we made to check the password and we attached it to the user model userSchema.methods.isPasswordCorrect
    
   const isPasswordValid =  await user.isPasswordCorrect(password);

   if(!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
   }

   // now if the password is correct then we will generate access and refresh token
   // in case we dont have to write the token grneration code again and again we will create a function to standdarise it

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);


   // after this we will send the tokens through cookies

   // first we will find user and not send them password and token fields in response

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   // setting options for cookies

   const options = {
       httpOnly : true,
       secure: true
   };


   // now we will send response

   return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken
        },

        "User logged in Successfully"
    )
   )

});


const logOutUser = asyncHandler( async(req, res) => {
    // use req.user that we injected from verifyJwt middleware

    // find the user and delete the token

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );


    // now clear the cookies
    // bring the options

    const options = {
        httpOnly : true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {},  "User Logged out")
    )
});

export { 
    registerUser,
    loginUser,
    logOutUser
}