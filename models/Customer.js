import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    max:50,
    required: true,
  },
  customerNo:{
    type: String,
    unique: true,
  },
  city: {
    type: String,
    required: true
  },
  salesPersonIds: {
    salesPersId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'SalesPerson',
      required: true
    }
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  isDelete:{
    type:Boolean,
    default:false
  }
}, {timestamps:true});

export default mongoose.model('Customer', CustomerSchema);


