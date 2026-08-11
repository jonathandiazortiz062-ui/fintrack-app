import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography
} from '@mui/material';

function Login() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10 }}>
        <Paper sx={{ p: 4 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
          >
            FinTrack
          </Typography>

          <Typography
            variant="h6"
            align="center"
            gutterBottom
          >
            Login
          </Typography>

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;