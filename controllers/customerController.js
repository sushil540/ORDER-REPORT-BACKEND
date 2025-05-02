import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

const customerCtlr = {}

customerCtlr.create = async (req, res) => {
    const { customerNo, customerName, city, salesPersonIds } = req.body;
    const formattedSalesPersonIds = salesPersonIds.map(sp => ({
      salesPersId: sp.salesPersId 
    }));

    try {
        const newCustomer = await Customer.create({ 
          userId: req.user.id, 
          customerNo:customerNo.toLowerCase(),
          customerName:customerName.toLowerCase(), 
          city:city.toLowerCase(),  
          salesPersonIds:formattedSalesPersonIds 
        });
        res.status(201).json(newCustomer);
    } catch (err) {
      console.log(err)
        res.status(400).json({ message: "Failed to create Customer" });
    }
}

customerCtlr.view = async (req, res) =>{
    try{
        const { id } = req.query
        const customer = await Customer.findOne({ id, userId: req.user.id, isDelete:false }).select("-userId");
        res.json(customer);
    }catch(err){        
      res.status(400).json({ message: "Failed to fetch Customer" });
    }
}

customerCtlr.getAllCustomers = async (req, res) => {
    try {
      const customers = await Customer.find({ userId: req.user.id, isDelete: false })
        .select("-userId")
        .populate("salesPersonIds.salesPersId","salesPersonName")
        .lean();
        
      const customerIds = customers.map((cust) => cust._id);
  
      const orders = await Order.find({
        isDelete: false,
        "customerIds.custId": { $in: customerIds }
      }).lean();  

      const customersWithOrders = customers.map((cust) => {
        const customerOrders = orders.filter(order =>
          order.customerIds.some(c => c.custId.toString() === cust._id.toString())
        );
        return {
          ...cust,
          orders: customerOrders
        };    
      });
      res.json(customersWithOrders);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to fetch Customers and Orders" });
    }
}

customerCtlr.update = async (req, res) => {
    const { id } = req.query        
    const { customerNo, customerName, city, salesPersonIds } = req.body;
    const formattedSalesPersonIds = salesPersonIds.map(sp => ({
      salesPersId: sp.salesPersId 
    }));      
    try {
      const customer = await Customer.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { customerNo, customerName, city, salesPersonIds:formattedSalesPersonIds },
        { new: true }   
      );
      res.json(customer);
    } catch (err) {
      res.status(400).json({ message: "Failed to update Customer" });
    }
}

customerCtlr.delete = async (req, res) => {
    try {
      const { id } = req.query
      await Customer.findOneAndUpdate(
      { _id: id, userId: req.user.id, isDelete:false },
      { $set:{ isDelete:true}},
      { new:true });
      res.json({ msg: "Customer deleted" });
    } catch (err) {
      res.status(400).json({ message: "Failed to delete Customer" });
    }
}

export default customerCtlr