  import mongoose from "mongoose";

  const OrderSchema = new mongoose.Schema({
    orderNo:{
      type: String,
      unique: true,
    },
    orderDate:{
      type: Date,
      required:true,
    },
    orderAmount:{
      type: String,
      required:true
    },
    salesPersonIds: {
      salesPersId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'SalesPerson',
        required: true
      }
    },
    customerIds: {
      custId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Customer',
        required: true
      }
    },
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
    },
    isDelete:{
      type:Boolean,
      default:false
    }
  }, {timestamps:true});

  export default mongoose.model('Order', OrderSchema);


