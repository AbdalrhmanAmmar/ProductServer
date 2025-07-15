const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://abdammar2023:zgvPVToRt1wuJok8@chinese.3pghvua.mongodb.net/?retryWrites=true&w=majority&appName=chinese", {
      dbName: "chinese",
      serverSelectionTimeoutMS: 30000,
    });

    await mongoose.connection.db.admin().ping();
    console.log("✅ Connected to MongoDB and connection is healthy");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
