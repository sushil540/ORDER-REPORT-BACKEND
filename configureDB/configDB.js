import mongoose from "mongoose"

const configureDB = async () => {
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/order-reports-app")
        console.log("Connected to db")
    }catch(error){
        console.log("Error connecting to db", error)
    }
}

export default configureDB
