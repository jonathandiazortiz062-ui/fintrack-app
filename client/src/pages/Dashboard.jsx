import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

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
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Overview of your finances
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Balance</Typography>

              <Typography variant="h5">
                ${Number(summary.totalBalance).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">{currentMonth} Income</Typography>

              <Typography variant="h5">
                ${Number(summary.monthlyIncome).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">{currentMonth} Expenses</Typography>

              <Typography variant="h5">
                ${Number(summary.monthlyExpenses).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Investments</Typography>

              <Typography variant="h5">
                ${Number(summary.totalInvestmentValue).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {recentTransactions.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recent Transactions
          </Typography>

          {recentTransactions.map((transaction) => (
            <Card key={transaction.id} sx={{ mb: 1 }}>
              <CardContent>
                <Typography variant="h6">{transaction.description}</Typography>

                <Typography color="text.secondary">
                  {transaction.account_name}
                  {" • "}
                  {transaction.category_name || "Uncategorized"}
                </Typography>
                <Typography
                  color={
                    transaction.transaction_type === "income"
                      ? "success"
                      : "error"
                  }
                >
                  {transaction.transaction_type === "income" ? "+" : "-"}$
                  {Number(transaction.amount).toFixed(2)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary">
          No recent transactions to display.
        </Typography>
      )}
    </Box>
  );
}

export default Dashboard;
