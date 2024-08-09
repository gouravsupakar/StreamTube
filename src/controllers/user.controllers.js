import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { uploadOnCloudinary } from "../utils/fileUpload.Coludinary.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";




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

    console.log(email);

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

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) throw new ApiError(400, "Avatar image is required");

    // now if we get the avatar and coverImage then we will upload them to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if(!avatar) throw new ApiError(400, "Avatar image is required");

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

})

export {registerUser}