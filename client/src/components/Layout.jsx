import {
  AppBar,
  Box,
  Drawer,
  IconButton,
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

import MenuIcon from "@mui/icons-material/Menu";

import LogoutIcon from "@mui/icons-material/Logout";

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import { useState } from "react";

const drawerWidth = 240;

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };
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

  const navItemStyles = (path) => ({
    borderRadius: 2,
    mb: 0.5,
    px: 2,
    minHeight: 48,

    ...(location.pathname === path && {
      backgroundColor: "primary.main",
      color: "primary.contrastText",

      "& .MuiListItemIcon-root": {
        color: "primary.contrastText",
      },

      "&:hover": {
        backgroundColor: "primary.dark",
      },
    }),

    ...(location.pathname !== path && {
      "&:hover": {
        backgroundColor: "action.hover",
      },
    }),
  });

  //container for the drawer content
  const drawerContent = (
    <>
      <Toolbar />

      <List sx={{ pt: 2 }}>
        <ListItemButton
          component={Link}
          to="/dashboard"
          sx={navItemStyles("/dashboard")}
          onClick={() => setMobileOpen(false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardIcon />
          </ListItemIcon>

          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              fontWeight: 600,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/accounts"
          sx={navItemStyles("/accounts")}
          onClick={() => setMobileOpen(false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <AccountBalanceWallet />
          </ListItemIcon>

          <ListItemText
            primary="Accounts"
            primaryTypographyProps={{
              fontWeight: 600,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/transactions"
          sx={navItemStyles("/transactions")}
          onClick={() => setMobileOpen(false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ReceiptLong />
          </ListItemIcon>

          <ListItemText
            primary="Transactions"
            primaryTypographyProps={{
              fontWeight: 600,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/budgets"
          sx={navItemStyles("/budgets")}
          onClick={() => setMobileOpen(false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Savings />
          </ListItemIcon>

          <ListItemText
            primary="Budgets"
            primaryTypographyProps={{
              fontWeight: 600,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/investments"
          sx={navItemStyles("/investments")}
          onClick={() => setMobileOpen(false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <TrendingUp />
          </ListItemIcon>

          <ListItemText
            primary="Investments"
            primaryTypographyProps={{
              fontWeight: 600,
            }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={async () => {
            setMobileOpen(false);
            await handleLogout();
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>

          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontWeight: 600,
            }}
          />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
            }}
            aria-label="open navigation menu"
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              mr: 1.5,
            }}
          >
            F
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            FinTrack
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "background.paper",
            px: 1.5,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: "none", md: "block" },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
            px: 1.5,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: "100vh",
          backgroundColor: "#f7f9fc",
        }}
      >
        <Toolbar />

        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
