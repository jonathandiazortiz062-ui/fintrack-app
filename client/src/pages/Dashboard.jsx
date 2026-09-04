import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import {
  AccountBalanceWallet,
  ArrowDownward,
  ArrowUpward,
  ReceiptLong,
  TrendingUp,
} from "@mui/icons-material";

function Dashboard() {
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalInvestmentValue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
  });
  const summaryCardStyles = {
    height: "100%",
    borderRadius: 3,
    border: 1,
    borderColor: "divider",
    boxShadow: 1,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",

    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: 4,
    },
  };

  const iconBoxStyles = {
    width: 44,
    height: 44,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiFetch("/api/dashboard/summary");

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard summary");
        }

        const data = await response.json();

        setSummary(data);
      } catch (error) {
        console.error("Error loading dashboard summary:", error);
        setError("Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentTransactions = async () => {
      try {
        const response = await apiFetch("/api/transactions");

        if (!response.ok) {
          throw new Error("Failed to fetch recent transactions");
        }

        const data = await response.json();

        setRecentTransactions(data.slice(0, 5)); // Get the 5 most recent transactions
      } catch (error) {
        console.error("Error loading recent transactions:", error);
        setError("Unable to load recent transactions");
      }
    };

    fetchRecentTransactions();
    fetchSummary();
  }, []);

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 0.5,
        }}
      >
        Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your financial overview at a glance.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={summaryCardStyles}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    ...iconBoxStyles,
                    backgroundColor: "primary.50",
                    color: "primary.main",
                  }}
                >
                  <AccountBalanceWallet />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Total Balance
                </Typography>
              </Box>
              {summary.totalBalance < 0 ? (
                <Typography
                  variant="h5"
                  sx={{
                    color: "error.main",
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  ${Number(summary.totalBalance).toFixed(2)}
                </Typography>
              ) : (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    color: "success.main",
                  }}
                >
                  ${Number(summary.totalBalance).toFixed(2)}
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                Across all accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={summaryCardStyles}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    ...iconBoxStyles,
                    backgroundColor: "success.50",
                    color: "success.main",
                  }}
                >
                  <ArrowUpward />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  {currentMonth} Income
                </Typography>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  color: "success.main",
                }}
              >
                ${Number(summary.monthlyIncome).toFixed(2)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Income this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={summaryCardStyles}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    ...iconBoxStyles,
                    backgroundColor: "error.50",
                    color: "error.main",
                  }}
                >
                  <ArrowDownward />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  {currentMonth} Expenses
                </Typography>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  color: "error.main",
                }}
              >
                ${Number(summary.monthlyExpenses).toFixed(2)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Expenses this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={summaryCardStyles}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    ...iconBoxStyles,
                    backgroundColor: "primary.50",
                    color: "primary.main",
                  }}
                >
                  <TrendingUp />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Total Investments
                </Typography>
              </Box>
              {summary.totalInvestmentValue < 0 ? (
                <Typography
                  variant="h5"
                  sx={{
                    color: "error.main",
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  ${Number(summary.totalInvestmentValue).toFixed(2)}
                </Typography>
              ) : (
                <Typography
                  variant="h5"
                  sx={{
                    color: "success.main",
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  ${Number(summary.totalInvestmentValue).toFixed(2)}
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                Current portfolio value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Recent Transactions
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your latest financial activity.
        </Typography>

        <Card
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            boxShadow: 1,
          }}
        >
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <Box
                key={transaction.id}
                sx={{
                  display: "flex",
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  justifyContent: "space-between",
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  gap: 2,
                  px: 3,
                  py: 2.5,

                  borderBottom: index !== recentTransactions.length - 1 ? 1 : 0,

                  borderColor: "divider",

                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                {/* Transaction information */}
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    {transaction.description}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {transaction.account_name}
                    {" • "}
                    {transaction.category_name || "Uncategorized"}
                  </Typography>
                </Box>

                {/* Amount and date */}
                <Box
                  sx={{
                    textAlign: {
                      xs: "left",
                      sm: "right",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                    }}
                    color={
                      transaction.transaction_type === "income"
                        ? "success.main"
                        : "error.main"
                    }
                  >
                    {transaction.transaction_type === "income" ? "+" : "-"}$
                    {Number(transaction.amount).toFixed(2)}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {new Date(
                      transaction.transaction_date,
                    ).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                py: 6,
                px: 3,
                textAlign: "center",
              }}
            >
              <ReceiptLong
                sx={{
                  fontSize: 42,
                  color: "text.disabled",
                  mb: 1,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                No recent transactions
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Your latest transactions will appear here.
              </Typography>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}

export default Dashboard;
