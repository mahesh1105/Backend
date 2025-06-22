import {v2 as cloudinary} from 'cloudinary' // Service for uploading files or documents (images, videos and others)
import fs from "fs" // file system for node js --> By Default there with NodeJS Installation - For File Operations

// Set the configurations for cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null;

    // Upload the file on Cloudinary
    const response = cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    // File has been uploaded successfully
    console.log("File has been uploaded on Cloudinary ", response.url);
    return response;
  } catch (error) {
    fs.unlink(localFilePath); // remove locally saved temporary file as the upload operation got failed
    return null;
  }
}

export default uploadOnCloudinary;