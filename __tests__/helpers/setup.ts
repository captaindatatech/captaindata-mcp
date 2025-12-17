import dotenv from 'dotenv';

// Load environment variables for all tests
dotenv.config();

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  process.env.CD_API_BASE = process.env.CD_API_BASE || 'https://api.captaindata.com';
});

afterAll(() => {
  // Clean up any global test state
});
