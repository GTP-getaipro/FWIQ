/**
 * Email Analyzer UI Component
 * 
 * A comprehensive React component for analyzing email content,
 * displaying processing results, and managing email threads.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedEmailProcessor } from '../lib/advancedEmailProcessor';

const EmailAnalyzer = ({ 
  emailId = null, 
  userId, 
  onAnalysisComplete = () => {},
  onThreadUpdate = () => {},
  showThreadView = true,
  showAttachmentView = true,
  showPerformanceMetrics = true 
}) => {
  // State management
  const [emailData, setEmailData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [threadView, setThreadView] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Refs
  const analysisRef = useRef(null);
  const threadRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (emailId && userId) {
      loadEmailData();
    }
  }, [emailId, userId]);

  // Load email data and perform analysis
  const loadEmailData = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Simulate loading email data (in real implementation, fetch from API)
      const mockEmailData = {
        id: emailId,
        from: 'customer@example.com',
        to: 'support@business.com',
        subject: 'Urgent: Pool heater not working',
        body: 'Hi there,\n\nI have an urgent issue with my pool heater. It stopped working yesterday and I need someone to come out ASAP. The water is getting cold and I have guests coming this weekend.\n\nPlease call me at 555-123-4567 or email me back immediately.\n\nThanks,\nJohn Smith',
        htmlBody: '<p>Hi there,</p><p>I have an urgent issue with my pool heater...</p>',
        received_at: new Date().toISOString(),
        messageId: `msg_${Date.now()}`,
        attachments: [
          {
            name: 'pool_heater_photo.jpg',
            type: 'image',
            size: 1024000,
            url: '/attachments/pool_heater_photo.jpg'
          }
        ]
      };

      setEmailData(mockEmailData);

      // Perform advanced analysis
      const result = await advancedEmailProcessor.processEmail(mockEmailData, userId);
      setAnalysisResult(result);

      // Load performance metrics
      if (showPerformanceMetrics) {
        const metrics = advancedEmailProcessor.getPerformanceMetrics(userId);
        setPerformanceMetrics(metrics);
      }

      onAnalysisComplete(result);

    } catch (error) {
      console.error('Email analysis failed:', error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle thread view toggle
  const handleThreadViewToggle = () => {
    setThreadView(!threadView);
  };

  // Handle attachment selection
  const handleAttachmentSelect = (attachment) => {
    setSelectedAttachment(attachment);
    setActiveTab('attachments');
  };

  // Render overview tab
  const renderOverview = () => {
    if (!analysisResult) return null;

    const { advancedProcessing } = analysisResult;
    const { parsedData, threadInfo, attachmentData } = advancedProcessing || {};

    return (
      <div className="email-analyzer-overview">
        {/* Email Header */}
        <div className="email-header">
          <div className="email-meta">
            <div className="email-from">
              <strong>From:</strong> {emailData?.from}
            </div>
            <div className="email-to">
              <strong>To:</strong> {emailData?.to}
            </div>
            <div className="email-subject">
              <strong>Subject:</strong> {emailData?.subject}
            </div>
            <div className="email-date">
              <strong>Date:</strong> {new Date(emailData?.received_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="analysis-summary">
          <h3>Analysis Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Sentiment</div>
              <div className={`summary-value sentiment-${parsedData?.contentAnalysis?.sentiment?.primary || 'neutral'}`}>
                {parsedData?.contentAnalysis?.sentiment?.primary || 'neutral'}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Intent</div>
              <div className="summary-value">
                {parsedData?.contentAnalysis?.intent?.primary || 'general'}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Urgency</div>
              <div className={`summary-value urgency-${parsedData?.contentAnalysis?.urgency?.level || 'normal'}`}>
                {parsedData?.contentAnalysis?.urgency?.level || 'normal'}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Complexity</div>
              <div className="summary-value">
                {parsedData?.contentAnalysis?.complexity?.level || 'low'}
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="key-insights">
          <h3>Key Insights</h3>
          <div className="insights-list">
            {parsedData?.contentAnalysis?.keyPhrases?.slice(0, 5).map((phrase, index) => (
              <div key={index} className="insight-item">
                <span className="insight-phrase">{phrase.phrase}</span>
                <span className="insight-count">({phrase.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thread Information */}
        {threadInfo && (
          <div className="thread-info">
            <h3>Thread Information</h3>
            <div className="thread-details">
              <div className="thread-item">
                <strong>Thread ID:</strong> {threadInfo.threadId || 'New Thread'}
              </div>
              <div className="thread-item">
                <strong>Message Count:</strong> {threadInfo.messageCount}
              </div>
              <div className="thread-item">
                <strong>Participants:</strong> {threadInfo.participants?.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Attachments Summary */}
        {attachmentData && attachmentData.attachments?.length > 0 && (
          <div className="attachments-summary">
            <h3>Attachments</h3>
            <div className="attachments-list">
              {attachmentData.attachments.map((attachment, index) => (
                <div key={index} className="attachment-item" onClick={() => handleAttachmentSelect(attachment)}>
                  <div className="attachment-icon">📎</div>
                  <div className="attachment-info">
                    <div className="attachment-name">{attachment.name}</div>
                    <div className="attachment-meta">
                      {attachment.type} • {(attachment.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render content analysis tab
  const renderContentAnalysis = () => {
    if (!analysisResult?.advancedProcessing?.parsedData) return null;

    const parsedData = analysisResult.advancedProcessing.parsedData;

    return (
      <div className="email-analyzer-content">
        {/* Sentiment Analysis */}
        <div className="analysis-section">
          <h3>Sentiment Analysis</h3>
          <div className="sentiment-details">
            <div className="sentiment-score">
              <div className="score-label">Primary Sentiment</div>
              <div className={`score-value sentiment-${parsedData.contentAnalysis?.sentiment?.primary}`}>
                {parsedData.contentAnalysis?.sentiment?.primary}
              </div>
              <div className="score-confidence">
                Confidence: {parsedData.contentAnalysis?.sentiment?.confidence}%
              </div>
            </div>
            <div className="sentiment-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Positive:</span>
                <span className="breakdown-value">{parsedData.contentAnalysis?.sentiment?.scores?.positive || 0}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Negative:</span>
                <span className="breakdown-value">{parsedData.contentAnalysis?.sentiment?.scores?.negative || 0}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Neutral:</span>
                <span className="breakdown-value">{parsedData.contentAnalysis?.sentiment?.scores?.neutral || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intent Detection */}
        <div className="analysis-section">
          <h3>Intent Detection</h3>
          <div className="intent-details">
            <div className="intent-primary">
              <strong>Primary Intent:</strong> {parsedData.contentAnalysis?.intent?.primary}
            </div>
            <div className="intent-confidence">
              <strong>Confidence:</strong> {parsedData.contentAnalysis?.intent?.confidence}%
            </div>
            <div className="intent-scores">
              {Object.entries(parsedData.contentAnalysis?.intent?.scores || {}).map(([intent, score]) => (
                <div key={intent} className="intent-score">
                  <span className="intent-name">{intent}:</span>
                  <span className="intent-count">{score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Structure */}
        <div className="analysis-section">
          <h3>Content Structure</h3>
          <div className="structure-details">
            <div className="structure-item">
              <span className="structure-label">Word Count:</span>
              <span className="structure-value">{parsedData.body?.wordCount || 0}</span>
            </div>
            <div className="structure-item">
              <span className="structure-label">Paragraph Count:</span>
              <span className="structure-value">{parsedData.body?.paragraphCount || 0}</span>
            </div>
            <div className="structure-item">
              <span className="structure-label">Has Greeting:</span>
              <span className="structure-value">{parsedData.structure?.hasGreeting ? 'Yes' : 'No'}</span>
            </div>
            <div className="structure-item">
              <span className="structure-label">Has Signature:</span>
              <span className="structure-value">{parsedData.structure?.hasSignature ? 'Yes' : 'No'}</span>
            </div>
            <div className="structure-item">
              <span className="structure-label">Has Questions:</span>
              <span className="structure-value">{parsedData.structure?.hasQuestions ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Extracted Entities */}
        <div className="analysis-section">
          <h3>Extracted Entities</h3>
          <div className="entities-grid">
            {Object.entries(parsedData.entities || {}).map(([type, entities]) => (
              <div key={type} className="entity-group">
                <div className="entity-type">{type}</div>
                <div className="entity-list">
                  {entities.map((entity, index) => (
                    <span key={index} className="entity-item">{entity}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Readability Analysis */}
        <div className="analysis-section">
          <h3>Readability Analysis</h3>
          <div className="readability-details">
            <div className="readability-score">
              <div className="score-label">Readability Score</div>
              <div className="score-value">{parsedData.contentAnalysis?.readability?.score || 0}</div>
              <div className="score-level">{parsedData.contentAnalysis?.readability?.level || 'unknown'}</div>
            </div>
            <div className="readability-metrics">
              <div className="metric-item">
                <span className="metric-label">Avg Words per Sentence:</span>
                <span className="metric-value">{parsedData.contentAnalysis?.readability?.metrics?.avgWordsPerSentence || 0}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Avg Syllables per Word:</span>
                <span className="metric-value">{parsedData.contentAnalysis?.readability?.metrics?.avgSyllablesPerWord || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render thread view
  const renderThreadView = () => {
    if (!analysisResult?.advancedProcessing?.threadInfo) return null;

    const threadInfo = analysisResult.advancedProcessing.threadInfo;

    return (
      <div className="email-analyzer-thread">
        <div className="thread-header">
          <h3>Email Thread</h3>
          <div className="thread-meta">
            <span className="thread-id">Thread ID: {threadInfo.threadId || 'New Thread'}</span>
            <span className="message-count">{threadInfo.messageCount} messages</span>
          </div>
        </div>

        <div className="thread-participants">
          <h4>Participants</h4>
          <div className="participants-list">
            {threadInfo.participants?.map((participant, index) => (
              <div key={index} className="participant-item">
                {participant}
              </div>
            ))}
          </div>
        </div>

        <div className="thread-timeline">
          <h4>Timeline</h4>
          <div className="timeline-item current">
            <div className="timeline-marker current"></div>
            <div className="timeline-content">
              <div className="timeline-subject">{emailData?.subject}</div>
              <div className="timeline-meta">
                {emailData?.from} • {new Date(emailData?.received_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="thread-actions">
          <button className="btn btn-primary" onClick={() => setThreadView(false)}>
            View Full Thread
          </button>
          <button className="btn btn-secondary">
            Merge with Other Thread
          </button>
        </div>
      </div>
    );
  };

  // Render attachments view
  const renderAttachmentsView = () => {
    if (!analysisResult?.advancedProcessing?.attachmentData) return null;

    const attachmentData = analysisResult.advancedProcessing.attachmentData;

    return (
      <div className="email-analyzer-attachments">
        <div className="attachments-header">
          <h3>Email Attachments</h3>
          <div className="attachments-summary">
            {attachmentData.totalCount} attachments • {(attachmentData.totalSize / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>

        <div className="attachments-list">
          {attachmentData.attachments?.map((attachment, index) => (
            <div key={index} className="attachment-card" onClick={() => setSelectedAttachment(attachment)}>
              <div className="attachment-icon">
                {attachment.type === 'image' ? '🖼️' : 
                 attachment.type === 'document' ? '📄' : 
                 attachment.type === 'archive' ? '📦' : '📎'}
              </div>
              <div className="attachment-info">
                <div className="attachment-name">{attachment.name}</div>
                <div className="attachment-meta">
                  <span className="attachment-type">{attachment.type}</span>
                  <span className="attachment-size">{(attachment.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="attachment-status">
                  {attachment.securityScan?.isSafe ? '✅ Safe' : '⚠️ Security Warning'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedAttachment && (
          <div className="attachment-details">
            <h4>Attachment Details</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedAttachment.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedAttachment.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{(selectedAttachment.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Security:</span>
                <span className={`detail-value ${selectedAttachment.securityScan?.isSafe ? 'safe' : 'warning'}`}>
                  {selectedAttachment.securityScan?.isSafe ? 'Safe' : 'Warning'}
                </span>
              </div>
            </div>
            {selectedAttachment.securityScan?.threats?.length > 0 && (
              <div className="security-threats">
                <h5>Security Threats:</h5>
                <ul>
                  {selectedAttachment.securityScan.threats.map((threat, index) => (
                    <li key={index} className="threat-item">{threat}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!performanceMetrics) return null;

    return (
      <div className="email-analyzer-performance">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Emails Processed</div>
            <div className="metric-value">{performanceMetrics.totalEmails}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Average Processing Time</div>
            <div className="metric-value">{performanceMetrics.averageProcessingTime.toFixed(0)}ms</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Processing Time</div>
            <div className="metric-value">{(performanceMetrics.totalProcessingTime / 1000).toFixed(1)}s</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Last Processed</div>
            <div className="metric-value">
              {performanceMetrics.lastProcessed ? 
                new Date(performanceMetrics.lastProcessed).toLocaleString() : 
                'Never'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isAnalyzing) {
    return (
      <div className="email-analyzer-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing email content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-analyzer-error">
        <div className="error-icon">❌</div>
        <h3>Analysis Failed</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadEmailData}>
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="email-analyzer">
      {/* Header */}
      <div className="email-analyzer-header">
        <h2>Email Analysis</h2>
        <div className="analyzer-actions">
          {showThreadView && (
            <button 
              className={`btn ${threadView ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleThreadViewToggle}
            >
              {threadView ? 'Hide Thread' : 'Show Thread'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadEmailData}>
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="email-analyzer-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => handleTabChange('content')}
        >
          Content Analysis
        </button>
        {showAttachmentView && (
          <button 
            className={`tab ${activeTab === 'attachments' ? 'active' : ''}`}
            onClick={() => handleTabChange('attachments')}
          >
            Attachments
          </button>
        )}
        {showPerformanceMetrics && (
          <button 
            className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => handleTabChange('performance')}
          >
            Performance
          </button>
        )}
      </div>

      {/* Content */}
      <div className="email-analyzer-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'content' && renderContentAnalysis()}
        {activeTab === 'attachments' && renderAttachmentsView()}
        {activeTab === 'performance' && renderPerformanceMetrics()}
      </div>

      {/* Thread View Sidebar */}
      {threadView && (
        <div className="email-analyzer-sidebar">
          {renderThreadView()}
        </div>
      )}
    </div>
  );
};

export default EmailAnalyzer;
