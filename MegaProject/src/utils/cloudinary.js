import {v2 as cloudinary} from 'cloudinary' // Service for uploading files or documents (images, videos and others)
import fs from "fs" // file system for node js --> By Default there with NodeJS Installation - For File Operations

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null;

    // Set the configurations for cloudinary to ensure env vars are available
    // If set outside the functions then env variables are undefined at that point
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Upload the file on Cloudinary - use await as the below operation will take time
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    // File has been uploaded successfully
    // console.log("File has been uploaded on Cloudinary ", response.url);

    // Remove the file stored in temporary folder - Synchronous removal - after successful upload
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // Remove locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
}

export default uploadOnCloudinary;