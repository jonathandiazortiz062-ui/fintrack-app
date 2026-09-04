import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import { apiFetch } from "../../utils/api";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useState, useEffect } from "react";

//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well.
// This will make our code more maintainable and easier to read.

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    accountType: "",
    balance: "",
  });

  //Regular handlers and helpers:
  const handleOpen = () => {
    setEditingAccountId(null);

    setFormData({
      name: "",
      accountType: "",
      balance: "",
    });

    setFormErrors({
      name: "",
      accountType: "",
      balance: "",
    });

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (account) => {
    setEditingAccountId(account.id);

    setFormData({
      name: account.name,
      accountType: account.account_type,
      balance: account.balance,
    });

    setFormErrors({
      name: "",
      accountType: "",
      balance: "",
    });

    setOpen(true);
  };

  const handleOpenDeleteDialog = (accountId) => {
    setAccountToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setAccountToDelete(null);
    setDeleteDialogOpen(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Validations:
  const [formErrors, setFormErrors] = useState({
    name: "",
    accountType: "",
    balance: "",
  });

  const validateForm = () => {
    const errors = {
      name: "",
      accountType: "",
      balance: "",
    };

    if (!formData.name.trim()) {
      errors.name = "Account name is required";
    }

    if (!formData.accountType) {
      errors.accountType = "Account type is required";
    }

    if (formData.balance === "") {
      errors.balance = "Balance is required";
    } else if (Number.isNaN(Number(formData.balance))) {
      errors.balance = "Balance must be a valid number";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  //CRUD operaions for accounts
  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await apiFetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          accountType: formData.accountType,
          balance: Number(formData.balance),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      const newAccount = await response.json();

      setAccounts((prev) => [...prev, newAccount]);
      showSnackbar("Account created successfully");

      setFormData({
        name: "",
        accountType: "",
        balance: "",
      });

      setOpen(false);
    } catch (error) {
      showSnackbar("Unable to create account", "error");
      console.error("Error creating account:", error);
    }
  };

  const handleUpdateAccount = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await apiFetch(`/api/accounts/${editingAccountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          accountType: formData.accountType,
          balance: Number(formData.balance),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update account");
      }

      const updatedAccount = await response.json();

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === updatedAccount.id ? updatedAccount : account,
        ),
      );
      showSnackbar("Account updated successfully");

      setEditingAccountId(null);

      setFormData({
        name: "",
        accountType: "",
        balance: "",
      });

      setOpen(false);
    } catch (error) {
      showSnackbar("Unable to update account", "error");
      console.error("Error updating account:", error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const response = await apiFetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      setAccounts((prev) => prev.filter((account) => account.id !== accountId));
      showSnackbar("Account deleted successfully");
    } catch (error) {
      showSnackbar("Unable to delete account", "error");
      console.error("Error deleting account:", error);
    }
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiFetch("/api/accounts");

        if (!response.ok) {
          throw new Error("Failed to fetch accounts");
        }

        const data = await response.json();

        setAccounts(data);
      } catch (error) {
        console.error("Error fetching accounts:", error);
        setError("Unable to load accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
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
            Accounts
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Manage your financial accounts and balances.
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
          Add Account
        </Button>
      </Box>

      {accounts.length === 0 ? (
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
              px: 3,
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
              <AccountBalanceWalletIcon sx={{ fontSize: 30 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              No Accounts Yet
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: 400,
                mx: "auto",
                mb: 2.5,
              }}
            >
              Add your first account to begin tracking your finances.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {accounts.map((account) => (
            <Grid key={account.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
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
                        <AccountBalanceWalletIcon />
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {account.name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            textTransform: "capitalize",
                          }}
                        >
                          {account.account_type}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        ml: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(account)}
                        aria-label="edit account"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(account)}
                        aria-label="delete account"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Current Balance
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color:
                        Number(account.balance) < 0
                          ? "error.main"
                          : Number(account.balance) > 0
                            ? "success.main"
                            : "text.primary",
                    }}
                  >
                    ${Number(account.balance).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
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
          {editingAccountId ? "Edit Account" : "Add Account"}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Account Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.name)}
            helperText={formErrors.name}
          />

          <TextField
            select
            label="Account Type"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.accountType)}
            helperText={formErrors.accountType}
          >
            <MenuItem value="checking">Checking</MenuItem>

            <MenuItem value="savings">Savings</MenuItem>

            <MenuItem value="credit">Credit</MenuItem>

            <MenuItem value="cash">Cash</MenuItem>
          </TextField>

          <TextField
            label="Starting Balance"
            name="balance"
            type="number"
            value={formData.balance}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.balance)}
            helperText={formErrors.balance}
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
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
            variant="contained"
            onClick={
              editingAccountId ? handleUpdateAccount : handleCreateAccount
            }
          >
            {editingAccountId ? "Save Changes" : "Save Account"}
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
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Account?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{" "}
            <strong>{accountToDelete?.name}</strong>? The account will no longer
            appear in your active accounts, but its previous transactions will
            remain in your financial history.
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>

          <Button
            color="error"
            onClick={() => {
              if (accountToDelete) {
                handleDeleteAccount(accountToDelete.id);
                handleCloseDeleteDialog();
              }
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

export default Accounts;
