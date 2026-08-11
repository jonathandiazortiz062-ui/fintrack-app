import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

function Dashboard() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((response) => response.json())
      .then((data) => {
        setApiStatus(data.message);
      })
      .catch((error) => {
        console.error("Error connecting to API:", error);
        setApiStatus("Unable to connect to API");
      });
  }, []);

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

              <Typography variant="h5">$0.00</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Income</Typography>

              <Typography variant="h5">$0.00</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Expenses</Typography>

              <Typography variant="h5">$0.00</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Investments</Typography>

              <Typography variant="h5">$0.00</Typography>
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
