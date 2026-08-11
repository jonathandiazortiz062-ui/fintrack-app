import {
  Box,
  Button,
  Card,
  CardContent,
  Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';


//We are using the same layout for all of our pages, so we can just copy and paste the code from the Budgets page and change the text to match the Investments page. However,
// we will create reusable components for the cards, buttons, and other UI elements so that we can use them on other pages as well. 
// This will make our code more maintainable and easier to read.

function Investments() {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4">
            Investments
          </Typography>

          <Typography color="text.secondary">
            Track your investment holdings
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Investment
        </Button>
      </Box>

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
    </Box>
  );
}

export default Investments;