import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import formatDateToDDMMYYYY from "./dateFormat.js";
import { fileURLToPath } from 'url';
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import ChartDataLabels from "chartjs-plugin-datalabels"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatePieChart = async (orders) => {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 800,
    height: 600,
    plugins: [ChartDataLabels],
  });

  // Prepare the data for the pie chart, aggregating by month
  const salesData = {};

  orders.forEach((order) => {
    // We're aggregating by month (or other field such as year or quarter if needed)
    const label = order.monthName || `Year ${order.year}`; // Fallback to year if month is unavailable
    const sales = order.orderCount;

    if (label) {
      salesData[label] = (salesData[label] || 0) + sales;
    }
  });

  // Ensure that there's data to plot
  if (Object.keys(salesData).length === 0) {
    console.log('No data available for the pie chart.');
    return;
  }

  const chartData = {
    type: 'pie',
    data: {
      labels: Object.keys(salesData),  // X-axis labels (Period-based, e.g., months)
      datasets: [
        {
          data: Object.values(salesData),  // Y-axis values (Sales count)
          backgroundColor: [
            '#FF5733',
            '#33FF57',
            '#3357FF',
            '#F333FF',
            '#FF33A5',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return (
                tooltipItem.label +
                ': ' +
                tooltipItem.raw.toFixed(2)
              );
            },
          },
        },
        datalabels: {
          color: '#fff', // Text color
          font: {
            weight: 'bold', // Make label text bold
            size: 18, // Make font size larger
          },
          formatter: (value, context) => {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0); // Calculate total
            const percentage = (value / total) * 100; // Calculate percentage
            return `${value} (${percentage.toFixed(2)}%)`; // Display value and percentage
          },
          anchor: 'end', // Positioning of labels 
          align: 'start',
        },
      },
    },
  };
    // Generate the pie chart and save to buffer
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(chartData);

    // Save image to path
    const imagePath = path.join(__dirname, '..', 'assests', 'pie-chart.png');
    fs.writeFileSync(imagePath, imageBuffer);
  
    return imagePath;
}

// Helper function to generate labels based on available period field in the order
const generateLabel = (order) => {
  if (order.week) {
    return `${order.year} - Week ${order.week}`;
  } else if (order.month) {
    return `${order.year} - ${order.monthName}`;  // Use monthName for month field
  } else if (order.quarter) {
    return `${order.year} - ${order.quarter}`;
  } else if (order.year) {
    return `${order.year}`;
  }
  return '';  // Default fallback if no known period field is found
};


// Helper Function to Generate Line Chart (Monthly Sales Summary)
const generateLineChart = async (orders) => {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });

  // Prepare data for the line chart based on the available period field
  const salesData = {};

  // Process orders and aggregate sales based on the available period field
  orders.forEach(order => {
    const label = generateLabel(order);  // Get the label based on the available period field
    salesData[label] = (salesData[label] || 0) + order.orderCount;
  });

  const chartData = {
    type: 'line',
    data: {
      labels: Object.keys(salesData),  // X-axis labels (Period-based)
      datasets: [{
        label: 'Sales',
        data: Object.values(salesData),  // Y-axis values (Sales count)
        borderColor: '#33FF57',
        fill: true,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.label + ': ' + tooltipItem.raw.toFixed(2);  // Display sales amount
            },
          },
        },
      },
    },
  };

  // Generate the line chart and return as image
  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(chartData);
  const imagePath = path.join(__dirname, '..', 'assests', 'line-chart.png');
  fs.writeFileSync(imagePath, imageBuffer);

  return imagePath;
};

