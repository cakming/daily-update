import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { startScheduler } from './services/scheduler.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Start scheduler service
startScheduler();

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
