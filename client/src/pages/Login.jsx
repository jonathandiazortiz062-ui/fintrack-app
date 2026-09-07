import { Box, Button, Container, Paper, Typography } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to authenticate with Google");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was unsuccessful. Please try again.");
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
            135deg,
            rgba(255,255,255,0.82) 0%,
            rgba(245,249,255,0.72) 50%,
            rgba(255,255,255,0.78) 100%
          ),
          url("/fintrack-hero-bg.png")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "rgba(25, 118, 210, 0.12)",
            backgroundColor: "rgba(255,255,255,0.97)",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
            backdropFilter: "blur(8px)",
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
                width: 68,
                height: 68,
                borderRadius: 3,
                background:
                  "linear-gradient(135deg, rgba(25,118,210,0.12), rgba(25,118,210,0.04))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
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
                  boxShadow: "0 8px 20px rgba(25,118,210,0.25)",
                }}
              >
                F
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "primary.main",
                backgroundColor: "rgba(25,118,210,0.08)",
                px: 1.5,
                py: 0.6,
                borderRadius: 999,
                mb: 1.5,
                letterSpacing: "0.04em",
              }}
            >
              SECURE SIGN-IN
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.02em",
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
            Welcome to FinTrack
          </Typography>

          <Box
            sx={{
              mt: 1,
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "rgba(248, 250, 252, 0.9)",
              border: "1px solid",
              borderColor: "rgba(148, 163, 184, 0.18)",
            }}
          >
            <Typography
              align="center"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              Continue with your Google account
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                text="continue_with"
                shape="rectangular"
                size="large"
                width="280"
              />
            </Box>

            {loading && (
              <Typography
                align="center"
                color="text.secondary"
                sx={{
                  mt: 2,
                  fontSize: "0.9rem",
                }}
              >
                Signing you in...
              </Typography>
            )}

            {error && (
              <Typography
                color="error"
                sx={{
                  mt: 2,
                  textAlign: "center",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
              p: 2,
              borderRadius: 2.5,
              backgroundColor: "rgba(25, 118, 210, 0.045)",
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor: "rgba(25,118,210,0.12)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              ✓
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  mb: 0.3,
                }}
              >
                Secure authentication
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  fontSize: "0.8rem",
                  lineHeight: 1.5,
                }}
              >
                Google verifies your identity securely. FinTrack never receives
                or stores your Google password.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate("/")}
            sx={{
              mt: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            ← Back to Home
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
