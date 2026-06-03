import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { explainQuestion } from './controllers/aiController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'AdaptiveNEET AI Gateway' });
});

// AI Explanation endpoint
app.post('/api/explain', explainQuestion);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error in Server:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AdaptiveNEET AI Gateway running on port ${PORT}`);
});
