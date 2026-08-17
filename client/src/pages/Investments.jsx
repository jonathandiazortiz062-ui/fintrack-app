import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import AddIcon from "@mui/icons-material/Add";

//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well.
// This will make our code more maintainable and easier to read.

import { useEffect, useState } from "react";

function Investments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "",
    purchasePrice: "",
  });

  const [editingInvestmentId, setEditingInvestmentId] = useState(null);

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

    setOpen(true);
  };

  const handleEditInvestment = (investment) => {
    setEditingInvestmentId(investment.id);

    setFormData({
      symbol: investment.symbol,
      quantity: investment.quantity,
      purchasePrice: investment.purchase_price,
    });

    setOpen(true);
  };

  //CRUD:
  const handleCreateInvestment = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/investments`,
        {
          method: "POST",

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

        throw new Error(errorData.message || "Failed to create investment");
      }

      await fetchInvestments();

      setFormData({
        symbol: "",
        quantity: "",
        purchasePrice: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error creating investment:", error);
    }
  };

  const handleUpdateInvestment = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/investments/${editingInvestmentId}`,
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
    } catch (error) {
      console.error("Error updating investment:", error);
    }
  };

  const handleDeleteInvestment = async (investmentId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/investments/${investmentId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to delete investment");
      }

      setInvestments((prev) =>
        prev.filter((investment) => investment.id !== investmentId),
      );
    } catch (error) {
      console.error("Error deleting investment:", error);
    }
  };

  const fetchInvestments = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/investments`,
    );

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
    return <Typography>Loading investments...</Typography>;
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
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">Investments</Typography>

          <Typography color="text.secondary">
            Track your investment holdings
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Investment
        </Button>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
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
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Invested
              </Typography>

              <Typography variant="h5">${totalInvested.toFixed(2)}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Value
              </Typography>

              <Typography variant="h5">
                ${totalCurrentValue.toFixed(2)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Gain / Loss
              </Typography>

              <Typography
                variant="h5"
                color={totalGainLoss >= 0 ? "success" : "error"}
              >
                {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toFixed(2)}
                {" ("}
                {totalGainLossPercent >= 0 ? "+" : ""}
                {totalGainLossPercent.toFixed(2)}%{")"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      {investments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Investments
            </Typography>

            <Typography color="text.secondary">
              No investments have been added yet.
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
          {investments.map((investment) => (
            <Card key={investment.id}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography variant="h6">{investment.symbol}</Typography>

                    <Typography color="text.secondary">Quantity</Typography>

                    <Typography variant="body1">
                      {Number(investment.quantity)}
                    </Typography>
                  </Box>

                  <Box>
                    <IconButton
                      onClick={() => handleEditInvestment(investment)}
                      aria-label="edit investment"
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      onClick={() => handleDeleteInvestment(investment.id)}
                      aria-label="delete investment"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>

                    <Typography>{Number(investment.quantity)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Purchase Price
                    </Typography>

                    <Typography>
                      ${Number(investment.purchase_price).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cost Basis
                    </Typography>

                    <Typography>
                      ${Number(investment.cost_basis).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Price
                    </Typography>

                    <Typography>
                      {investment.market_data_available
                        ? `$${Number(investment.current_price).toFixed(2)}`
                        : "Unavailable"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Value
                    </Typography>

                    <Typography>
                      {investment.market_data_available
                        ? `$${Number(investment.current_value).toFixed(2)}`
                        : "Unavailable"}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Gain / Loss
                  </Typography>

                  {investment.market_data_available ? (
                    <Typography
                      variant="h6"
                      color={
                        Number(investment.gain_loss) >= 0 ? "success" : "error"
                      }
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
                        mt: 1,
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
      >
        <DialogTitle>
          {editingInvestmentId ? "Edit Investment" : "Add Investment"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Purchase Price"
            name="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={
              editingInvestmentId
                ? handleUpdateInvestment
                : handleCreateInvestment
            }
          >
            {editingInvestmentId ? "Save Changes" : "Save Investment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Investments;
