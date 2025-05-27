import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // Check which host we are connected to: Production, Development, Testing
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch(err) {
        console.log("MONGODB Connection Failed: ", err);
        process.exit(1);
    }
}

export default connectDB;