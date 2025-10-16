import mongoose from "mongoose";  

export async function connectDB() {
    const MONGODB_URL = process.env.MONGODB_URI;
    try {
        const instance = await mongoose.connect(MONGODB_URL);
        console.log(`MongoDB Connected: ${instance.connection.host}`);
    } catch (error) {
        console.log(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;