import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validations:
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
    };

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormErrors({
      email: "",
      password: "",
    });
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to log in");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 6,
        backgroundImage: `
        linear-gradient(
          rgba(255,255,255,0.68),
          rgba(255,255,255,0.68)
        ),
        url("/fintrack-hero-bg.png")
      `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: 1,
            borderColor: "divider",
            backgroundColor: "rgba(255,255,255,0.96)",
          }}
        >
          {/* FinTrack branding */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.6rem",
                mb: 1.5,
              }}
            >
              F
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
              }}
            >
              FinTrack
            </Typography>
          </Box>

          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Welcome Back
          </Typography>

          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to continue managing your finances.
          </Typography>

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.email)}
            helperText={formErrors.email}
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.password)}
            helperText={formErrors.password}
          />

          {error && (
            <Typography
              color="error"
              sx={{
                mt: 1,
                textAlign: "center",
              }}
            >
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 3,
              py: 1.3,
              textTransform: "none",
              fontWeight: 700,
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>

          <Typography align="center" color="text.secondary" sx={{ mt: 3 }}>
            Don't have an account?{" "}
            <Box
              component="span"
              onClick={() => navigate("/register")}
              sx={{
                color: "primary.main",
                fontWeight: 700,
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Create Account
            </Box>
          </Typography>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate("/")}
            sx={{
              mt: 1,
              textTransform: "none",
            }}
          >
            Back to Home
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
