import Order from "../models/Order.js";

const orderCtlr = {}

orderCtlr.create = async (req, res) => {
    const { orderNo, orderDate, orderAmount, customerIds, salesPersonIds  } = req.body;
    try {
        const newOrder = await Order.create({ 
          userId: req.user.id, 
          orderNo:orderNo.toLowerCase(), 
          orderDate:orderDate.toLowerCase(), 
          orderAmount:orderAmount, 
          customerIds:customerIds,
          salesPersonIds:salesPersonIds
        });
        res.status(201).json(newOrder);
    } catch (err) {
      console.log(err)
        res.status(400).json({ message: "Failed to create new order" });
    }
}

orderCtlr.view = async (req, res) =>{
    try{
        const { id } = req.query
        const order = await Order.findOne({ 
            id, 
            userId: req.user.id, 
            isDelete:false 
        }).select("-userId");
        res.json(order);
    }catch(err){        
      res.status(400).json({ message: "Failed to fetch order" });
    }
}

orderCtlr.getAllOrders = async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.user.id, isDelete:false })
      .select("-userId")
      .populate("customerIds.custId", "customerName")
      .populate("salesPersonIds.salesPersId","salesPersonName")
      .lean(); 
      res.json(orders);
    } catch (err) {
      res.status(400).json({ message: "Failed to fetch order" });
    } 
}

orderCtlr.update = async (req, res) => {
    const { id } = req.query
    const { 
      orderNo, 
      orderDate,  
      orderAmount, 
      customerIds, 
      salesPersonIds } = req.body;
      
    try {
      const order = await Order.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { 
          orderNo: orderNo.toLowerCase(), 
          orderDate, 
          orderAmount, 
          customerIds:customerIds,
          salesPersonIds:salesPersonIds
         },
        { new: true }
      );
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: "Failed to update order"});
    }
}

orderCtlr.delete = async (req, res) => {
    try {
      const { id } = req.query
      await Order.findOneAndUpdate( 
      { _id: id, userId: req.user.id, isDelete:false },
      { $set:{ isDelete:true}},
      { new:true });
      res.json({ msg: "Order deleted" });
    } catch (err) {
      res.status(400).json({ message: "Failed to delete order" });
    }
}

export default orderCtlr