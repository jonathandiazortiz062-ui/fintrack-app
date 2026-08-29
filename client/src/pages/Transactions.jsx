import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well.
// This will make our code more maintainable and easier to read.

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    accountId: "",
    categoryId: "",
    description: "",
    amount: "",
    transactionType: "",
    transactionDate: "",
  });

  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [filters, setFilters] = useState({
    accountId: "",
    categoryId: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpen = () => {
    setEditingTransactionId(null);

    setFormData({
      accountId: "",
      categoryId: "",
      description: "",
      amount: "",
      transactionType: "",
      transactionDate: "",
    });

    setFormErrors({
      accountId: "",
      description: "",
      amount: "",
      transactionType: "",
      transactionDate: "",
    });

    setOpen(true);
  };
  const handleEditTransaction = (transaction) => {
    setEditingTransactionId(transaction.id);

    setFormData({
      accountId: transaction.account_id,
      categoryId: transaction.category_id || "",
      description: transaction.description,
      amount: transaction.amount,
      transactionType: transaction.transaction_type,
      transactionDate: transaction.transaction_date.slice(0, 10),
    });

    setFormErrors({
      accountId: "",
      description: "",
      amount: "",
      transactionType: "",
      transactionDate: "",
    });

    setOpen(true);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = async () => {
    try {
      await fetchTransactions(filters);
    } catch (error) {
      console.error("Error filtering transactions:", error);
      setError("Unable to filter transactions");
    }
  };
  const handleClearFilters = async () => {
    const clearedFilters = {
      accountId: "",
      categoryId: "",
      type: "",
      startDate: "",
      endDate: "",
    };

    setFilters(clearedFilters);

    try {
      await fetchTransactions(clearedFilters);
    } catch (error) {
      console.error("Error clearing filters:", error);
    }
  };

  const handleOpenDeleteDialog = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  //Validattions:
  const [formErrors, setFormErrors] = useState({
    accountId: "",
    description: "",
    amount: "",
    transactionType: "",
    transactionDate: "",
  });

  const validateForm = () => {
    const errors = {
      accountId: "",
      description: "",
      amount: "",
      transactionType: "",
      transactionDate: "",
    };

    if (!formData.accountId) {
      errors.accountId = "Account is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (formData.amount === "") {
      errors.amount = "Amount is required";
    } else if (
      Number.isNaN(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      errors.amount = "Amount must be greater than 0";
    }

    if (!formData.transactionType) {
      errors.transactionType = "Transaction type is required";
    }

    if (!formData.transactionDate) {
      errors.transactionDate = "Transaction date is required";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  //CRUD:
  const handleCreateTransaction = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            accountId: Number(formData.accountId),

            categoryId: formData.categoryId
              ? Number(formData.categoryId)
              : null,

            description: formData.description,

            amount: Number(formData.amount),

            transactionType: formData.transactionType,

            transactionDate: formData.transactionDate,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      await fetchTransactions();

      setFormData({
        accountId: "",
        categoryId: "",
        description: "",
        amount: "",
        transactionType: "",
        transactionDate: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleUpdateTransaction = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/${editingTransactionId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",

          body: JSON.stringify({
            accountId: Number(formData.accountId),

            categoryId: formData.categoryId
              ? Number(formData.categoryId)
              : null,

            description: formData.description,

            amount: Number(formData.amount),

            transactionType: formData.transactionType,

            transactionDate: formData.transactionDate,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      await fetchTransactions();

      setEditingTransactionId(null);

      setFormData({
        accountId: "",
        categoryId: "",
        description: "",
        amount: "",
        transactionType: "",
        transactionDate: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/${transactionId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== transactionId),
      );
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const fetchTransactions = async (currentFilters = filters) => {
    const params = new URLSearchParams();

    if (currentFilters.accountId) {
      params.append("accountId", currentFilters.accountId);
    }

    if (currentFilters.categoryId) {
      params.append("categoryId", currentFilters.categoryId);
    }

    if (currentFilters.type) {
      params.append("type", currentFilters.type);
    }

    if (currentFilters.startDate) {
      params.append("startDate", currentFilters.startDate);
    }

    if (currentFilters.endDate) {
      params.append("endDate", currentFilters.endDate);
    }

    const queryString = params.toString();

    const url = queryString
      ? `${import.meta.env.VITE_API_URL}/api/transactions?${queryString}`
      : `${import.meta.env.VITE_API_URL}/api/transactions`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();

    setTransactions(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionsResponse, accountsResponse, categoriesResponse] =
          await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
              credentials: "include",
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/accounts`, {
              credentials: "include",
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
              credentials: "include",
            }),
          ]);

        if (
          !transactionsResponse.ok ||
          !accountsResponse.ok ||
          !categoriesResponse.ok
        ) {
          throw new Error("Failed to load transaction data");
        }

        const [transactionsData, accountsData, categoriesData] =
          await Promise.all([
            transactionsResponse.json(),
            accountsResponse.json(),
            categoriesResponse.json(),
          ]);

        setTransactions(transactionsData);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading transaction page:", error);
        setError("Unable to load transaction data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Typography>Loading transactions...</Typography>;
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
          <Typography variant="h4">Transactions</Typography>

          <Typography color="text.secondary">
            Track your income and expenses
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Transaction
        </Button>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filters
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                label="Account"
                name="accountId"
                value={filters.accountId}
                onChange={handleFilterChange}
                fullWidth
              >
                <MenuItem value="">All Accounts</MenuItem>

                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                label="Category"
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                fullWidth
              >
                <MenuItem value="">All Categories</MenuItem>

                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                label="Type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                fullWidth
              >
                <MenuItem value="">All Types</MenuItem>

                <MenuItem value="income">Income</MenuItem>

                <MenuItem value="expense">Expense</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>

            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <Button variant="contained" onClick={handleApplyFilters}>
                Apply
              </Button>

              <Button variant="outlined" onClick={handleClearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>

            <Typography color="text.secondary">
              No transactions have been added yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {transactions.map((transaction) => (
            <Grid key={transaction.id} size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">
                        {transaction.description}
                      </Typography>

                      <Typography color="text.secondary">
                        {transaction.account_name}
                        {" • "}
                        {transaction.category_name || "Uncategorized"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {new Date(
                          transaction.transaction_date,
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => handleEditTransaction(transaction)}
                        aria-label="edit transaction"
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleOpenDeleteDialog(transaction)}
                        aria-label="delete transaction"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Typography
                      variant="h6"
                      color={
                        transaction.transaction_type === "income"
                          ? "success"
                          : "error"
                      }
                    >
                      {transaction.transaction_type === "expense" ? "-" : "+"}$
                      {Number(transaction.amount).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingTransactionId ? "Edit Transaction" : "Add Transaction"}
        </DialogTitle>

        <DialogContent>
          <TextField
            select
            label="Account"
            name="accountId"
            value={formData.accountId}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.accountId)}
            helperText={formErrors.accountId}
          >
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="">None</MenuItem>

            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.description)}
            helperText={formErrors.description}
          />

          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.amount)}
            helperText={formErrors.amount}
          />

          <TextField
            select
            label="Transaction Type"
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.transactionType)}
            helperText={formErrors.transactionType}
          >
            <MenuItem value="income">Income</MenuItem>

            <MenuItem value="expense">Expense</MenuItem>
          </TextField>

          <TextField
            label="Transaction Date"
            name="transactionDate"
            type="date"
            value={formData.transactionDate}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.transactionDate)}
            helperText={formErrors.transactionDate}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={
              editingTransactionId
                ? handleUpdateTransaction
                : handleCreateTransaction
            }
          >
            {editingTransactionId ? "Save Changes" : "Save Transaction"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Transaction?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{transactionToDelete?.description}</strong>? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>

          <Button
            color="error"
            onClick={() => {
              if (transactionToDelete) {
                handleDeleteTransaction(transactionToDelete.id);
                handleCloseDeleteDialog();
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Transactions;
