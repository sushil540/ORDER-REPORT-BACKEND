import Order from"../models/Order.js";
import Customer from "../models/Customer.js";

export const getOrdersSummary = async (from, to, fields = [], timeGranularity = "monthly") => {
  const today = new Date();
  const fromDate = from ? new Date(from) : new Date(today.setHours(0, 0, 0, 0));
  const toDate = to ? new Date(to) : new Date(today.setHours(23, 59, 59, 999));

  const matchStage = {
    orderDate: {
      $gte: fromDate,
      $lte: toDate
    }
  };

  const getProjectionStage = (groupIdExpr) => ({
    $project: {
      period: groupIdExpr,
      count: 1,
      totalAmount: 1,
      avgAmount: {
        $cond: [
          { $eq: ["$count", 0] },
          0,
          { $divide: ["$totalAmount", "$count"] }
        ]
      },
      _id: 0
    }
  });

  const formatPeriod = {
    monthly: {
      groupId: {
        year: { $year: "$orderDate" },
        month: { $month: "$orderDate" }
      },
      projectionExpr: {
        $concat: [
          { $arrayElemAt: [
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            { $subtract: ["$_id.month", 1] }
          ]},
          " ",
          { $toString: "$_id.year" }
        ]
      }
    },
    yearly: {
      groupId: { year: { $year: "$orderDate" } },
      projectionExpr: { $toString: "$_id.year" }
    },
    quarterly: {
      groupId: {
        year: { $year: "$orderDate" },
        quarter: { $ceil: { $divide: [{ $month: "$orderDate" }, 3] } }
      },
      projectionExpr: {
        $concat: [
          "Q",
          { $toString: "$_id.quarter" },
          " ",
          { $toString: "$_id.year" }
        ]
      }
    }
  };

  if (timeGranularity === "totalOrders") {
    const orders = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$orderAmount" }
        }
      },
      {
        $project: {
          period: "Total",
          count: 1,
          totalAmount: 1,
          avgAmount: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $divide: ["$totalAmount", "$count"] }
            ]
          },
          _id: 0
        }
      }
    ]);

    const updatedFields = [
      { orderId: "period", orderField: "Period" },
      { orderId: "count", orderField: "Order Count" },
      { orderId: "totalAmount", orderField: "Total Amount" },
      { orderId: "avgAmount", orderField: "Average Order Amount" }
    ];

    return { reportData: orders, updatedFields };
  }

  const timeSettings = formatPeriod[timeGranularity];
  if (!timeSettings) return { reportData: [], updatedFields: [] };

  const reportData = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: timeSettings.groupId,
        count: { $sum: 1 },
        totalAmount: { $sum: "$orderAmount" }
      }
    },
    getProjectionStage(timeSettings.projectionExpr),
    { $sort: { period: 1 } }
  ]);

  const updatedFields = [
    { orderId: "period", orderField: "Period" },
    { orderId: "count", orderField: "Order Count" },
    { orderId: "totalAmount", orderField: "Total Amount" },
    { orderId: "avgAmount", orderField: "Average Order Amount" }
  ];

  if (fields?.length) {
    for (const field of fields) {
      if (!updatedFields.some(f => f.orderId === field)) {
        updatedFields.push({ orderId: field, orderField: field });
      }
    }
  }

  console.log(reportData)

  return { reportData, updatedFields };
};

