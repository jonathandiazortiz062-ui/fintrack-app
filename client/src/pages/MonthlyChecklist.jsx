import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { apiFetch } from "../../utils/api.js";

// Returns a YYYY-MM key for a JavaScript Date.
const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

// Extracts the YYYY-MM portion of an obligation's due date.
const getObligationMonthKey = (dueDate) => {
  return dueDate.slice(0, 7);
};

// Formats a JavaScript Date as YYYY-MM-DD using local calendar values.
const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Formats an obligation due date without timezone shifting.
const formatObligationDate = (dueDate) => {
  const dateOnly = dueDate.slice(0, 10);
  const [year, month, day] = dateOnly.split("-");

  const localDate = new Date(Number(year), Number(month) - 1, Number(day));

  return localDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function MonthSection({
  monthDate,
  obligations,
  onToggleCompletion,
  onEdit,
  onDelete,
  updatingObligationIds,
  showCopyButton = false,
  copySourceLabel = "",
  onCopy,
  copying = false,
}) {
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },
          py: 2.5,
          borderBottom: obligations.length > 0 ? 1 : 0,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
          }}
        >
          {monthLabel}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
        >
          {obligations.length}{" "}
          {obligations.length === 1 ? "obligation" : "obligations"}
        </Typography>
      </Box>

      {obligations.length === 0 ? (
        <Box
          sx={{
            px: 2,
            py: 5,
            textAlign: "center",
          }}
        >
          <Typography
            color="text.secondary"
            sx={{
              mb: showCopyButton ? 2 : 0,
            }}
          >
            No obligations planned for this month.
          </Typography>

          {showCopyButton && (
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={onCopy}
              disabled={copying}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              {copying ? "Copying..." : `Copy from ${copySourceLabel}`}
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          {obligations.map((obligation, index) => {
            const isUpdating = updatingObligationIds.includes(obligation.id);

            return (
              <Box
                key={obligation.id}
                sx={{
                  display: "flex",
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  gap: 1.5,
                  px: {
                    xs: 1.5,
                    sm: 2.5,
                  },
                  py: 2.25,
                  borderBottom: index !== obligations.length - 1 ? 1 : 0,
                  borderColor: "divider",
                  backgroundColor: obligation.is_completed
                    ? "action.selected"
                    : "transparent",
                  opacity: isUpdating ? 0.7 : 1,
                  transition: "background-color 0.2s ease, opacity 0.2s ease",
                  "&:hover": {
                    backgroundColor: obligation.is_completed
                      ? "action.selected"
                      : "action.hover",
                  },
                }}
              >
                <Checkbox
                  checked={Boolean(obligation.is_completed)}
                  disabled={isUpdating}
                  onChange={(event) =>
                    onToggleCompletion(obligation, event.target.checked)
                  }
                  inputProps={{
                    "aria-label": `Mark ${obligation.name} as ${
                      obligation.is_completed ? "incomplete" : "completed"
                    }`,
                  }}
                  sx={{
                    mt: {
                      xs: -0.5,
                      sm: 0,
                    },
                  }}
                />

                <Box
                  sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    display: {
                      xs: "block",
                      sm: "flex",
                    },
                    alignItems: {
                      sm: "center",
                    },
                    justifyContent: {
                      sm: "space-between",
                    },
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        textDecoration: obligation.is_completed
                          ? "line-through"
                          : "none",
                        color: obligation.is_completed
                          ? "text.secondary"
                          : "text.primary",
                      }}
                    >
                      {obligation.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      {obligation.account_name}
                      {" • "}
                      {obligation.category_name || "Uncategorized"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.25,
                      }}
                    >
                      Due {formatObligationDate(obligation.due_date)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: {
                        xs: "flex-end",
                        sm: "center",
                      },
                      justifyContent: {
                        xs: "space-between",
                        sm: "flex-end",
                      },
                      mt: {
                        xs: 1.5,
                        sm: 0,
                      },
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          color: obligation.is_completed
                            ? "text.secondary"
                            : obligation.transaction_type === "income"
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {obligation.transaction_type === "expense" ? "-" : "+"}$
                        {Number(obligation.amount).toFixed(2)}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          textAlign: {
                            xs: "left",
                            sm: "right",
                          },
                          textTransform: "capitalize",
                        }}
                      >
                        {obligation.transaction_type}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                      }}
                    >
                      <Tooltip title="Edit obligation">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(obligation)}
                          aria-label={`Edit ${obligation.name}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete obligation">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(obligation)}
                          aria-label={`Delete ${obligation.name}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

function MonthlyChecklist() {
  const [obligations, setObligations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObligationId, setEditingObligationId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [obligationToDelete, setObligationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [updatingObligationIds, setUpdatingObligationIds] = useState([]);

  const [copyingNextMonth, setCopyingNextMonth] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    accountId: "",
    categoryId: "",
    name: "",
    amount: "",
    transactionType: "",
    dueDate: "",
  });

  const [formErrors, setFormErrors] = useState({
    accountId: "",
    name: "",
    amount: "",
    transactionType: "",
    dueDate: "",
  });

  const today = new Date();

  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);

  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const currentMonthKey = getMonthKey(currentMonthDate);
  const nextMonthKey = getMonthKey(nextMonthDate);

  const minimumDueDate = formatDateForInput(currentMonthDate);

  const maximumDueDate = formatDateForInput(
    new Date(today.getFullYear(), today.getMonth() + 2, 0),
  );

  const currentMonthObligations = obligations.filter(
    (obligation) =>
      getObligationMonthKey(obligation.due_date) === currentMonthKey,
  );

  const nextMonthObligations = obligations.filter(
    (obligation) => getObligationMonthKey(obligation.due_date) === nextMonthKey,
  );

  const resetFormErrors = () => {
    setFormErrors({
      accountId: "",
      name: "",
      amount: "",
      transactionType: "",
      dueDate: "",
    });
  };

  const fetchObligations = async () => {
    const response = await apiFetch("/api/monthly-obligations");

    if (!response.ok) {
      throw new Error("Unable to retrieve monthly obligations");
    }

    const data = await response.json();

    setObligations(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [obligationsResponse, accountsResponse, categoriesResponse] =
          await Promise.all([
            apiFetch("/api/monthly-obligations"),
            apiFetch("/api/accounts"),
            apiFetch("/api/categories"),
          ]);

        if (
          !obligationsResponse.ok ||
          !accountsResponse.ok ||
          !categoriesResponse.ok
        ) {
          throw new Error("Unable to retrieve monthly checklist data");
        }

        const [obligationsData, accountsData, categoriesData] =
          await Promise.all([
            obligationsResponse.json(),
            accountsResponse.json(),
            categoriesResponse.json(),
          ]);

        setObligations(obligationsData);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading monthly checklist:", error);

        setError("Unable to load your monthly checklist. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        [name]: "",
      }));
    }
  };

  const handleOpenAddDialog = () => {
    setEditingObligationId(null);

    setFormData({
      accountId: "",
      categoryId: "",
      name: "",
      amount: "",
      transactionType: "",
      dueDate: "",
    });

    resetFormErrors();

    setDialogOpen(true);
  };

  const handleOpenEditDialog = (obligation) => {
    setEditingObligationId(obligation.id);

    setFormData({
      accountId: obligation.account_id,
      categoryId: obligation.category_id || "",
      name: obligation.name,
      amount: obligation.amount,
      transactionType: obligation.transaction_type,
      dueDate: obligation.due_date.slice(0, 10),
    });

    resetFormErrors();

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingObligationId(null);
  };

  const handleOpenDeleteDialog = (obligation) => {
    setObligationToDelete(obligation);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setObligationToDelete(null);
  };

  const validateForm = () => {
    const errors = {
      accountId: "",
      name: "",
      amount: "",
      transactionType: "",
      dueDate: "",
    };

    if (!formData.accountId) {
      errors.accountId = "Account is required";
    }

    if (!formData.name.trim()) {
      errors.name = "Name is required";
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

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    } else if (
      formData.dueDate < minimumDueDate ||
      formData.dueDate > maximumDueDate
    ) {
      errors.dueDate =
        "Due date must be within the current month or next month";
    }

    setFormErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  const getObligationRequestBody = () => {
    return {
      accountId: Number(formData.accountId),
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      name: formData.name.trim(),
      amount: Number(formData.amount),
      transactionType: formData.transactionType,
      dueDate: formData.dueDate,
    };
  };

  const handleCreateObligation = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch("/api/monthly-obligations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getObligationRequestBody()),
      });

      if (!response.ok) {
        throw new Error("Failed to create monthly obligation");
      }

      await fetchObligations();

      setDialogOpen(false);

      showSnackbar("Obligation created successfully");
    } catch (error) {
      console.error("Error creating monthly obligation:", error);

      showSnackbar("Failed to create obligation", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateObligation = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        `/api/monthly-obligations/${editingObligationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(getObligationRequestBody()),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update monthly obligation");
      }

      await fetchObligations();

      setDialogOpen(false);
      setEditingObligationId(null);

      showSnackbar("Obligation updated successfully");
    } catch (error) {
      console.error("Error updating monthly obligation:", error);

      showSnackbar("Failed to update obligation", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteObligation = async () => {
    if (!obligationToDelete) {
      return;
    }

    try {
      setDeleting(true);

      const response = await apiFetch(
        `/api/monthly-obligations/${obligationToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete monthly obligation");
      }

      setObligations((previousObligations) =>
        previousObligations.filter(
          (obligation) => obligation.id !== obligationToDelete.id,
        ),
      );

      setDeleteDialogOpen(false);
      setObligationToDelete(null);

      showSnackbar("Obligation deleted successfully");
    } catch (error) {
      console.error("Error deleting monthly obligation:", error);

      showSnackbar("Failed to delete obligation", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyToNextMonth = async () => {
    if (
      currentMonthObligations.length === 0 ||
      nextMonthObligations.length > 0
    ) {
      return;
    }

    try {
      setCopyingNextMonth(true);

      const response = await apiFetch(
        "/api/monthly-obligations/copy-next-month",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.message || "Failed to copy monthly obligations",
        );
      }

      await fetchObligations();

      showSnackbar("Next month's obligations created successfully");
    } catch (error) {
      console.error("Error copying monthly obligations:", error);

      showSnackbar(error.message || "Failed to copy obligations", "error");
    } finally {
      setCopyingNextMonth(false);
    }
  };

  const handleToggleCompletion = async (obligation, isCompleted) => {
    const obligationId = obligation.id;

    if (updatingObligationIds.includes(obligationId)) {
      return;
    }

    setUpdatingObligationIds((previousIds) => [...previousIds, obligationId]);

    setObligations((previousObligations) =>
      previousObligations.map((currentObligation) =>
        currentObligation.id === obligationId
          ? {
              ...currentObligation,
              is_completed: isCompleted,
            }
          : currentObligation,
      ),
    );

    try {
      const response = await apiFetch(
        `/api/monthly-obligations/${obligationId}/completion`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isCompleted,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update obligation completion");
      }

      const updatedObligation = await response.json();

      setObligations((previousObligations) =>
        previousObligations.map((currentObligation) =>
          currentObligation.id === obligationId
            ? {
                ...currentObligation,
                is_completed: updatedObligation.is_completed,
                completed_at: updatedObligation.completed_at,
              }
            : currentObligation,
        ),
      );
    } catch (error) {
      console.error("Error updating obligation completion:", error);

      setObligations((previousObligations) =>
        previousObligations.map((currentObligation) =>
          currentObligation.id === obligationId
            ? {
                ...currentObligation,
                is_completed: obligation.is_completed,
                completed_at: obligation.completed_at,
              }
            : currentObligation,
        ),
      );

      showSnackbar("Failed to update obligation", "error");
    } finally {
      setUpdatingObligationIds((previousIds) =>
        previousIds.filter((id) => id !== obligationId),
      );
    }
  };

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
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
            }}
          >
            Monthly Checklist
          </Typography>

          <Typography color="text.secondary">
            Track your monthly income and expense obligations.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            width: {
              xs: "100%",
              sm: "auto",
            },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add Obligation
        </Button>
      </Box>

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 4,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
          }}
        >
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Box>
          <MonthSection
            monthDate={currentMonthDate}
            obligations={currentMonthObligations}
            onToggleCompletion={handleToggleCompletion}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
            updatingObligationIds={updatingObligationIds}
          />

          <MonthSection
            monthDate={nextMonthDate}
            obligations={nextMonthObligations}
            onToggleCompletion={handleToggleCompletion}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
            updatingObligationIds={updatingObligationIds}
            showCopyButton={
              currentMonthObligations.length > 0 &&
              nextMonthObligations.length === 0
            }
            copySourceLabel={currentMonthDate.toLocaleDateString("en-US", {
              month: "long",
            })}
            onCopy={handleCopyToNextMonth}
            copying={copyingNextMonth}
          />
        </Box>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
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
          {editingObligationId ? "Edit Obligation" : "Add Obligation"}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
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
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            placeholder="e.g. Rent, Electricity, Paycheck"
            error={Boolean(formErrors.name)}
            helperText={formErrors.name}
          />

          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            fullWidth
            margin="normal"
            inputProps={{
              min: 0.01,
              step: 0.01,
            }}
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
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            fullWidth
            margin="normal"
            inputProps={{
              min: minimumDueDate,
              max: maximumDueDate,
            }}
            error={Boolean(formErrors.dueDate)}
            helperText={
              formErrors.dueDate ||
              "Due date must be within the current month or next month."
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
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
            onClick={handleCloseDialog}
            disabled={saving}
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
              editingObligationId
                ? handleUpdateObligation
                : handleCreateObligation
            }
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 140,
            }}
          >
            {saving
              ? "Saving..."
              : editingObligationId
                ? "Save Changes"
                : "Save Obligation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
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
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          Delete Obligation?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{obligationToDelete?.name}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteObligation}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((previousSnackbar) => ({
            ...previousSnackbar,
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
            setSnackbar((previousSnackbar) => ({
              ...previousSnackbar,
              open: false,
            }))
          }
          sx={{
            width: "100%",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MonthlyChecklist;
