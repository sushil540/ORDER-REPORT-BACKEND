import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";

const generateCsvReport = (orders, fields) => {
  const fileName = `Order_Report_${Date.now()}.csv`;
  const filePath = path.resolve("reports", fileName);
  const printableFields = [{ orderId: "slNo", orderField: "Sl No" }, ...fields];

  const header = printableFields.map((field) => field.orderField || field.orderId);
  const records = orders.map((order, index) => {
    return printableFields.map((field) => {
      if (field.orderId === "slNo") return index + 1;
      else if (field.orderId === "salesPersonIds") return order.salesPersonIds.salesPersId?.salesPersonName.toUpperCase() || "N/A";
      else if (field.orderId === "customerIds") return order.customerIds.custId?.customerName.toUpperCase() || "N/A"
      else {
        const value = order[field.orderId];
        return value instanceof Date ? value.toISOString().split("T")[0] : value ?? "";
      }
    });
  });

  const csv = stringify([header, ...records]);
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(filePath, csv);

  return filePath;
};

export default generateCsvReport;
