import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {

    if (!localFilePath) return null

    try {
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // file has been uploaded successfull

        console.log("file is uploaded on cloudinary ", response.url);

        fs.unlinkSync(localFilePath);
        
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log(error);
        return null;
    }
}

export { uploadOnCloudinary }