export const getSalesBySalesperson = async (from, to, fields = [], timeGranularity = "monthly") => {
  const now = new Date();

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const fromDate = from ? new Date(from) : startOfYear;
  const toDate = to ? new Date(to) : endOfYear;

  const matchQuery = {
    orderDate: { $gte: fromDate, $lte: toDate }
  };

  let groupBy = {};
  let projectStage = {
    salesPersonName: "$_id.salesPerson",
    totalSales: 1,
    orderCount: 1,
    _id: 0,
  };

  let sortStage = { year: 1 };

  if (timeGranularity === "monthly") {
    groupBy = {
      year: { $year: "$orderDate" },
      month: { $month: "$orderDate" },
    };
    projectStage.year = "$_id.year";
    projectStage.month = "$_id.month";
    projectStage.monthName = {
      $let: {
        vars: {
          months: [
            "", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
          ]
        },
        in: { $arrayElemAt: ["$$months", "$_id.month"] }
      }
    };
    sortStage.month = 1;

  } else if (timeGranularity === "weekly") {
    groupBy = {
      year: { $year: "$orderDate" },
      week: { $isoWeek: "$orderDate" },
    };
    projectStage.year = "$_id.year";
    projectStage.week = "$_id.week";
    sortStage.week = 1;

  } else if (timeGranularity === "quarterly") {
    groupBy = {
      year: { $year: "$orderDate" },
      quarter: {
        $ceil: { $divide: [{ $month: "$orderDate" }, 3] }
      }
    };
    projectStage.year = "$_id.year";
    projectStage.quarter = {
      $switch: {
        branches: [
          {
            case: { $eq: ["$_id.quarter", 1] },
            then: "Q1 (Jan–Mar)"
          },
          {
            case: { $eq: ["$_id.quarter", 2] },
            then: "Q2 (Apr–Jun)"
          },
          {
            case: { $eq: ["$_id.quarter", 3] },
            then: "Q3 (Jul–Sep)"
          },
          {
            case: { $eq: ["$_id.quarter", 4] },
            then: "Q4 (Oct–Dec)"
          }
        ],
        default: "Unknown"
      }
    };
    sortStage.quarter = 1;

  } else if (timeGranularity === "yearly") {
    groupBy = {
      year: { $year: "$orderDate" },
    };
    projectStage.year = "$_id.year";
  }

  const reportData = await Order.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: "salespeople",
        localField: "salesPersonIds.salesPersId",
        foreignField: "_id",
        as: "salesPersonInfo",
      },
    },
    { $unwind: "$salesPersonInfo" },
    {
      $group: {
        _id: {
          ...groupBy,
          salesPerson: "$salesPersonInfo.salesPersonName",
        },
        orderCount: { $sum: 1 },
        maxOrderAmount: { $max: "$orderAmount" },
        minOrderAmount: { $min: "$orderAmount" },
        avgOrderAmount: { $avg: "$orderAmount" },
      },
    },
    { $project: projectStage },
    { $sort: sortStage },
  ]);

  // Calculate the detailed summary (max, min, avg for orders and amounts)
  const detailedSummary = {
    maxOrders: Math.max(...reportData.map(data => data.orderCount)),
    minOrders: Math.min(...reportData.map(data => data.orderCount)),
    avgOrders: reportData.reduce((sum, data) => sum + data.orderCount, 0) / reportData.length
  };

  // Build the UI fields dynamically based on time granularity
  const updatedFields = [
    { orderId: "salesPersonName", orderField: "Salesperson" },
    { orderId: "orderCount", orderField: "Order Count" },
  ];
  
  if (["monthly", "weekly", "quarterly", "yearly"].includes(timeGranularity)) {
    updatedFields.push({ orderId: "year", orderField: "Year" });
  }

  if (timeGranularity === "monthly") {
    updatedFields.push({ orderId: "monthName", orderField: "Month" });
  } else if (timeGranularity === "weekly") {
    updatedFields.push({ orderId: "week", orderField: "Week" });
  } else if (timeGranularity === "quarterly") {
    updatedFields.push({ orderId: "quarter", orderField: "Quarter" });
  }

  return { reportData, updatedFields, detailedSummary };
};

