import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  TextField,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon from "@mui/icons-material/ShowChart";
//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well.
// This will make our code more maintainable and easier to read.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

function Investments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "",
    purchasePrice: "",
  });

  const [editingInvestmentId, setEditingInvestmentId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState(null);

  //Helpers:

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpen = () => {
    setEditingInvestmentId(null);

    setFormData({
      symbol: "",
      quantity: "",
      purchasePrice: "",
    });

    setFormErrors({
      symbol: "",
      quantity: "",
      purchasePrice: "",
    });

    setOpen(true);
  };

  const handleEditInvestment = (investment) => {
    setEditingInvestmentId(investment.id);

    setFormData({
      symbol: investment.symbol,
      quantity: investment.quantity,
      purchasePrice: investment.purchase_price,
    });

    setFormErrors({
      symbol: "",
      quantity: "",
      purchasePrice: "",
    });

    setOpen(true);
  };

  const handleOpenDeleteDialog = (investment) => {
    setInvestmentToDelete(investment);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setInvestmentToDelete(null);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  //Validations:
  const [formErrors, setFormErrors] = useState({
    symbol: "",
    quantity: "",
    purchasePrice: "",
  });

  const validateForm = () => {
    const errors = {
      symbol: "",
      quantity: "",
      purchasePrice: "",
    };

    if (!formData.symbol.trim()) {
      errors.symbol = "Symbol is required";
    }

    if (formData.quantity === "") {
      errors.quantity = "Quantity is required";
    } else if (
      Number.isNaN(Number(formData.quantity)) ||
      Number(formData.quantity) <= 0
    ) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (formData.purchasePrice === "") {
      errors.purchasePrice = "Purchase price is required";
    } else if (
      Number.isNaN(Number(formData.purchasePrice)) ||
      Number(formData.purchasePrice) <= 0
    ) {
      errors.purchasePrice = "Purchase price must be greater than 0";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  //CRUD:
  const handleCreateInvestment = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await apiFetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: formData.symbol,
          quantity: Number(formData.quantity),
          purchasePrice: Number(formData.purchasePrice),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to create investment");
      }

      await fetchInvestments();

      setFormData({
        symbol: "",
        quantity: "",
        purchasePrice: "",
      });

      setOpen(false);
      showSnackbar("Investment created successfully");
    } catch (error) {
      console.error("Error creating investment:", error);
      showSnackbar(error.message || "Failed to create investment", "error");
    }
  };

  const handleUpdateInvestment = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await apiFetch(
        `/api/investments/${editingInvestmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: formData.symbol,
            quantity: Number(formData.quantity),
            purchasePrice: Number(formData.purchasePrice),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to update investment");
      }

      await fetchInvestments();

      setEditingInvestmentId(null);

      setFormData({
        symbol: "",
        quantity: "",
        purchasePrice: "",
      });

      setOpen(false);
      showSnackbar("Investment updated successfully");
    } catch (error) {
      console.error("Error updating investment:", error);
      showSnackbar(error.message || "Failed to update investment", "error");
    }
  };

  const handleDeleteInvestment = async (investmentId) => {
    try {
      const response = await apiFetch(`/api/investments/${investmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to delete investment");
      }

      setInvestments((prev) =>
        prev.filter((investment) => investment.id !== investmentId),
      );
      showSnackbar("Investment deleted successfully");
    } catch (error) {
      console.error("Error deleting investment:", error);
      showSnackbar("Failed to delete investment", "error");
    }
  };

  const fetchInvestments = async () => {
    const response = await apiFetch("/api/investments");

    if (!response.ok) {
      throw new Error("Failed to fetch investments");
    }

    const data = await response.json();

    setInvestments(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchInvestments();
      } catch (error) {
        console.error("Error loading investments:", error);
        setError("Unable to load investments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const totalInvested = investments.reduce(
    (total, investment) => total + Number(investment.cost_basis),
    0,
  );

  const totalCurrentValue = investments.reduce(
    (total, investment) =>
      total +
      (investment.market_data_available ? Number(investment.current_value) : 0),
    0,
  );

  const totalGainLoss = totalCurrentValue - totalInvested;

  const totalGainLossPercent =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Investments
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Track your portfolio performance and investment positions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            width: {
              xs: "100%",
              sm: "auto",
            },
            px: 2.5,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add Investment
        </Button>
      </Box>
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          boxShadow: 1,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
            }}
          >
            Portfolio Summary
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {/* Total Invested */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                <AccountBalanceWalletIcon />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Invested
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  ${totalInvested.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Current Value */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                <ShowChartIcon />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Value
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  ${totalCurrentValue.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Gain / Loss */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    totalGainLoss >= 0
                      ? "rgba(46, 125, 50, 0.08)"
                      : "rgba(211, 47, 47, 0.08)",
                  color: totalGainLoss >= 0 ? "success.main" : "error.main",
                  flexShrink: 0,
                }}
              >
                <TrendingUpIcon />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Gain / Loss
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: totalGainLoss >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toFixed(2)}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color:
                      totalGainLossPercent >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {totalGainLossPercent >= 0 ? "+" : ""}
                  {totalGainLossPercent.toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      {investments.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            boxShadow: 1,
          }}
        >
          <CardContent
            sx={{
              py: 6,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                color: "primary.main",
                mx: "auto",
                mb: 2,
              }}
            >
              <TrendingUpIcon />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              No Investments Yet
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mb: 3,
              }}
            >
              Add your first investment to begin tracking your portfolio.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Add Your First Investment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {investments.map((investment) => (
            <Card
              key={investment.id}
              sx={{
                height: "100%",
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
                boxShadow: 1,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",

                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                        color: "primary.main",
                        flexShrink: 0,
                      }}
                    >
                      <TrendingUpIcon />
                    </Box>

                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {investment.symbol}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Investment Position
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex" }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditInvestment(investment)}
                      aria-label="edit investment"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDeleteDialog(investment)}
                      aria-label="delete investment"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      {Number(investment.quantity)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Purchase Price
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      ${Number(investment.purchase_price).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cost Basis
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      ${Number(investment.cost_basis).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Price
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      {investment.market_data_available
                        ? `$${Number(investment.current_price).toFixed(2)}`
                        : "Unavailable"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Value
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      {investment.market_data_available
                        ? `$${Number(investment.current_value).toFixed(2)}`
                        : "Unavailable"}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Gain / Loss
                  </Typography>

                  {investment.market_data_available ? (
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color:
                          Number(investment.gain_loss) >= 0
                            ? "success.main"
                            : "error.main",
                      }}
                    >
                      {Number(investment.gain_loss) >= 0 ? "+" : ""}$
                      {Number(investment.gain_loss).toFixed(2)} (
                      {Number(investment.gain_loss_percent) >= 0 ? "+" : ""}
                      {Number(investment.gain_loss_percent).toFixed(2)}% )
                    </Typography>
                  ) : (
                    <Typography color="text.secondary">
                      Market data unavailable
                    </Typography>
                  )}

                  {investment.market_data_available && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mt: 0.75,
                      }}
                    >
                      Market data as of {investment.latest_trading_day}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            pb: 1,
          }}
        >
          {editingInvestmentId ? "Edit Investment" : "Add Investment"}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.symbol)}
            helperText={formErrors.symbol}
          />

          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.quantity)}
            helperText={formErrors.quantity}
          />

          <TextField
            label="Purchase Price"
            name="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.purchasePrice)}
            helperText={formErrors.purchasePrice}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              editingInvestmentId
                ? handleUpdateInvestment
                : handleCreateInvestment
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {editingInvestmentId ? "Save Changes" : "Save Investment"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Investment?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your{" "}
            <strong>{investmentToDelete?.symbol}</strong> investment? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            onClick={() => {
              if (investmentToDelete) {
                handleDeleteInvestment(investmentToDelete.id);
                handleCloseDeleteDialog();
              }
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Investments;
