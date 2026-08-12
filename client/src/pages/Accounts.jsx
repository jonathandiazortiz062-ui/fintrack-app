import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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

  const [formData, setFormData] = useState({
    name: "",
    accountType: "",
    balance: "",
  });

  const handleOpen = () => {
    setEditingAccountId(null);

    setFormData({
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
  //CRUD operaions for accounts
  const handleCreateAccount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/accounts`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: formData.name,
            accountType: formData.accountType,
            balance: Number(formData.balance),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      const newAccount = await response.json();

      setAccounts((prev) => [...prev, newAccount]);

      setFormData({
        name: "",
        accountType: "",
        balance: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  const handleEdit = (account) => {
    setEditingAccountId(account.id);

    setFormData({
      name: account.name,
      accountType: account.account_type,
      balance: account.balance,
    });

    setOpen(true);
  };

  const handleUpdateAccount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/accounts/${editingAccountId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: formData.name,
            accountType: formData.accountType,
            balance: Number(formData.balance),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update account");
      }

      const updatedAccount = await response.json();

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === updatedAccount.id ? updatedAccount : account,
        ),
      );

      setEditingAccountId(null);

      setFormData({
        name: "",
        accountType: "",
        balance: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/accounts/${accountId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      setAccounts((prev) => prev.filter((account) => account.id !== accountId));
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/accounts`,
        );

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
    return <Typography>Loading accounts...</Typography>;
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
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">Accounts</Typography>

          <Typography color="text.secondary">
            Manage your financial accounts
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Account
        </Button>
      </Box>

      {accounts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Accounts
            </Typography>

            <Typography color="text.secondary">
              No accounts have been added yet.
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
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{account.name}</Typography>

                      <Typography color="text.secondary">
                        {account.account_type}
                      </Typography>
                    </Box>

                    <Box>
                      <IconButton
                        onClick={() => handleEdit(account)}
                        aria-label="edit account"
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDeleteAccount(account.id)}
                        aria-label="delete account"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="h5" sx={{ mt: 2 }}>
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
          />

          <TextField
            select
            label="Account Type"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            fullWidth
            margin="normal"
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
    </Box>
  );
}

export default Accounts;
