import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import validator from "validator";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import SalesPerson from "../models/SalesPerson.js";

const userCtlr = {}

userCtlr.signup = async (req, res) => {  
    const { email, password } = req.body;
    if (!validator.isEmail(email) || !validator.isStrongPassword(password)) {
      return res.status(400).json({ message: "Invalid email or weak password" });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword });
      res.status(201).json({ message: "Registered Successfully" });
    } catch (err) {
      res.status(400).json({ message: "User already exists" });
    }
}


userCtlr.login = async (req, res) => {
  const { email, password } = req.body;

  try{
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      res.status(200).json({ token });
    }catch(err){
      res.status(500).json({ message: "Network error" })
    }
}

userCtlr.user = async (req, res) => {
  try{
    const user = await User.findOne({ _id:req.user.id }).select("_id email").lean();
    if (!user) return res.status(400).json({ message: "User not found" });  
    res.status(200).json({ data:user });  
  }catch(err){
    res.status(500).json({ message: "Network error" })
  }   
}

userCtlr.dashboard = async (req, res) => {
  try {
    const [salesPersonCount, customerCount, orderCount] = await Promise.all([
      SalesPerson.countDocuments({userId:req.user.id, isDelete: false }),
      Customer.countDocuments({ userId:req.user.id, isDelete: false }),
      Order.countDocuments({ userId:req.user.id, isDelete: false }),
    ]);

    res.json({
      salesPersons: salesPersonCount,
      customers: customerCount,
      orders: orderCount
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default userCtlr