import express from 'express';
import cors from 'cors';
import pool from './db/db.js';
import accountRoutes from './routes/accountRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors({origin : 'http://localhost:5173'})); // Allow requests from the frontend
app.use('/api/accounts', accountRoutes); // Use account routes
app.use('/api/categories', categoryRoutes); // Use category routes
app.use('/api/transactions', transactionRoutes); // Use transaction routes
app.use('/api/budgets', budgetRoutes); // Use budget routes
app.use('/api/dashboard', dashboardRoutes); // Use dashboard routes
app.use('/api/investments', investmentRoutes); // Use investment routes


app.get('/', (req, res) => {
  res.send('FinTrack API is running');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FinTrack API is running'
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      status: 'ok',
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});