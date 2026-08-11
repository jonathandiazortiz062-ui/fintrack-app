import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography
} from '@mui/material';

function Register() {
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
            Create Account
          </Typography>

          <TextField
            label="First Name"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
          />

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

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            Register
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;