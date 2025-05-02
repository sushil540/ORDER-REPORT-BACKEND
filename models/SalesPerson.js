  import mongoose from "mongoose";

  const SalesPersonSchema = new mongoose.Schema({
    salesPersonName: {
      type: String,
      required: true,
    },
    salesPersonNo:{
      type: String,
      unique: true,
    },
    city: {
      type: String,
      required: true  
    },
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true,
    },
    isDelete:{
      type:Boolean,
      default:false
    }
  }, {timestamps:true});

  export default mongoose.model('SalesPerson', SalesPersonSchema);
