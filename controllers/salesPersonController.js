import Customer from "../models/Customer.js";
import SalesPerson from "../models/SalesPerson.js";

const salesPersonCtlr = {}
        
salesPersonCtlr.create = async (req, res) => {
    const { salesPersonNo, salesPersonName, city } = req.body;
    try {
      const salesPerson = await SalesPerson.create({
        salesPersonName:salesPersonName.toLowerCase(), 
        salesPersonNo:salesPersonNo.toLowerCase(),
        city:city.toLowerCase(),
        userId: req?.user?.id
      });
      res.status(201).json(salesPerson);
    } catch (err) {
      console.log(err)
      res.status(400).json({err});
    }
}

salesPersonCtlr.view = async (req, res) =>{
    try{
        const { id } = req.query
        const salesPerson = await SalesPerson.findOne({ id, userId: req.user.id, isDelete:false }).select("-userId")
        res.json(salesPerson);
    }catch(err){
      res.status(400).json({ message: "Failed to fetch sales person" });
    }
}

  salesPersonCtlr.getAllSalesPersons = async (req, res) => {
      try {
        const salesPersons = await SalesPerson.find({ 
          userId: req.user.id, 
          isDelete: false 
        }).lean();
        // For each salesperson, find matching customers
        const results = await Promise.all(salesPersons.map(async (sp) => {
          const customers = await Customer.find({
            isDelete: false,
            'salesPersonIds.salesPersId': sp._id
          }).select('customerName customerNo city');
    
          return {
            ...sp,
            customers
          };
        }));
        res.json(results);
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Failed to fetch sales persons with customers" });
      }
  }

salesPersonCtlr.update = async (req, res) => {
    const { id } = req.query
    const { salesPersonNo, salesPersonName, city } = req.body;
    try {
      const salesPerson = await SalesPerson.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        {
          salesPersonName:salesPersonName.toLowerCase(), 
          salesPersonNo:salesPersonNo.toLowerCase(), 
          city:city.toLowerCase()
        },
        { new: true }
      );
      res.json(salesPerson);
    } catch (err) {
      res.status(400).json({ message: "Failed to update sales person" });
    }
}

salesPersonCtlr.delete = async (req, res) => {
    try {
      const { id } = req.query
      await SalesPerson.findOneAndUpdate(
      { _id: id, userId: req.user.id, isDelete:false },
      { $set:{ isDelete:true}},
      { new:true });  
      res.json({ msg: "sales person deleted" });
    } catch (err) {
      res.status(400).json({ message: "Failed to delete sales person" });
    }
}

export default salesPersonCtlr