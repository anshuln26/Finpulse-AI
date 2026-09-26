import { Router } from 'express';
import { AIAdvisorService } from '../services/aiAdvisor.js';

export const aiRouter = Router();

aiRouter.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message string is required' });
  }

  try {
    const result = await AIAdvisorService.chat(message, history || []);
    res.json({
      success: true,
      reply: result.response,
      consentFiltered: result.consentFiltered,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process AI chat', details: err.message });
  }
});

aiRouter.get('/insights', async (req, res) => {
  try {
    const insights = await AIAdvisorService.generateQuickInsights();
    res.json({ success: true, insights });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate insights', details: err.message });
  }
});
