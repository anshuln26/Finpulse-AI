import { Router } from 'express';
import { db } from '../db/database.js';

export const consentRouter = Router();

consentRouter.get('/', (req, res) => {
  const consent = db.getConsent();
  res.json({ success: true, consent });
});

consentRouter.put('/', (req, res) => {
  const updated = db.updateConsent(req.body);
  res.json({ success: true, consent: updated });
});

consentRouter.post('/wipe', (req, res) => {
  db.wipeUserData();
  res.json({
    success: true,
    message: 'All personal financial data erased and consent revoked successfully.',
  });
});

consentRouter.post('/reset-demo', (req, res) => {
  db.resetDemoData();
  res.json({
    success: true,
    message: 'Demo financial data and consent restored successfully.',
  });
});
