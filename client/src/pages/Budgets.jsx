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
  IconButton,
  LinearProgress,
  Snackbar,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import AddIcon from "@mui/icons-material/Add";

//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well.
// This will make our code more maintainable and easier to read.

import { useEffect, useState } from "react";

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: "",
    monthlyLimit: "",
  });

  const [editingBudgetId, setEditingBudgetId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  //Helpers:
  const handleOpen = () => {
    setEditingBudgetId(null);

    setFormData({
      categoryId: "",
      monthlyLimit: "",
    });

    setFormErrors({
      categoryId: "",
      monthlyLimit: "",
    });

    setDuplicateError("");

    setOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditBudget = (budget) => {
    setEditingBudgetId(budget.id);

    setFormData({
      categoryId: budget.category_id,
      monthlyLimit: budget.monthly_limit,
    });

    setDuplicateError("");

    setOpen(true);
  };

  const handleOpenDeleteDialog = (budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBudgetToDelete(null);
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
    categoryId: "",
    monthlyLimit: "",
  });
  const [duplicateError, setDuplicateError] = useState("");

  const validateForm = () => {
    const errors = {
      categoryId: "",
      monthlyLimit: "",
    };

    if (!formData.categoryId) {
      errors.categoryId = "Category is required";
    }

    if (formData.monthlyLimit === "") {
      errors.monthlyLimit = "Monthly limit is required";
    } else if (
      Number.isNaN(Number(formData.monthlyLimit)) ||
      Number(formData.monthlyLimit) <= 0
    ) {
      errors.monthlyLimit = "Monthly limit must be greater than 0";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  //CRUD:
  const handleCreateBudget = async (req, res) => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            categoryId: Number(formData.categoryId),
            monthlyLimit: Number(formData.monthlyLimit),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to create budget");
      }

      await fetchBudgets();

      setFormData({
        categoryId: "",
        monthlyLimit: "",
      });

      setOpen(false);
      showSnackbar("Budget created successfully");
    } catch (error) {
      console.error("Error creating budget:", error);
      setDuplicateError(
        error.message || "An error occurred while creating the budget",
      );
      showSnackbar(
        error.message || "An error occurred while creating the budget",
        "error",
      );
    }
  };

  const handleUpdateBudget = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets/${editingBudgetId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            categoryId: Number(formData.categoryId),
            monthlyLimit: Number(formData.monthlyLimit),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to update budget");
      }

      await fetchBudgets();

      setEditingBudgetId(null);

      setFormData({
        categoryId: "",
        monthlyLimit: "",
      });

      setOpen(false);
      showSnackbar("Budget updated successfully");
    } catch (error) {
      console.error("Error updating budget:", error);
      setDuplicateError(
        error.message || "An error occurred while updating the budget",
      );
      showSnackbar(
        error.message || "An error occurred while updating the budget",
        "error",
      );
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets/${budgetId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete budget");
      }

      setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));
      showSnackbar("Budget deleted successfully");
    } catch (error) {
      console.error("Error deleting budget:", error);
      showSnackbar("Failed to delete budget", "error");
    }
  };

  const fetchBudgets = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/budgets`,
      { credentials: "include" },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch budgets");
    }

    const data = await response.json();

    setBudgets(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [budgetsResponse, categoriesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/budgets`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
            credentials: "include",
          }),
        ]);

        if (!budgetsResponse.ok || !categoriesResponse.ok) {
          throw new Error("Failed to load budget data");
        }

        const [budgetsData, categoriesData] = await Promise.all([
          budgetsResponse.json(),
          categoriesResponse.json(),
        ]);

        setBudgets(budgetsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading budgets:", error);
        setError("Unable to load budget data");
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
          <Typography variant="h4">Budgets</Typography>

          <Typography color="text.secondary">
            Set monthly spending limits
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Budget
        </Button>
      </Box>

      {budgets.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No Budgets Yet
            </Typography>

            <Typography color="text.secondary">
              Create your first monthly budget to start tracking spending by
              category.
            </Typography>
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
          {budgets.map((budget) => {
            const limit = Number(budget.monthly_limit);
            const spent = Number(budget.amount_spent);

            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOverBudget = spent > limit;

            return (
              <Card key={budget.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography variant="h6">
                        {budget.category_name}
                      </Typography>

                      <Typography color="text.secondary">
                        Monthly Budget
                      </Typography>
                    </Box>

                    <Box>
                      <IconButton
                        onClick={() => handleEditBudget(budget)}
                        aria-label="edit budget"
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleOpenDeleteDialog(budget)}
                        aria-label="delete budget"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="h5" sx={{ mt: 2 }}>
                    ${Number(budget.monthly_limit).toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    ${spent.toFixed(2)} spent of ${limit.toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{ mt: 1 }}
                    color={
                      percentage >= 75 && percentage < 100
                        ? "warning"
                        : isOverBudget
                          ? "error"
                          : "primary"
                    }
                  />
                  <Typography
                    variant="body2"
                    color={isOverBudget ? "error" : "text.secondary"}
                    sx={{ mt: 0.5 }}
                  >
                    {percentage.toFixed(1)}%{isOverBudget && " - Over Budget"}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingBudgetId ? "Edit Budget" : "Add Budget"}
        </DialogTitle>

        <DialogContent>
          <TextField
            select
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.categoryId)}
            helperText={formErrors.categoryId}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Monthly Limit"
            name="monthlyLimit"
            type="number"
            value={formData.monthlyLimit}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.monthlyLimit)}
            helperText={formErrors.monthlyLimit}
          />
          {duplicateError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {duplicateError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={editingBudgetId ? handleUpdateBudget : handleCreateBudget}
          >
            {editingBudgetId ? "Save Changes" : "Save Budget"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Budget?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the budget for{" "}
            <strong>{budgetToDelete?.category_name}</strong>? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>

          <Button
            color="error"
            onClick={() => {
              if (budgetToDelete) {
                handleDeleteBudget(budgetToDelete.id);
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

export default Budgets;
