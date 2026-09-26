import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { db } from '../db/database.js';
import { SpendingCategory, Transaction } from '../types.js';

export const transactionRouter = Router();
const upload = multer({ dest: 'uploads/' });

// GET all transactions
transactionRouter.get('/', (req, res) => {
  const consent = db.getConsent();
  if (!consent.shareTransactions) {
    return res.json({
      success: true,
      transactions: [],
      consentNotice: 'Transaction sharing is paused by user consent.',
    });
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const transactions = db.getTransactions(limit);
  res.json({ success: true, transactions });
});

// POST add transaction
transactionRouter.post('/', (req, res) => {
  const { date, description, source, amount, type, category, paymentMethod, notes } = req.body;

  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'Description/Source, amount, and category are required' });
  }

  const newTx = db.addTransaction({
    date: date || new Date().toISOString().split('T')[0],
    description,
    source: source || (type === 'income' ? description : undefined),
    amount: Number(amount),
    type: type === 'income' ? 'income' : 'expense',
    category: category as SpendingCategory,
    paymentMethod: paymentMethod || (type === 'income' ? 'Direct Bank Transfer (NEFT / IMPS)' : 'UPI'),
    notes: notes || '',
  });

  res.status(201).json({ success: true, transaction: newTx });
});

// DELETE transaction
transactionRouter.delete('/:id', (req, res) => {
  const deleted = db.deleteTransaction(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json({ success: true, message: 'Transaction deleted' });
});

// POST CSV upload for bank statements
transactionRouter.post('/csv-upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file provided' });
  }

  const results: Omit<Transaction, 'id'>[] = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize column names
      const keys = Object.keys(data).reduce((acc: Record<string, string>, k) => {
        acc[k.trim().toLowerCase()] = data[k];
        return acc;
      }, {});

      const desc = keys['description'] || keys['narrative'] || keys['details'] || keys['title'] || 'Transaction';
      const rawAmt = keys['amount'] || keys['debit'] || keys['credit'] || '0';
      const parsedAmt = Math.abs(parseFloat(rawAmt.replace(/[^0-9.-]+/g, '')) || 0);

      if (parsedAmt > 0) {
        let type: 'expense' | 'income' = 'expense';
        if (keys['type']?.toLowerCase() === 'income' || keys['credit']) {
          type = 'income';
        }

        const rawCat = keys['category'] || 'Other';
        let category: SpendingCategory = 'Other';

        // Auto-categorize heuristic if not provided or Other
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('rent') || lowerDesc.includes('housing')) category = 'Housing';
        else if (lowerDesc.includes('food') || lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('market') || lowerDesc.includes('restaurant')) category = 'Food & Dining';
        else if (lowerDesc.includes('uber') || lowerDesc.includes('metro') || lowerDesc.includes('fuel') || lowerDesc.includes('petrol')) category = 'Transportation';
        else if (lowerDesc.includes('electricity') || lowerDesc.includes('wifi') || lowerDesc.includes('water') || lowerDesc.includes('bill')) category = 'Utilities';
        else if (lowerDesc.includes('movie') || lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('prime')) category = 'Entertainment';
        else if (lowerDesc.includes('pharmacy') || lowerDesc.includes('hospital') || lowerDesc.includes('clinic')) category = 'Healthcare';
        else if (lowerDesc.includes('amazon') || lowerDesc.includes('flipkart') || lowerDesc.includes('shopping') || lowerDesc.includes('myntra')) category = 'Shopping';
        else if (lowerDesc.includes('sip') || lowerDesc.includes('mutual') || lowerDesc.includes('nifty') || lowerDesc.includes('zerodha') || lowerDesc.includes('groww')) category = 'Investment';
        else if (lowerDesc.includes('emi') || lowerDesc.includes('loan')) category = 'Debt & Loans';
        else if (lowerDesc.includes('sub') || lowerDesc.includes('membership')) category = 'Subscriptions';

        results.push({
          date: keys['date'] || new Date().toISOString().split('T')[0],
          description: desc,
          amount: parsedAmt,
          type,
          category,
          paymentMethod: 'Bank Transfer',
          notes: 'Imported via CSV Bank Statement',
        });
      }
    })
    .on('end', () => {
      // Clean up uploaded temp file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // ignore
      }

      const imported = db.importTransactions(results);
      res.json({
        success: true,
        count: imported.length,
        transactions: imported,
      });
    })
    .on('error', (err) => {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
      res.status(500).json({ error: 'Failed to process CSV file', details: err.message });
    });
});
