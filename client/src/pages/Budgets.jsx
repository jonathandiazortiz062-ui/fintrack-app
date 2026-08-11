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

function Budgets() {
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
            Budgets
          </Typography>

          <Typography color="text.secondary">
            Set monthly spending limits
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Budget
        </Button>
      </Box>

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
    </Box>
  );
}

export default Budgets;