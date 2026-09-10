import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

//Helpers
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const [year, month] = label.split("-");

  const formattedMonth = new Date(
    Number(year),
    Number(month) - 1,
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        minWidth: 170,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        {formattedMonth}
      </Typography>

      {payload.map((entry) => (
        <Box
          key={entry.dataKey}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 3,
            mb: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {entry.dataKey === "income" ? "Income" : "Expenses"}
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            ${Number(entry.value).toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}

function getDateRange(preset, customStartDate, customEndDate) {
  const today = new Date();

  const formatDate = (date) => date.toISOString().split("T")[0];

  if (preset === "custom") {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }

  let startDate;

  if (preset === "last3") {
    startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  }

  if (preset === "last6") {
    startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  }

  if (preset === "last12") {
    startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  }

  if (preset === "thisYear") {
    startDate = new Date(today.getFullYear(), 0, 1);
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(today),
  };
}

function CategoryTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        minWidth: 170,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          mb: 1,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Expenses
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          ${Number(payload[0].value).toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
}

function BudgetTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        minWidth: 180,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        {label}
      </Typography>

      {payload.map((entry) => (
        <Box
          key={entry.dataKey}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 3,
            mb: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {entry.dataKey === "budget" ? "Budget" : "Actual"}
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            ${Number(entry.value).toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}

function Analytics() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = useTheme();
  const [rangePreset, setRangePreset] = useState("last6");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [categoryData, setCategoryData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const { startDate, endDate } = getDateRange(
          rangePreset,
          customStartDate,
          customEndDate,
        );

        if (rangePreset === "custom" && (!startDate || !endDate)) {
          setMonthlyData([]);
          setCategoryData([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();

        if (startDate) {
          params.append("startDate", startDate);
        }

        if (endDate) {
          params.append("endDate", endDate);
        }

        const response = await apiFetch(
          `/api/analytics/monthly-income-expenses?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Unable to load analytics");
        }

        const categoryResponse = await apiFetch(
          `/api/analytics/expenses-by-category?${params.toString()}`,
        );

        if (!categoryResponse.ok) {
          throw new Error("Unable to load category analytics");
        }

        const budgetResponse = await apiFetch("/api/budgets");

        if (!budgetResponse.ok) {
          throw new Error("Unable to load budget analytics");
        }

        const budgets = await budgetResponse.json();

        setBudgetData(
          budgets.map((budget) => ({
            category: budget.category_name,
            budget: Number(budget.monthly_limit),
            actual: Number(budget.amount_spent),
          })),
        );

        const data = await response.json();
        const categoryAnalytics = await categoryResponse.json();

        setMonthlyData(data);
        setCategoryData(categoryAnalytics);
      } catch (error) {
        console.error("Analytics error:", error);
        setError("Unable to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [rangePreset, customStartDate, customEndDate]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Analytics
        </Typography>

        <Typography color="text.secondary">
          Compare your income, expenses, categories, and budgets over time.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
          alignItems: "center",
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 180,
          }}
        >
          <InputLabel>Time Range</InputLabel>

          <Select
            value={rangePreset}
            label="Time Range"
            onChange={(event) => {
              setRangePreset(event.target.value);
            }}
          >
            <MenuItem value="last3">Last 3 months</MenuItem>
            <MenuItem value="last6">Last 6 months</MenuItem>
            <MenuItem value="thisYear">This year</MenuItem>
            <MenuItem value="last12">Last 12 months</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>

        {rangePreset === "custom" && (
          <>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                minWidth: 210,
              }}
            />

            <TextField
              size="small"
              type="date"
              label="End Date"
              value={customEndDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                minWidth: 210,
              }}
            />
          </>
        )}
      </Box>

      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Expenses vs Income
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Monthly comparison of money coming in and going out.
          </Typography>

          {loading && (
            <Typography color="text.secondary">Loading analytics...</Typography>
          )}

          {error && <Typography color="error">{error}</Typography>}

          {!loading && !error && monthlyData.length === 0 && (
            <Typography color="text.secondary">
              Select a start and end date to view custom analytics.
            </Typography>
          )}

          {!loading && !error && monthlyData.length > 0 && (
            <Box
              sx={{
                width: "100%",
                height: { xs: 300, sm: 360, md: 400 },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  barGap={8}
                  barCategoryGap="35%"
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke={theme.palette.divider}
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                    tickMargin={12}
                    tickFormatter={(value) => {
                      const [year, month] = value.split("-");

                      return new Date(
                        Number(year),
                        Number(month) - 1,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      });
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                    tickMargin={10}
                    width={70}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString()}`
                    }
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: theme.palette.action.hover,
                    }}
                  />

                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{
                      paddingTop: "18px",
                      fontFamily: "inherit",
                      fontSize: "14px",
                    }}
                  />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill={theme.palette.success.main}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={70}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill={theme.palette.error.main}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={70}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          mt: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Expenses by Category
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            See which categories account for the most spending.
          </Typography>

          {!loading && !error && categoryData.length === 0 && (
            <Typography color="text.secondary">
              No expense data available for this period.
            </Typography>
          )}

          {!loading && !error && categoryData.length > 0 && (
            <Box
              sx={{
                width: "100%",
                height: Math.max(300, categoryData.length * 60),
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={false}
                    stroke={theme.palette.divider}
                  />

                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString()}`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  />

                  <Tooltip
                    content={<CategoryTooltip />}
                    cursor={{
                      fill: theme.palette.action.hover,
                    }}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill={theme.palette.error.main}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          mt: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 0.5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              Current Budget vs Actual
            </Typography>

            <Chip
              label="Current month only"
              size="small"
              variant="outlined"
              color="primary"
              sx={{
                fontWeight: 600,
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Compare this month's spending with your current monthly budget
            limits. This chart is not affected by the time range selected above.
          </Typography>

          {!loading && !error && budgetData.length === 0 && (
            <Typography color="text.secondary">
              No budget data available.
            </Typography>
          )}

          {!loading && !error && budgetData.length > 0 && (
            <Box
              sx={{
                width: "100%",
                height: Math.max(300, budgetData.length * 70),
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetData}
                  layout="vertical"
                  barGap={8}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={false}
                    stroke={theme.palette.divider}
                  />

                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString()}`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  />

                  <Tooltip
                    content={<BudgetTooltip />}
                    cursor={{
                      fill: theme.palette.action.hover,
                    }}
                  />

                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{
                      paddingTop: "18px",
                      fontFamily: "inherit",
                      fontSize: "14px",
                    }}
                  />

                  <Bar
                    dataKey="budget"
                    name="Budget"
                    fill={theme.palette.grey[400]}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={30}
                  />

                  <Bar
                    dataKey="actual"
                    name="Actual"
                    fill={theme.palette.error.main}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Analytics;
