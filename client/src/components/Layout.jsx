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
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet,
  ReceiptLong,
  Savings,
  TrendingUp,
} from '@mui/icons-material';

import { Link, Outlet } from 'react-router-dom';

const drawerWidth = 240;

function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>

      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6">
            FinTrack
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
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