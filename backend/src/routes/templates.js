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
    // Fix path resolution - go up from backend/src/routes to project root
    const templatePath = path.join(__dirname, '../../../public/templates/gmail-workflow-template.json');
    
    logger.info('Loading Gmail template from:', templatePath);
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      logger.error('Gmail template file not found at:', templatePath);
      return res.status(404).json({ error: 'Gmail template file not found' });
    }
    
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    logger.info('Gmail template loaded successfully, nodes count:', template.nodes?.length || 0);
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
    // Fix path resolution - go up from backend/src/routes to project root
    const templatePath = path.join(__dirname, '../../../public/templates/outlook-workflow-template.json');
    
    logger.info('Loading Outlook template from:', templatePath);
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      logger.error('Outlook template file not found at:', templatePath);
      return res.status(404).json({ error: 'Outlook template file not found' });
    }
    
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    logger.info('Outlook template loaded successfully, nodes count:', template.nodes?.length || 0);
    res.json(template);
  } catch (error) {
    logger.error('Failed to load Outlook template:', error);
    res.status(500).json({ error: 'Failed to load Outlook template' });
  }
});

export default router;
