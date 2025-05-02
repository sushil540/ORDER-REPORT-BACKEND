import Order from "../models/Order.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import formatDateToDDMMYYYY from "../helpers/dateFormat.js";

const reportCtlr = {};

reportCtlr.report = async (req, res) => {
  try {
    const { fromDate, toDate, fields } = req.body;
    if (!fromDate || !toDate || !fields || !fields.length) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const projection = {};
    fields.forEach((field) => (projection[field.orderId] = 1));

    const orders = await Order.find(
      { orderDate: { $gte: from, $lte: to } },
      projection
    )
      .populate({
        path: "salesPersonIds.salesPersId",
        model: "SalesPerson",
        select: "salesPersonName",
      })
      .populate({
        path: "customerIds.custId",
        model: "Customer",
        select: "customerName",
      })
      .lean();

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const fileName = `Order_Report_${Date.now()}.pdf`;
    const filePath = path.resolve("reports", fileName);

    fs.mkdirSync("reports", { recursive: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text("Order Report", {
      align: "center",
      underline: true,
    });
    doc.moveDown();

    doc.fontSize(10).fillColor("black");
    const today = new Date();
    const formattedDate = formatDateToDDMMYYYY(today);
    const formattedFromDate = formatDateToDDMMYYYY(from);
    const formattedToDate = formatDateToDDMMYYYY(to);

    doc.text(`Generated Date: ${formattedDate}`, doc.options.margin, 70, {
      align: "right",
    });
    doc.text(`From: ${formattedFromDate}`, doc.options.margin, 85);
    doc.text(`To: ${formattedToDate}`, doc.options.margin, 100);

    doc.moveDown(3);
    const printableFields = [
      { orderId: "slNo", orderField: "Sl No" },
      ...fields,
    ];

    const pageWidth = doc.page.width - doc.options.margin * 2;
    const colWidth = pageWidth / printableFields.length;
    const baseRowHeight = 30;
    let y = doc.y;

    // Header Row
    printableFields.forEach((field, index) => {
      const label = field.orderField || field.orderId;
      doc
        .rect(index * colWidth + doc.options.margin, y, colWidth, baseRowHeight)
        .stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(label, index * colWidth + doc.options.margin + 5, y + 7, {
          width: colWidth - 10,
          align: "center",
        });
    });
    y += baseRowHeight;

    // Data Rows
    orders.forEach((order, orderIndex) => {
      const cellHeights = printableFields.map((field, index) => {
        let value = "";
        if (field.orderId === "slNo") {
          value = orderIndex + 1;
        } else if (field.orderId === "salesPersonIds") {
          value = order.salesPersonIds
            .map((sp) => sp.salesPersId?.salesPersonName.toUpperCase() || "N/A")
            .join(", ");
        } else if (field.orderId === "customerIds") {
          value = order.customerIds
            .map((c) => c.custId?.customerName.toUpperCase() || "N/A")
            .join(", ");
        } else {
          const fieldValue = order[field.orderId];
          value =
            fieldValue instanceof Date
              ? fieldValue.toISOString().split("T")[0]
              : fieldValue ?? "";
        }
        return doc.heightOfString(String(value), { width: colWidth - 10 });
      });

      const rowHeight = Math.max(...cellHeights, baseRowHeight);

      // Add new page if necessary
      if (y + rowHeight > doc.page.height - doc.options.margin) {
        doc.addPage();
        y = doc.y;
      }

      printableFields.forEach((field, index) => {
        let value = "";

        if (field.orderId === "slNo") {
          value = orderIndex + 1;
        } else if (field.orderId === "salesPersonIds") {
          value = order.salesPersonIds
            .map((sp) => sp.salesPersId?.salesPersonName.toUpperCase() || "N/A")
            .join(", ");
        } else if (field.orderId === "customerIds") {
          value = order.customerIds
            .map((c) => c.custId?.customerName.toUpperCase() || "N/A")
            .join(", ");
        } else {
          const fieldValue = order[field.orderId];
          value =
            fieldValue instanceof Date
              ? fieldValue.toISOString().split("T")[0]
              : fieldValue ?? "";
        }

        // Border
        doc
          .rect(index * colWidth + doc.options.margin, y, colWidth, rowHeight)
          .stroke();

        // Colored text
        if (field.orderId === "salesPersonIds") {
          doc.fillColor("green");
        } else if (field.orderId === "customerIds") {
          doc.fillColor("blue");
        } else {
          doc.fillColor("black");
        }

        doc
          .font("Helvetica")
          .fontSize(10)
          .text(
            String(value),
            index * colWidth + doc.options.margin + 5,
            y + 5,
            {
              width: colWidth - 10,
              align: "left",
            }
          );
      });

      y += rowHeight;
    });

    doc.end();

    stream.on("finish", () => {
      res.setHeader("Content-Disposition", 'inline; filename="report.pdf"');
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).json({ message: "Failed to download PDF" });
        }
        fs.unlinkSync(filePath);
      });
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default reportCtlr;