const generatePdf = async (orders, fields, from, to, timeGranularity, reportType, detailedSummary) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const fileName = `Order_Report_${Date.now()}.pdf`;
      const filePath = path.resolve("reports", fileName);

      fs.mkdirSync("reports", { recursive: true });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const reportTitleMap = {
        order_summary: "Order Summary Report",
        sales_by_salesperson: "Sales Report (Salesperson)",
        sales_summary: "Sales Summary",
        top_customers: "Top Customers",
      };

      const headerTitle = reportTitleMap[reportType] || "Order Report";

      doc.fontSize(18).text(headerTitle, {
        align: "center",
        underline: true,
      });
      doc.moveDown();

      const granularityTitleMap = {
        week: "Weekly Report",
        month: "Monthly Report",
        quarter: "Quarterly Report",
        year: "Yearly Report"
      };

      const reportSubtitle = granularityTitleMap[timeGranularity] || "Custom Report";

      doc.fontSize(14).fillColor("gray").text(reportSubtitle, {
        align: "center",
      });
      doc.moveDown();

      doc.fontSize(10).fillColor("black");
      const today = new Date();
      doc.text(`Generated Date: ${formatDateToDDMMYYYY(today)}`, doc.options.margin, 70, { align: "right" });

      if (from && to) {
        doc.text(`From: ${formatDateToDDMMYYYY(from)}`, doc.options.margin, 85);
        doc.text(`To: ${formatDateToDDMMYYYY(to)}`, doc.options.margin, 100);
      }
      doc.moveDown(3);

      const printableFields = [{ orderId: "slNo", orderField: "Sl No" }, ...fields];
      const pageWidth = doc.page.width - doc.options.margin * 2;
      const colWidth = pageWidth / printableFields.length;
      const baseRowHeight = 30;
      let y = doc.y;

      // Table Header
      printableFields.forEach((field, i) => {
        const label = field.orderField || field.orderId;
        doc.rect(i * colWidth + doc.options.margin, y, colWidth, baseRowHeight).stroke();
        doc.font("Helvetica-Bold").fontSize(10).text(label, i * colWidth + doc.options.margin + 5, y + 7, {
          width: colWidth - 10,
          align: "center",
        });
      });
      y += baseRowHeight;

      let totalOrderAmount = 0;
      let customerCount = 0;
      let salesPersonCount = 0;

      orders.forEach((order, index) => {
        const rowHeight = Math.max(
          ...printableFields.map((field) => {
            let value = "";
            if (field.orderId === "slNo") value = index + 1;
            else if (field.orderId === "salesPersonIds") {
              const name = order.salesPersonIds?.salesPersId?.salesPersonName;
              if (name) salesPersonCount++;
              value = name?.toUpperCase() || "N/A";
            } else if (field.orderId === "customerIds") {
              const name = order.customerIds?.custId?.customerName;
              if (name) customerCount++;
              value = name?.toUpperCase() || "N/A";
            } else {
              const fieldValue = order[field.orderId];
              value = fieldValue instanceof Date ? fieldValue.toISOString().split("T")[0] : fieldValue ?? "";
            }
            return doc.heightOfString(String(value), { width: colWidth - 10 });
          }),
          baseRowHeight
        );

        if (y + rowHeight > doc.page.height - doc.options.margin) {
          doc.addPage();
          y = doc.y;
        }

        printableFields.forEach((field, i) => {
          let value = "";
          if (field.orderId === "slNo") value = index + 1;
          else if (field.orderId === "salesPersonIds") value = order.salesPersonIds?.salesPersId?.salesPersonName?.toUpperCase() || "N/A";
          else if (field.orderId === "customerIds") value = order.customerIds?.custId?.customerName?.toUpperCase() || "N/A";
          else {
            const fieldValue = order[field.orderId];
            value = fieldValue instanceof Date ? fieldValue.toISOString().split("T")[0] : fieldValue ?? "";
            if (field.orderId === "orderAmount") {
              const amount = parseFloat(value);
              if (!isNaN(amount)) totalOrderAmount += amount;
            }
          }

          doc.rect(i * colWidth + doc.options.margin, y, colWidth, rowHeight).stroke();
          doc.fillColor(field.orderId === "salesPersonIds" ? "green" : field.orderId === "customerIds" ? "blue" : "black");
          doc.font("Helvetica").fontSize(10).text(String(value), i * colWidth + doc.options.margin + 5, y + 5, {
            width: colWidth - 10,
            align: "left",
          });
        });

        y += rowHeight;
      });

      // Summary row
      const totalRowHeight = baseRowHeight;
      if (y + totalRowHeight > doc.page.height - doc.options.margin) {
        doc.addPage();
        y = doc.y;
      }

      printableFields.forEach((field, i) => {
        doc.rect(i * colWidth + doc.options.margin, y, colWidth, totalRowHeight).stroke();

        if (field.orderId === "orderAmount") {
          doc.font("Helvetica-Bold").fillColor("black").fontSize(10).text(`Total Amount: \u20B9${totalOrderAmount.toFixed(2)}`, i * colWidth + doc.options.margin + 5, y + 7, {
            width: colWidth - 10,
            align: "left",
          });
        } else if (field.orderId === "customerIds") {
          doc.font("Helvetica-Bold").fillColor("black").fontSize(10).text(`Customer Count: ${customerCount}`, i * colWidth + doc.options.margin + 5, y + 7, {
            width: colWidth - 10,
            align: "left",
          });
        } else if (field.orderId === "salesPersonIds") {
          doc.font("Helvetica-Bold").fillColor("black").fontSize(10).text(`Salesperson Count: ${salesPersonCount}`, i * colWidth + doc.options.margin + 5, y + 7, {
            width: colWidth - 10,
            align: "left",
          });
        } else if (i === 0 && reportType.length === 0) {
          doc.font("Helvetica-Bold").fillColor("black").fontSize(10).text("Total", i * colWidth + doc.options.margin + 5, y + 7, {
            width: colWidth - 10,
            align: "left",
          });
        }
      });
      // --- Detailed Summary Section ---
      if (detailedSummary && Object.keys(detailedSummary).length > 0) {
        doc.moveDown(10)
        doc.fontSize(12).fillColor("black").text("Detailed Summary", { align: "center" });
        doc.moveDown();

        // Iterate over the detailedSummary object and create a row for each key-value pair
        for (const [key, value] of Object.entries(detailedSummary)) {
          // Format the key and value to match the structure you're looking for
          doc.fontSize(10).font("Helvetica-Bold").text(`${key.charAt(0).toUpperCase() + key.slice(1)}: `, { continued: true });
          doc.fontSize(10).font("Helvetica").text(value);
          doc.moveDown();
        }
      }

      // Add a heading before the pie chart
      
      if(fields.length !== 0){
      // --- Charts Section ---
      const pieChartPath = await generatePieChart(orders);  // ensure this is async/await or returns synchronously
      doc.addPage()
      .moveDown()
      .fontSize(18).font('Helvetica-Bold').text(`Pie Chart` , { align: 'center' })
      .image(pieChartPath, {
        fit: [500, 400],
        align: 'center',
        valign: 'center'
      });
      fs.unlinkSync(pieChartPath);

      const lineChartPath = await generateLineChart(orders);  // ensure this is async/await or returns synchronously
      doc.addPage()
      .moveDown()
      .fontSize(18).font('Helvetica-Bold').text(`Line Graph` , { align: 'center' })
      .image(lineChartPath, {
        fit: [500, 400],
        align: 'center',
        valign: 'center'
      });
      fs.unlinkSync(lineChartPath);
    }

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

export default generatePdf;
