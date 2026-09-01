import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet,
  ReceiptLong,
  Savings,
  TrendingUp,
} from "@mui/icons-material";

import LogoutIcon from "@mui/icons-material/Logout";

import { Link, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

const drawerWidth = 240;

function Layout() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const response = await apiFetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to log out");
      }

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6">FinTrack</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />

        <List>
          <ListItemButton component={Link} to="/">
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>

            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton component={Link} to="/accounts">
            <ListItemIcon>
              <AccountBalanceWallet />
            </ListItemIcon>

            <ListItemText primary="Accounts" />
          </ListItemButton>

          <ListItemButton component={Link} to="/transactions">
            <ListItemIcon>
              <ReceiptLong />
            </ListItemIcon>

            <ListItemText primary="Transactions" />
          </ListItemButton>

          <ListItemButton component={Link} to="/budgets">
            <ListItemIcon>
              <Savings />
            </ListItemIcon>

            <ListItemText primary="Budgets" />
          </ListItemButton>

          <ListItemButton component={Link} to="/investments">
            <ListItemIcon>
              <TrendingUp />
            </ListItemIcon>

            <ListItemText primary="Investments" />
          </ListItemButton>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
        }}
      >
        <Toolbar />

        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
