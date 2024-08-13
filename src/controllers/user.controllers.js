import dotenv from "dotenv"
dotenv.config()
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { uploadOnCloudinary } from "../utils/fileUpload.Coludinary.js";
import { ApiResponse } from "../utils/apiResponseHandler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



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
        req.user?._id,    // from the auth middleware
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


const refreshAccessToken = asyncHandler( async(req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    // now verify the incomming refresh token
    
  try {
    const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
    if (!decodedToken) {
      throw new ApiError(401, "Invalid Token");
    }
  
    // find the user
  
    const user = await User.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
  
    // now match the token given by the user and the token in his database
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }
  
    // now if the tokens match the we will generate new access tokens
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
   const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
  
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
      new ApiResponse(
          200,
          {
              accessToken,
              refreshToken: newRefreshToken,
          },
  
          "Access token refreshed"
      )
   );

  } catch (error) {
    throw new ApiError(401, "Failed to refresh access token")
  }

});


const changeCurrentPassword = asyncHandler( async(req, res) => {

    const {oldPassword, newPassword} = req.body;

    // we will get the user id from the auth middleware

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Password is not correct");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );

});

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully  "
        )
    )
});

const updateAccountDetails = asyncHandler( async(req, res) => {
    const {fullName, email} = req.body;

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    
    ).select("-password");

    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})


const updateUserAvatar = asyncHandler( async(req, res) => {

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar image file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    // Todo: delete old avatar image

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                avatar: avatar.url
            }
        },

        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar image uploaded successfully"
        )
    )
});


const updateUserCoverImage = asyncHandler( async(req, res) => {

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image uploaded successfully"
        )
    )

});


const getUserChannelProfile = asyncHandler( async (req, res) => {

    // get the username from the url

    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "username is missing");
    }

    // aggeregation pipeline

   const channel = await User.aggregate(   // the output that we get from aggeregation pipelines is array
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },

            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },

            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField:"subscriber",
                    as: "subscribedTo"
                }
            },

            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },

                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },

                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },

            {
                $project: {
                    fullName: 1,
                    username: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1

                }
            }
        ]
    );

    if(!channel.length){
        throw new ApiError(404, "Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    )
});



const getUserWatchHistory = asyncHandler( async(req, res) => {
    // req.user._id   we get a string which is the id when we use it with mongoose it converts the string to id behind the scene

    // but in aggregation pipeline we have to convert it then we have to use it

    const user = await user.aggregate(
        [
            // stage 1 find the user
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.user._id)       // just create the mongoose objectId and pass the req.user._id
                }
            },

            //stage 2 after getting the user lookup and join the watch history with videos model

            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [           // inside the lookup you can write sub pipeline with the pipeline property.
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },

                        // this pipeline to structure the data we get in the output as array can be difficult to deal with in fron end;
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
});





export { 
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}