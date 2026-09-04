import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //Validations:
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create account");
      }

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
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
              mb: 3,
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
            Create Your Account
          </Typography>

          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Start building a clearer picture of your finances.
          </Typography>

          {/* Name fields */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: { xs: 0, sm: 2 },
            }}
          >
            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(formErrors.firstName)}
              helperText={formErrors.firstName}
            />

            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(formErrors.lastName)}
              helperText={formErrors.lastName}
            />
          </Box>

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

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={Boolean(formErrors.confirmPassword)}
            helperText={formErrors.confirmPassword}
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
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <Typography align="center" color="text.secondary" sx={{ mt: 3 }}>
            Already have an account?{" "}
            <Box
              component="span"
              onClick={() => navigate("/login")}
              sx={{
                color: "primary.main",
                fontWeight: 700,
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Log In
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

export default Register;
