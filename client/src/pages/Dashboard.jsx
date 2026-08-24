import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

function Dashboard() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalInvestmentValue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/dashboard/summary`, { credentials: "include" }
        );

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
              <Typography color="text.secondary">Balance</Typography>

              <Typography variant="h5">
                ${Number(summary.totalBalance).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Income</Typography>

              <Typography variant="h5">
                ${Number(summary.monthlyIncome).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Expenses</Typography>

              <Typography variant="h5">
                ${Number(summary.monthlyExpenses).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Investments</Typography>

              <Typography variant="h5">
                ${Number(summary.totalInvestmentValue).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        Recent Transactions
      </Typography>

      <Typography color="text.secondary">
        No recent transactions to display.
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        API Status: {apiStatus}
      </Typography>
    </Box>
  );
}

export default Dashboard;
