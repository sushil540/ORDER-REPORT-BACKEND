import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import salesPersonRoutes from './routes/salesPersonRoutes.js'
import customerRoutes from './routes/customerRoutes.js'
import orderRoutes from './routes/ordersRoutes.js'
import reportRoutes from './routes/reportRoute.js'
import configureDB from "./configureDB/configDB.js"

const port = process.env.PORT || 3000

dotenv.config();

configureDB()
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/salespersons', salesPersonRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/report', reportRoutes);

app.listen(port, ()=>{
    console.log(`Server is starting at ${port}`)
})