export const getSalesSummary = async (from, to, fields = [], timeGranularity = "monthly") => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const fromDate = from ? new Date(from) : startOfYear;
  const toDate = to ? new Date(to) : endOfYear;

  // Set grouping dynamically based on timeGranularity
  let groupBy = { year: { $year: "$orderDate" } };
  let projectStage = {
    year: "$_id.year",
    totalSales: 1,
    orderCount: 1,
    _id: 0,
  };
  let sortStage = { year: 1 };

  if (timeGranularity === "monthly") {
    groupBy.month = { $month: "$orderDate" };
    projectStage.month = "$_id.month";
    projectStage.monthName = {
      $let: {
        vars: {
          months: [
            "", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
          ]
        },
        in: { $arrayElemAt: ["$$months", "$_id.month"] }
      }
    };
    sortStage.month = 1;
  } else if (timeGranularity === "weekly") {
    groupBy.week = { $isoWeek: "$orderDate" };
    projectStage.week = "$_id.week";
    sortStage.week = 1;
  } else if (timeGranularity === "quarterly") {
    groupBy.quarter = {
      $ceil: { $divide: [{ $month: "$orderDate" }, 3] }
    };
    projectStage.quarter = {
      $switch: {
        branches: [
          {
            case: { $eq: ["$_id.quarter", 1] },
            then: "Q1 (Jan–Mar)"
          },
          {
            case: { $eq: ["$_id.quarter", 2] },
            then: "Q2 (Apr–Jun)"
          },
          {
            case: { $eq: ["$_id.quarter", 3] },
            then: "Q3 (Jul–Sep)"
          },
          {
            case: { $eq: ["$_id.quarter", 4] },
            then: "Q4 (Oct–Dec)"
          }
        ],
        default: "Unknown"
      }
    };
    sortStage.quarter = 1;
  }

  const reportData = await Order.aggregate([
    { $match: { orderDate: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: groupBy, totalSales: { $sum: "$orderAmount" }, orderCount: { $sum: 1 } } },
    { $project: projectStage },
    { $sort: sortStage },
  ]);

  // Define fields dynamically based on granularity
  const updatedFields = [
    ...(projectStage.monthName ? [{ orderId: "monthName", orderField: "Month" }] :
        projectStage.month ? [{ orderId: "month", orderField: "Month" }] : []),
    ...(projectStage.week ? [{ orderId: "week", orderField: "Week" }] : []),
    ...(projectStage.quarter ? [{ orderId: "quarter", orderField: "Quarter" }] : []),
    { orderId: "year", orderField: "Year" },
    { orderId: "orderCount", orderField: "Orders" },
  ];

  return { reportData, updatedFields };
};

export const getTopCustomers = async (from, to, fields = [], timeGranularity = "monthly") => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const fromDate = from ? new Date(from) : startOfYear;
  const toDate = to ? new Date(to) : endOfYear;

  const dateProjection = {};

  switch (timeGranularity) {
    case "weekly":
      dateProjection.year = { $year: "$orderDate" };
      dateProjection.week = { $isoWeek: "$orderDate" };
      break;
    case "monthly":
      dateProjection.year = { $year: "$orderDate" };
      dateProjection.month = { $month: "$orderDate" };
      break;
    case "quarterly":
      dateProjection.year = { $year: "$orderDate" };
      dateProjection.quarter = {
        $ceil: { $divide: [{ $month: "$orderDate" }, 3] }
      };
      break;
    case "yearly":
      dateProjection.year = { $year: "$orderDate" };
      break;
    default:
      break;
  }

  const reportData = await Order.aggregate([
    {
      $match: {
        orderDate: { $gte: fromDate, $lte: toDate }
      }
    },
    {
      $lookup: {
        from: "customers",
        localField: "customerIds.custId",
        foreignField: "_id",
        as: "customerInfo"
      }
    },
    { $unwind: "$customerInfo" },
    {
      $addFields: {
        ...dateProjection
      }
    },
    {
      $group: {
        _id: {
          customerName: "$customerInfo.customerName",
          customerCity: "$customerInfo.city",
          ...Object.keys(dateProjection).reduce((acc, key) => {
            acc[key] = `$${key}`;
            return acc;
          }, {})
        },
        totalSpent: { $sum: "$orderAmount" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $project: {
        customerName: "$_id.customerName",
        customerCity: "$_id.customerCity",
        totalSpent: 1,
        orderCount: 1,
        period: {
          $switch: {
            branches: [
              {
                case: { $eq: [timeGranularity, "monthly"] },
                then: {
                  $concat: [
                    { $toString: "$_id.year" },
                    "-",
                    {
                      $arrayElemAt: [
                        [
                          "", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                          "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
                        ],
                        "$_id.month"
                      ]
                    }
                  ]
                }
              },
              {
                case: { $eq: [timeGranularity, "quarterly"] },
                then: {
                  $concat: [
                    { $toString: "$_id.year" },
                    "-Q",
                    { $toString: "$_id.quarter" }
                  ]
                }
              },
              {
                case: { $eq: [timeGranularity, "weekly"] },
                then: {
                  $concat: [
                    { $toString: "$_id.year" },
                    "-W",
                    { $toString: "$_id.week" }
                  ]
                }
              }
            ],
            default: { $toString: "$_id.year" }
          }
        },
        _id: 0
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);

  const updatedFields = [
    { orderId: "period", orderField: "Period" },
    { orderId: "customerName", orderField: "Customer" },
    { orderId: "customerCity", orderField: "City" },
    { orderId: "orderCount", orderField: "Order Count" },
    { orderId: "totalSpent", orderField: "Total Spent" }
  ];

  return { reportData, updatedFields };
};

