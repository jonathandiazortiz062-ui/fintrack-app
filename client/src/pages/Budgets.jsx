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
import SavingsIcon from "@mui/icons-material/Savings";

//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well.
// This will make our code more maintainable and easier to read.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

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

  const today = new Date();

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const budgetPeriod = `${formatDate(firstDayOfMonth)} – ${formatDate(lastDayOfMonth)}`;

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
  const handleCreateBudget = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const response = await apiFetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: Number(formData.categoryId),
          monthlyLimit: Number(formData.monthlyLimit),
        }),
      });

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
      const response = await apiFetch(`/api/budgets/${editingBudgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: Number(formData.categoryId),
          monthlyLimit: Number(formData.monthlyLimit),
        }),
      });

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
      const response = await apiFetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      });

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
    const response = await apiFetch("/api/budgets");

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
          apiFetch("/api/budgets"),
          apiFetch("/api/categories"),
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
            Budgets
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Set monthly spending limits and track your progress.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Budget period: {budgetPeriod}
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
          Add Budget
        </Button>
      </Box>

      {budgets.length === 0 ? (
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
              <SavingsIcon sx={{ fontSize: 30 }} />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              No Budgets Yet
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: 420,
                mx: "auto",
                mb: 2.5,
              }}
            >
              Create your first monthly budget to start tracking spending by
              category.
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
              Create Your First Budget
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
          {budgets.map((budget) => {
            const limit = Number(budget.monthly_limit);
            const spent = Number(budget.amount_spent);

            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOverBudget = spent > limit;

            return (
              <Card
                key={budget.id}
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
                  {/* Card header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
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
                        <SavingsIcon />
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {budget.category_name}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Monthly Budget
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex" }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditBudget(budget)}
                        aria-label="edit budget"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(budget)}
                        aria-label="delete budget"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Budget limit */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Monthly Limit
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2.5,
                    }}
                  >
                    ${limit.toFixed(2)}
                  </Typography>

                  {/* Spending */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      ${spent.toFixed(2)} spent
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: isOverBudget
                          ? "error.main"
                          : percentage >= 75
                            ? "warning.main"
                            : "text.secondary",
                      }}
                    >
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    color={
                      isOverBudget
                        ? "error"
                        : percentage >= 75
                          ? "warning"
                          : "primary"
                    }
                    sx={{
                      height: 8,
                      borderRadius: 4,
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      $0
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      ${limit.toFixed(2)}
                    </Typography>
                  </Box>

                  {isOverBudget && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1.5,
                        fontWeight: 600,
                        color: "error.main",
                      }}
                    >
                      Over budget by ${(spent - limit).toFixed(2)}
                    </Typography>
                  )}
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
          {editingBudgetId ? "Edit Budget" : "Add Budget"}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
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
            onClick={editingBudgetId ? handleUpdateBudget : handleCreateBudget}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {editingBudgetId ? "Save Changes" : "Save Budget"}
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
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Budget?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the budget for{" "}
            <strong>{budgetToDelete?.category_name}</strong>? This action cannot
            be undone.
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
              if (budgetToDelete) {
                handleDeleteBudget(budgetToDelete.id);
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

export default Budgets;
