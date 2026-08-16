import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  IconButton,
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

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: "",
    monthlyLimit: "",
  });

  const [editingBudgetId, setEditingBudgetId] = useState(null);

  const handleOpen = () => {
    setEditingBudgetId(null);

    setFormData({
      categoryId: "",
      monthlyLimit: "",
    });

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

    setOpen(true);
  };

  //CRUD:
  const handleCreateBudget = async (req, res) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            categoryId: Number(formData.categoryId),
            monthlyLimit: Number(formData.monthlyLimit),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create budget");
      }

      await fetchBudgets();

      setFormData({
        categoryId: "",
        monthlyLimit: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error creating budget:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          message: "Budget for this category already exists",
        });
      }

      res.status(500).json({
        message: "Unable to create budget",
      });
    }
  };

  const handleUpdateBudget = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets/${editingBudgetId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId: Number(formData.categoryId),
            monthlyLimit: Number(formData.monthlyLimit),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update budget");
      }

      await fetchBudgets();

      setEditingBudgetId(null);

      setFormData({
        categoryId: "",
        monthlyLimit: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets/${budgetId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete budget");
      }

      setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const fetchBudgets = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/budgets`);

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
          fetch(`${import.meta.env.VITE_API_URL}/api/budgets`),
          fetch(`${import.meta.env.VITE_API_URL}/api/categories`),
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
    return <Typography>Loading budgets...</Typography>;
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
              Your Budgets
            </Typography>

            <Typography color="text.secondary">
              No budgets have been created yet.
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
          {budgets.map((budget) => (
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
                    <Typography variant="h6">{budget.category_name}</Typography>

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
                      onClick={() => handleDeleteBudget(budget.id)}
                      aria-label="delete budget"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h5" sx={{ mt: 2 }}>
                  ${Number(budget.monthly_limit).toFixed(2)}
                </Typography>
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
          />
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
    </Box>
  );
}

export default Budgets;
