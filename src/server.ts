// src/server.ts
import './loadEnv'; // Load environment variables FIRST!

import mongoose from 'mongoose';
import http from 'http'; // Import http module for server creation

import config from './config/index.js';
// Import the configured app instance instead of defining it here
import { app } from './app.js'; 

// ======================================== 
// Database Connection
// ======================================== 
mongoose
  .connect(config.database.mongodbUri)
  .then(() => console.log('MongoDB connection successful!'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Exit process if cannot connect to DB
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error after initial connection: ${err}`);
});

// ======================================== 
// Start Server
// ======================================== 
const PORT = config.port;
// Create server instance from the imported app
const server: http.Server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${config.nodeEnv} mode.`);
});

// ======================================== 
// Unhandled Rejection / Uncaught Exception Handling
// ======================================== 
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  // Gracefully close server then exit
  server.close(() => {
    console.log('Server closed due to unhandled rejection.');
    // Close DB connection as well before exiting
    mongoose.connection.close(false)
      .then(() => {
          console.log('MongoDB connection closed on unhandled rejection.');
          process.exit(1);
      })
      .catch((dbErr) => {
          console.error('Error closing MongoDB connection on unhandled rejection:', dbErr);
          process.exit(1);
      });
  });
});

process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  // Gracefully close server then exit (sync error, exit immediately after close)
  server.close(() => {
    console.log('Server closed due to uncaught exception.');
     mongoose.connection.close(false)
      .then(() => {
          console.log('MongoDB connection closed on uncaught exception.');
          process.exit(1); // Exit after attempting to close DB
       })
      .catch((dbErr) => {
           console.error('Error closing MongoDB connection on uncaught exception:', dbErr);
           process.exit(1); // Exit even if DB close fails
      });
  });
  // If server close fails or takes too long, force exit after a delay
  setTimeout(() => {
        console.error("Could not close server gracefully after uncaught exception, forcing exit.");
        process.exit(1);
    }, 10000).unref(); // 10 seconds timeout
});


// --- Graceful Shutdown ---
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
       // Attempt DB close anyway
       mongoose.connection.close(false)
          .catch((dbErr) => console.error('Error closing MongoDB connection during failed server shutdown:', dbErr))
          .finally(() => process.exit(1)); // Exit regardless of DB close outcome
    } else {
      mongoose.connection.close(false)
        .then(() => {
          console.log('MongoDB connection closed.');
          process.exit(0); // Success
        })
        .catch((dbErr) => {
          console.error('Error closing MongoDB connection during shutdown:', dbErr);
          process.exit(1); // Failure
        });
    }
  });
   // Force exit if shutdown takes too long
    setTimeout(() => {
        console.error("Graceful shutdown timed out, forcing exit.");
        process.exit(1);
    }, 15000).unref(); // 15 seconds timeout
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export the server instance *only if* needed elsewhere, usually not required
// export { server };
