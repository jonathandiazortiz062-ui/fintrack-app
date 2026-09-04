import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import AddCardIcon from "@mui/icons-material/AddCard";
import InsightsIcon from "@mui/icons-material/Insights";

function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: 1,
          borderColor: "divider",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            maxWidth: "1200px",
            width: "100%",
            mx: "auto",
            py: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              F
            </Box>

            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
              }}
            >
              FinTrack
            </Typography>
          </Box>

          <Button
            color="inherit"
            onClick={() => navigate("/login")}
            sx={{
              mr: 1,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Log In
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/register")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Get Started
          </Button>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Add this to offset the fixed AppBar */}
      <Box
        sx={{
          position: "relative",
          px: 3,
          py: { xs: 8, md: 12 },
          backgroundImage: `
      linear-gradient(
        90deg,
        rgba(255,255,255,0.58) 0%,
        rgba(255,255,255,0.38) 45%,
        rgba(255,255,255,0.16) 100%
        ),
      url("/fintrack-hero-bg.png")
    `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Box
          sx={{
            maxWidth: "1200px",
            mx: "auto",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: { xs: 6, md: 8 },
            alignItems: "center",
          }}
        >
          {/* Hero text */}
          <Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: {
                  xs: "2.5rem",
                  md: "3.75rem",
                },
                lineHeight: 1.1,
              }}
            >
              Take Control of Your Financial Life
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 4,
                lineHeight: 1.7,
                maxWidth: "600px",
              }}
            >
              Manage your accounts, track income and expenses, build budgets,
              and monitor your investments from one simple dashboard.
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/register")}
              >
                Create Free Account
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
              >
                Log In
              </Button>
            </Box>
          </Box>

          {/* Dashboard preview */}
          <Box
            sx={{
              backgroundColor: "background.paper",
              borderRadius: 4,
              p: { xs: 3, md: 4 },
              boxShadow: 6,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
              }}
            >
              Financial Overview
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Total Balance
            </Typography>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 4,
              }}
            >
              $12,450.00
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 4,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "grey.50",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Monthly Income
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  $4,200
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  backgroundColor: "grey.50",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Monthly Expenses
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  $2,180
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 2,
              }}
            >
              Recent Activity
            </Typography>

            {[
              ["Salary", "+$3,200"],
              ["Groceries", "-$84.25"],
              ["Utilities", "-$126.40"],
            ].map(([name, amount]) => (
              <Box
                key={name}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography>{name}</Typography>

                <Typography sx={{ fontWeight: 600 }}>{amount}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          px: 3,
          background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)",
        }}
      >
        <Box
          sx={{
            maxWidth: "1200px",
            mx: "auto",
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Everything You Need to Manage Your Finances
          </Typography>

          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{
              maxWidth: "700px",
              mx: "auto",
              mb: 6,
            }}
          >
            FinTrack brings your everyday financial activity into one simple
            dashboard so you can understand where your money is going.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {[
              {
                title: "Accounts",
                description:
                  "Keep track of checking, savings, credit, and cash accounts in one place.",
                icon: <AccountBalanceWalletIcon fontSize="large" />,
              },
              {
                title: "Transactions",
                description:
                  "Record your income and expenses and organize them by category.",
                icon: <ReceiptLongIcon fontSize="large" />,
              },
              {
                title: "Budgets",
                description:
                  "Set monthly spending limits and monitor your progress throughout the month.",
                icon: <SavingsIcon fontSize="large" />,
              },
              {
                title: "Investments",
                description:
                  "Track your investment holdings and monitor current market information.",
                icon: <TrendingUpIcon fontSize="large" />,
              },
            ].map((feature) => (
              <Box
                key={feature.title}
                sx={{
                  p: 3,
                  backgroundColor: "background.paper",
                  borderRadius: 2,
                  boxShadow: 1,
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  {feature.title}
                </Typography>

                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          backgroundColor: "background.paper",
          px: 3,
          py: { xs: 8, md: 10 },
        }}
      >
        <Box
          sx={{
            maxWidth: "1200px",
            mx: "auto",
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            How FinTrack Works
          </Typography>

          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{
              maxWidth: "650px",
              mx: "auto",
              mb: 6,
            }}
          >
            Get started in a few simple steps and build a clearer picture of
            your finances.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 5,
            }}
          >
            {[
              {
                number: "01",
                title: "Create Your Account",
                description:
                  "Create your FinTrack profile and securely access your personal financial dashboard.",
                icon: <PersonAddAltIcon fontSize="large" />,
              },
              {
                number: "02",
                title: "Add Your Financial Data",
                description:
                  "Add your accounts, record transactions, create budgets, and enter your investment holdings.",
                icon: <AddCardIcon fontSize="large" />,
              },
              {
                number: "03",
                title: "Monitor Your Finances",
                description:
                  "Use your dashboard to see balances, monthly income and expenses, investments, and recent activity.",
                icon: <InsightsIcon fontSize="large" />,
              },
            ].map((step) => (
              <Box
                key={step.number}
                sx={{
                  textAlign: "center",
                  px: 2,
                }}
              >
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 1.5,
                  }}
                >
                  STEP {step.number}
                </Typography>

                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 3,
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    my: 2,
                    boxShadow: 2,
                  }}
                >
                  {step.icon}
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  {step.title}
                </Typography>

                <Typography color="text.secondary">
                  {step.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
          color: "primary.contrastText",
          py: { xs: 8, md: 10 },
          px: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            maxWidth: "800px",
            mx: "auto",
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Start Building a Clearer Financial Picture
          </Typography>

          <Typography
            sx={{
              mb: 4,
              opacity: 0.9,
            }}
          >
            Create your FinTrack account and begin organizing your accounts,
            transactions, budgets, and investments in one place.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/register")}
              sx={{
                backgroundColor: "background.paper",
                color: "primary.main",
                "&:hover": {
                  backgroundColor: "grey.100",
                },
              }}
            >
              Get Started
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/login")}
              sx={{
                borderColor: "primary.contrastText",
                color: "primary.contrastText",
                "&:hover": {
                  borderColor: "primary.contrastText",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              Log In
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 4,
          px: 3,
          textAlign: "center",
          backgroundColor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} FinTrack. Personal finance made simpler.
        </Typography>
      </Box>
    </Box>
  );
}

export default Home;
