import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Invalid Email']
  },
  password: {
    type: String,
    required: true,
  }
}, {timestamps:true});

export default mongoose.model("User", userSchema);
