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
          mb: 3,
        }}
      >
        <Typography variant="h4">Accounts</Typography>

        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            width: {
              xs: "100%",
              sm: "auto",
            },
          }}
        >
          Add Account
        </Button>
      </Box>

      {accounts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No Accounts Yet
            </Typography>

            <Typography color="text.secondary">
              Add your first account to begin tracking your finances.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {accounts.map((account) => (
            <Grid key={account.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
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
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{account.name}</Typography>

                      <Typography color="text.secondary">
                        {account.account_type}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignSelf: {
                          xs: "flex-end",
                          sm: "center",
                        },
                      }}
                    >
                      <IconButton
                        onClick={() => handleEdit(account)}
                        aria-label="edit account"
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleOpenDeleteDialog(account)}
                        aria-label="delete account"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      mt: 2,
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

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingAccountId ? "Edit Account" : "Add Account"}
        </DialogTitle>

        <DialogContent>
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

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>

          <Button
            variant="contained"
            onClick={
              editingAccountId ? handleUpdateAccount : handleCreateAccount
            }
          >
            {editingAccountId ? "Save Changes" : "Save Account"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Account?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{" "}
            <strong>{accountToDelete?.name}</strong>? The account will no longer
            appear in your active accounts, but its previous transactions will
            remain in your financial history.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
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
