import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { consentRouter } from './routes/consentRoutes.js';
import { transactionRouter } from './routes/transactionRoutes.js';
import { financialRouter } from './routes/financialRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Permissive CORS for seamless Vercel frontend connectivity
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/consent', consentRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/analytics', financialRouter);
app.use('/api/ai', aiRouter);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FinPulse AI Server | API Status</title>
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #090d16;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 20px;
          padding: 36px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.3);
          margin-bottom: 20px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        h1 { margin: 0 0 10px; font-size: 24px; color: #fff; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
        .btn {
          display: inline-block;
          background: #059669;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3);
          transition: background 0.2s;
        }
        .btn:hover { background: #10b981; }
        .endpoints {
          margin-top: 28px;
          border-top: 1px solid #1e293b;
          padding-top: 20px;
        }
        .endpoints h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px; }
        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #1e293b;
          border-radius: 8px;
          margin-bottom: 8px;
          font-family: monospace;
          font-size: 12px;
        }
        .method { color: #38bdf8; font-weight: bold; }
        .link { color: #a7f3d0; text-decoration: none; }
        .link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">
          <span class="dot"></span>
          Backend API is Active & Healthy
        </div>
        <h1>FinPulse AI Financial Advisory Engine</h1>
        <p>
          The Express backend server is actively running on <strong>Port 5000</strong> with Indian Rupee (₹) telemetry and user consent enforcement.
        </p>

        <a href="http://localhost:5173" class="btn">
          👉 Open FinPulse Web App (Port 5173)
        </a>

        <div class="endpoints">
          <h3>Active REST API Endpoints</h3>
          <div class="item">
            <span><span class="method">GET</span> /api/health</span>
            <a class="link" href="/api/health" target="_blank">Test JSON &rarr;</a>
          </div>
          <div class="item">
            <span><span class="method">GET</span> /api/analytics/budget</span>
            <a class="link" href="/api/analytics/budget" target="_blank">View 50/30/20 &rarr;</a>
          </div>
          <div class="item">
            <span><span class="method">GET</span> /api/analytics/investments</span>
            <a class="link" href="/api/analytics/investments" target="_blank">View Indian SIPs &rarr;</a>
          </div>
          <div class="item">
            <span><span class="method">GET</span> /api/consent</span>
            <a class="link" href="/api/consent" target="_blank">View Consent State &rarr;</a>
          </div>
          <div class="item">
            <span><span class="method">GET</span> /api/transactions</span>
            <a class="link" href="/api/transactions" target="_blank">View Ledger &rarr;</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FinPulse AI Server',
    currency: 'INR (₹)',
    market: 'India',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 FinPulse AI server is running on http://localhost:${PORT}`);
  console.log(`🔒 Consent-first financial advisor engine active`);
});
