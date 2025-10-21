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
    // Path resolution for Docker container: backend/src/routes -> backend/templates
    const templatePath = path.join(__dirname, '../../templates/gmail-workflow-template.json');
    
    logger.info('Loading Gmail template from:', templatePath);
    logger.info('Current __dirname:', __dirname);
    logger.info('Resolved path:', path.resolve(templatePath));
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      logger.error('Gmail template file not found at:', templatePath);
      logger.error('Directory contents:', fs.readdirSync(path.join(__dirname, '../../templates')).join(', '));
      return res.status(404).json({ error: 'Gmail template file not found' });
    }
    
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    logger.info('Gmail template loaded successfully, nodes count:', template.nodes?.length || 0);
    res.json(template);
  } catch (error) {
    logger.error('Failed to load Gmail template:', error);
    res.status(500).json({ error: 'Failed to load Gmail template', details: error.message });
  }
});

/**
 * GET /api/templates/outlook
 * Serve Outlook workflow template
 */
router.get('/outlook', async (req, res) => {
  try {
    // Path resolution for Docker container: backend/src/routes -> backend/templates
    const templatePath = path.join(__dirname, '../../templates/outlook-workflow-template.json');
    
    logger.info('Loading Outlook template from:', templatePath);
    logger.info('Current __dirname:', __dirname);
    logger.info('Resolved path:', path.resolve(templatePath));
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      logger.error('Outlook template file not found at:', templatePath);
      logger.error('Directory contents:', fs.readdirSync(path.join(__dirname, '../../templates')).join(', '));
      return res.status(404).json({ error: 'Outlook template file not found' });
    }
    
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    logger.info('Outlook template loaded successfully, nodes count:', template.nodes?.length || 0);
    res.json(template);
  } catch (error) {
    logger.error('Failed to load Outlook template:', error);
    res.status(500).json({ error: 'Failed to load Outlook template', details: error.message });
  }
});

export default router;
