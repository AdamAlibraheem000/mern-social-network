// MongoDB connection
const mongoose = require('mongoose');
const config = require('config');
// grabs mongoURI value from default.json file
const db = config.get('mongoURI');

const connectDB = async () => {
    try{
       await mongoose.connect(db,{
           useNewUrlParser: true,
           
       });

       console.log('MongoDB Connected...')
    }catch(err){
        console.log(err.message);
        // Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;