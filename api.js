/**
 * API Server for TheAgency Discord Bot
 *
 * This file sets up an Express server that provides API endpoints
 * to access bot data, particularly the economy leaderboard.
 *
 * Railway-optimized version with open CORS for initial deployment
 */

// Required dependencies
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;

// Import your economy utility that contains database functions
const economy = require("./utils/economy");

// Security enhancements with helmet (with some relaxed settings for development)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for development/testing
  })
);

// Rate limiting to prevent abuse - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs for development
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Configure CORS - allow all origins for initial deployment
app.use(
  cors({
    origin: "*", // Allow all origins for initial deployment
    methods: ["GET"],
    credentials: false,
  })
);

// Enhanced logging with Railway-friendly format
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, url, ip } = req;
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log response when finished
  res.on("finish", () => {
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode}`);
  });

  next();
});

// Basic security measures
app.use((req, res, next) => {
  // Set security headers (in addition to helmet)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // API key authentication (optional for initial testing)

  next();
});

/**
 * Leaderboard Endpoint
 * Returns the top users ranked by currency balance
 *
 * GET /api/leaderboard?limit=5
 * Optional query param: limit (number of users to return, default: 5)
 */
app.get("/api/leaderboard", async (req, res) => {
  try {
    // Get optional limit parameter (default: 5)
    const limit = parseInt(req.query.limit) || 5;

    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

    // Get top users from the database (using the same economy utility your bot uses)
    const leaderboard = await economy.getLeaderboard(limit);

    // Format the data to match what the website expects
    const formattedData = leaderboard.map((entry) => ({
      username: entry.username,
      balance: entry.balance || 0,
    }));

    // Add cache control for better performance
    res.set("Cache-Control", "public, max-age=60"); // Cache for 60 seconds
    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard data" });
  }
});

/**
 * User Balance Endpoint
 * Returns the balance for a specific user
 *
 * GET /api/user/:userId/balance
 */
app.get("/api/user/:userId/balance", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate userId format
    if (!/^\d{17,19}$/.test(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Get user balance from database with better error handling
    let balance = 0;
    let username = null;

    try {
      balance = await economy.getBalance(userId);
      username = await economy.getUsername(userId);
    } catch (err) {
      console.error("Error retrieving user data:", err);
    }

    // Cache individual user data for a short time
    res.set("Cache-Control", "public, max-age=30"); // Cache for 30 seconds
    res.json({
      userId,
      username,
      balance,
    });
  } catch (error) {
    console.error("Error fetching user balance:", error);
    res.status(500).json({ error: "Failed to fetch user balance" });
  }
});

// Health check endpoint - important for Railway monitoring
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.2",
    environment: process.env.NODE_ENV || "development",
    platform: "Railway",
    uptime: process.uptime() + " seconds",
  });
});

app.get("/api/secret/ANONPO", (req, res) => {
  res.json({
    secret: "ZDRAW21",
  });
});
// Add a test data endpoint for debugging
app.get("/api/test", (req, res) => {
  res.json([
    { username: "GoldKing", balance: 58422 },
    { username: "EliteTrader", balance: 42315 },
    { username: "RichKnight", balance: 36789 },
    { username: "JasonCasher", balance: 25689 },
    { username: "TreasureHunter", balance: 8470 },
  ]);
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Export the app for potential use in the main bot file
module.exports = app;

// Start the API server if this file is run directly
if (require.main === module) {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`TheAgency API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`CORS: Allowing all origins`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  });

  // Graceful shutdown for better Railway compatibility
  const shutdown = () => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });

    // Force close if graceful shutdown fails
    setTimeout(() => {
      console.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

/**
 * Error handling for unhandled exceptions
 * Prevents the API server from crashing if an error occurs
 */
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
