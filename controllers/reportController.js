import Order from "../models/Order.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import generatePdf from "../helpers/generatePdf.js";
import { 
  getSalesSummary, 
  getSalesBySalesperson, 
  getTopCustomers
} from "../helpers/reportService.js  ";
import { getOrdersSummary } from "../helpers/reportService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  
const reportCtlr = {};

reportCtlr.report = async (req, res) => {
  try {
    const { fromDate, toDate, fields, reportType, timeGranularity } = req.body;
    
    const from = fromDate ? new Date(fromDate) : "";
    const to = toDate ? new Date(toDate) : "";
    if(to){
      to.setHours(23, 59, 59, 999);
    }
    
    let reportData = [];
    let updatedFields = [];
    let detailedSummary = {}

    if(reportType && timeGranularity){
      switch (reportType) {
        case "orders_summary":
          ({ reportData, updatedFields } = await getOrdersSummary(from, to, fields, timeGranularity));
          break;
        case "sales_by_salesperson":
        ({ reportData, updatedFields, detailedSummary } = await getSalesBySalesperson(from, to, fields, timeGranularity));
          break;
        case "sales_summary":
          ({ reportData, updatedFields } = await getSalesSummary(from, to, fields, timeGranularity));
          break;
        case "top_customers":
          ({ reportData, updatedFields } = await getTopCustomers(from, to, fields, timeGranularity));
          break;
        default:
          return null
    }
  } else if (fields.length > 0) {
    // Only fetch orders with requested fields
    const projection = {};
    fields.forEach((field) => (projection[field.orderId] = 1));

    const orders = await Order.find({ orderDate: { $gte: from, $lte: to } }, projection)
      .populate({ path: "salesPersonIds.salesPersId", model: "SalesPerson", select: "salesPersonName" })
      .populate({ path: "customerIds.custId", model: "Customer", select: "customerName" })
      .lean();

    reportData = orders;
    updatedFields = [...fields];
  }
    const filePath = await generatePdf(
        reportData, 
        updatedFields, 
        from, 
        to, 
        timeGranularity, 
        reportType,
        detailedSummary
      );

    res.setHeader("Content-Disposition", `inline; filename="report.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Failed to download file" });
      } else {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.error("Report generation failed:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};







//------------------- don't touch---------------------------

// reportCtlr.report = async (req, res) => {
//   try {
//     const { fromDate, toDate, fields} = req.body;
//     if (!fromDate || !toDate || !fields || !fields.length) {
//       return res.status(400).json({ message: "Invalid input" });
//     }

//     const from = new Date(fromDate);
//     const to = new Date(toDate);
//     to.setHours(23, 59, 59, 999);

//     const projection = {};
//     fields.forEach((field) => (projection[field.orderId] = 1));

//     const orders = await Order.find({ orderDate: { $gte: from, $lte: to } }, projection)
//       .populate({ path: "salesPersonIds.salesPersId", model: "SalesPerson", select: "salesPersonName" })
//       .populate({ path: "customerIds.custId", model: "Customer", select: "customerName" })
//       .lean();

//     let filePath;
//     filePath = await generatePdfReport(orders, fields, from, to);

//     res.setHeader("Content-Disposition", `inline; filename="report.pdf"`);
//     res.setHeader("Content-Type","application/pdf");
//     res.sendFile(filePath, (err) => {
//       if (err) {
//         console.error("Download error:", err);
//         res.status(500).json({ message: "Failed to download file" });
//       }
//       fs.unlinkSync(filePath);  
//     });
//   } catch (err) {
//     console.error("Report generation failed:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


// reportCtlr.download = async (req, res) => {
//   try {
//     const { format = "pdf" } = req.query; // 'csv' or 'pdf'
//     const data = await Order.find({ isDelete: false }).populate("customerIds.custId salesPersonIds.salesPersId").lean();
//     let filePath;
//     if (format === 'csv') {
//       filePath = generateCsvReport(data, fields);
//     }

//     if (format === 'pdf') {
//       filePath = generatePdfReport(data, fields, from, to);
//     }
//     res.setHeader("Content-Disposition", `inline; filename="report.${format}"`);
//     res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/pdf");
//     res.sendFile(filePath, (err) => {
//       if (err) {
//         console.error("Download error:", err);
//         res.status(500).json({ message: "Failed to download file" });
//       }
//       fs.unlinkSync(filePath);
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to generate report' });
//   }
// };

export default reportCtlr;
