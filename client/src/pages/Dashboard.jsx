import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography
} from '@mui/material';

function Dashboard() {
  return (
    <Box>

      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Overview of your finances
      </Typography>

      <Grid container spacing={3}>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Balance
              </Typography>

              <Typography variant="h5">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Income
              </Typography>

              <Typography variant="h5">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Expenses
              </Typography>

              <Typography variant="h5">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Investments
              </Typography>

              <Typography variant="h5">
                $0.00
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

    </Box>
  );
}

export default Dashboard;