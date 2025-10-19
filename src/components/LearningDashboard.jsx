/**
 * Learning Dashboard Component for FloWorx
 * Displays AI learning progress and style insights
 */

import React, { useState, useEffect } from 'react';
import { learningLoop } from '../lib/learningLoop.js';
import { comparisonAnalyzer } from '../lib/comparisonAnalyzer.js';
import { styleUpdater } from '../lib/styleUpdater.js';
import { logger } from '../lib/logger.js';

export const LearningDashboard = ({ userId }) => {
  const [learningStats, setLearningStats] = useState(null);
  const [analysisStats, setAnalysisStats] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadLearningData();
    }
  }, [userId]);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load learning statistics
      const stats = await learningLoop.getLearningStatistics(userId);
      setLearningStats(stats);

      // Load analysis statistics
      const analysis = await comparisonAnalyzer.getAnalysisStatistics(userId);
      setAnalysisStats(analysis);

      // Load pending updates
      const updates = styleUpdater.getPendingUpdatesStats();
      setPendingUpdates(updates);

      logger.info('Learning dashboard data loaded', { userId });
    } catch (err) {
      logger.error('Failed to load learning dashboard data', err, { userId });
      setError('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadLearningData();
  };

  if (loading) {
    return (
      <div className="learning-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading learning data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-dashboard">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={refreshData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-dashboard">
      <div className="dashboard-header">
        <h2>AI Learning Dashboard</h2>
        <button onClick={refreshData} className="refresh-button">
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        {/* Learning Statistics */}
        <div className="stat-card">
          <h3>Learning Progress</h3>
          <div className="stat-item">
            <span className="stat-label">Total Comparisons:</span>
            <span className="stat-value">{learningStats?.totalComparisons || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Similarity:</span>
            <span className="stat-value">
              {learningStats?.averageSimilarity ? 
                `${(learningStats.averageSimilarity * 100).toFixed(1)}%` : 
                'N/A'
              }
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Categories Learned:</span>
            <span className="stat-value">{Object.keys(learningStats?.categories || {}).length}</span>
          </div>
        </div>

        {/* Analysis Statistics */}
        <div className="stat-card">
          <h3>Analysis Status</h3>
          <div className="stat-item">
            <span className="stat-label">Analyzed:</span>
            <span className="stat-value">
              {analysisStats?.analyzedComparisons || 0} / {analysisStats?.totalComparisons || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Confidence:</span>
            <span className="stat-value">
              {analysisStats?.averageConfidence ? 
                `${(analysisStats.averageConfidence * 100).toFixed(1)}%` : 
                'N/A'
              }
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">High Confidence:</span>
            <span className="stat-value">{analysisStats?.confidenceDistribution?.high || 0}</span>
          </div>
        </div>

        {/* Pending Updates */}
        <div className="stat-card">
          <h3>Style Updates</h3>
          <div className="stat-item">
            <span className="stat-label">Pending Queues:</span>
            <span className="stat-value">{pendingUpdates?.totalQueues || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Unprocessed:</span>
            <span className="stat-value">{pendingUpdates?.unprocessedUpdates || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Processed:</span>
            <span className="stat-value">{pendingUpdates?.processedUpdates || 0}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {learningStats?.categories && Object.keys(learningStats.categories).length > 0 && (
        <div className="category-breakdown">
          <h3>Learning by Category</h3>
          <div className="category-grid">
            {Object.entries(learningStats.categories).map(([category, stats]) => (
              <div key={category} className="category-card">
                <h4>{category.replace(/_/g, ' ').toUpperCase()}</h4>
                <div className="category-stats">
                  <div className="category-stat">
                    <span>Comparisons: {stats.count}</span>
                  </div>
                  <div className="category-stat">
                    <span>Avg Similarity: {(stats.averageSimilarity * 100).toFixed(1)}%</span>
                  </div>
                  <div className="category-stat">
                    <span>Last Used: {new Date(stats.lastUsed).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {learningStats?.recentActivity && learningStats.recentActivity.length > 0 && (
        <div className="recent-activity">
          <h3>Recent Learning Activity</h3>
          <div className="activity-list">
            {learningStats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-category">{activity.category}</div>
                <div className="activity-date">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
                <div className="activity-similarity">
                  Similarity: {(activity.similarity_score * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Insights */}
      {analysisStats?.recentAnalyses && analysisStats.recentAnalyses.length > 0 && (
        <div className="analysis-insights">
          <h3>Recent Analysis Insights</h3>
          <div className="insights-list">
            {analysisStats.recentAnalyses.slice(0, 3).map((analysis, index) => (
              <div key={index} className="insight-item">
                <div className="insight-category">{analysis.category}</div>
                <div className="insight-confidence">
                  Confidence: {(analysis.analysis_confidence * 100).toFixed(1)}%
                </div>
                <div className="insight-date">
                  {new Date(analysis.analyzed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .learning-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #333;
        }

        .refresh-button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .refresh-button:hover {
          background: #0056b3;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-card h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .stat-label {
          color: #666;
        }

        .stat-value {
          font-weight: bold;
          color: #333;
        }

        .category-breakdown {
          margin-bottom: 30px;
        }

        .category-breakdown h3 {
          margin-bottom: 20px;
          color: #333;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .category-card {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
        }

        .category-card h4 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 14px;
        }

        .category-stats {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .category-stat {
          font-size: 12px;
          color: #666;
        }

        .recent-activity, .analysis-insights {
          margin-bottom: 30px;
        }

        .recent-activity h3, .analysis-insights h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .activity-list, .insights-list {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .activity-item, .insight-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          border-bottom: 1px solid #f0f0f0;
        }

        .activity-item:last-child, .insight-item:last-child {
          border-bottom: none;
        }

        .activity-category, .insight-category {
          font-weight: bold;
          color: #495057;
        }

        .activity-date, .insight-date {
          color: #666;
          font-size: 12px;
        }

        .activity-similarity, .insight-confidence {
          color: #007bff;
          font-size: 12px;
        }

        .loading-state, .error-state {
          text-align: center;
          padding: 40px;
        }

        .error-message {
          color: #dc3545;
          margin-bottom: 15px;
        }

        .retry-button {
          padding: 8px 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LearningDashboard;
