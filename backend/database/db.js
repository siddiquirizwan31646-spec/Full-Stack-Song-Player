import mongoose from "mongoose";
import dns from 'dns'

// CHANGE DNS

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DB_NAME || "STS",
        })
        console.log(`MongoDB connect Successfullly`);
    } catch (error){
        console.log(`MongoDB connection Error`, error)
    }
}


export default connectDB;
