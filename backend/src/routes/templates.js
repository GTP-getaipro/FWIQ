import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GET /api/templates/gmail
 * Serve Gmail workflow template
 */
router.get('/gmail', async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../../public/templates/gmail-workflow-template.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    res.json(template);
  } catch (error) {
    logger.error('Failed to load Gmail template:', error);
    res.status(500).json({ error: 'Failed to load Gmail template' });
  }
});

/**
 * GET /api/templates/outlook
 * Serve Outlook workflow template
 */
router.get('/outlook', async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../../public/templates/outlook-workflow-template.json');
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    res.json(template);
  } catch (error) {
    logger.error('Failed to load Outlook template:', error);
    res.status(500).json({ error: 'Failed to load Outlook template' });
  }
});

export default router;
