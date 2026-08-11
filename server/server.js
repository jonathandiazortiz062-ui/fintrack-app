import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors({origin : 'http://localhost:5173'})); // Allow requests from the frontend

// Sample route
app.get('/', (req, res) => {
  res.send('FinTrack API is running');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FinTrack API is running'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});