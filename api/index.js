// Vercel serverless function handler
// This file is the entry point for all requests on Vercel
// It imports the compiled Express app from dist/app.js

let app;

try {
  console.log('Loading Express app from dist/app.js...');
  
  // Load the Express app
  // When TypeScript compiles with module: "commonjs", default exports become module.exports.default
  const appModule = require('../dist/app.js');
  console.log('App module loaded, type:', typeof appModule);
  console.log('App module keys:', Object.keys(appModule));
  
  app = appModule.default || appModule;
  console.log('App extracted, type:', typeof app);
  
  // Verify that we got a valid Express app
  if (!app || typeof app !== 'function') {
    const errorMsg = `Failed to load Express app. Expected a function but got: ${typeof app}. Module type: ${typeof appModule}, has default: ${!!appModule.default}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log('✅ Express app loaded successfully');
} catch (error) {
  console.error('❌ Error loading Express app:', error);
  console.error('Error stack:', error.stack);
  
  // Create a minimal error handler app as fallback
  const express = require('express');
  const fallbackApp = express();
  
  fallbackApp.use((req, res) => {
    // In production, still show error message but not stack
    // This helps with debugging while maintaining security
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: error.message || 'Unknown error during server initialization',
      // Show more details in non-production or if explicitly enabled
      details: !isProduction ? {
        type: error.constructor.name,
        stack: error.stack
      } : {
        hint: 'Check Vercel function logs for full error details. Common issues: missing environment variables (MONGODB_URI, JWT_SECRET), missing dependencies, or module loading errors.'
      }
    });
  });
  
  app = fallbackApp;
}

// Export the Express app for Vercel's @vercel/node runtime
// Vercel will automatically wrap this in a serverless function handler
module.exports = app;

