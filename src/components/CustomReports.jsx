import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '@/lib/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CustomReports = ({ userId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportName, setReportName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [reportData, setReportData] = useState(null);

  const availableMetrics = [
    { id: 'emails', label: 'Email Statistics', description: 'Email processing metrics' },
    { id: 'ai', label: 'AI Statistics', description: 'AI response metrics' },
    { id: 'workflows', label: 'Workflow Statistics', description: 'Workflow execution metrics' },
    { id: 'summary', label: 'Summary', description: 'Overall performance summary' }
  ];

  const timeFilterOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const generateReport = async () => {
    if (!userId || selectedMetrics.length === 0) {
      setError('Please select at least one metric and ensure user ID is available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const analyticsService = new AnalyticsService(userId);
      const filters = {
        timeFilter,
        metrics: selectedMetrics
      };

      const data = await analyticsService.generateCustomReport(filters);
      setReportData(data);

      // Save report to local storage for persistence
      const newReport = {
        id: Date.now().toString(),
        name: reportName || `Report ${new Date().toLocaleDateString()}`,
        data,
        filters,
        createdAt: new Date().toISOString()
      };

      const savedReports = JSON.parse(localStorage.getItem('customReports') || '[]');
      savedReports.push(newReport);
      localStorage.setItem('customReports', JSON.stringify(savedReports));
      
      setReports(savedReports);
      setReportName('');
    } catch (err) {
      setError(err.message);
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = () => {
    const savedReports = JSON.parse(localStorage.getItem('customReports') || '[]');
    setReports(savedReports);
  };

  const deleteReport = (reportId) => {
    const updatedReports = reports.filter(report => report.id !== reportId);
    localStorage.setItem('customReports', JSON.stringify(updatedReports));
    setReports(updatedReports);
  };

  const viewReport = (report) => {
    setReportData(report.data);
    setTimeFilter(report.filters.timeFilter);
    setSelectedMetrics(report.filters.metrics);
    setReportName(report.name);
  };

  const exportReport = (report, format = 'json') => {
    let dataStr, mimeType, fileExtension;
    
    switch (format) {
      case 'csv':
        dataStr = convertToCSV(report.data);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'xlsx':
        // For Excel export, we'll use JSON format but with .xlsx extension
        dataStr = JSON.stringify(report.data, null, 2);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      case 'pdf':
        dataStr = generatePDFContent(report);
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      default:
        dataStr = JSON.stringify(report.data, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
    }
    
    const dataBlob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}.${fileExtension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    const csvRows = [];
    
    // Add header
    csvRows.push('Metric,Value,Details');
    
    // Convert data to CSV format
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          csvRows.push(`${key}.${subKey},"${subValue}","${typeof subValue}"`);
        });
      } else {
        csvRows.push(`${key},"${value}","${typeof value}"`);
      }
    });
    
    return csvRows.join('\n');
  };

  const generatePDFContent = (report) => {
    // Simple PDF content generation (in a real app, you'd use a PDF library)
    const content = `
Analytics Report: ${report.name}
Generated: ${new Date(report.createdAt).toLocaleDateString()}
Time Range: ${report.filters.timeFilter}

${JSON.stringify(report.data, null, 2)}
    `;
    return content;
  };

  const toggleMetric = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  useEffect(() => {
    loadSavedReports();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Custom Reports</h2>
      </div>

      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>
            Select metrics and time range to create a custom analytics report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Name */}
          <div>
            <label className="text-sm font-medium">Report Name</label>
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
              className="mt-1"
            />
          </div>

          {/* Time Filter */}
          <div>
            <label className="text-sm font-medium">Time Range</label>
            <div className="flex space-x-2 mt-1">
              {timeFilterOptions.map(option => (
                <Button
                  key={option.value}
                  variant={timeFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <label className="text-sm font-medium">Select Metrics</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {availableMetrics.map(metric => (
                <div
                  key={metric.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMetrics.includes(metric.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleMetric(metric.id)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">{metric.label}</div>
                      <div className="text-sm text-gray-500">{metric.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateReport} 
            disabled={loading || selectedMetrics.length === 0}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Report Data Display */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
            <CardDescription>
              Generated on {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedMetrics.map(metricId => {
                const metric = availableMetrics.find(m => m.id === metricId);
                const data = reportData[metricId];
                
                if (!data) return null;

                return (
                  <div key={metricId} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{metric.label}</h4>
                    <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Reports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
            <CardDescription>
              Previously generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()} • 
                      {report.filters.metrics.length} metrics • 
                      {report.filters.timeFilter}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewReport(report)}
                    >
                      View
                    </Button>
                    <div className="relative group">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        Export
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                      <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                            onClick={() => exportReport(report, 'json')}
                          >
                            JSON
                          </button>
                          <button
                            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                            onClick={() => exportReport(report, 'csv')}
                          >
                            CSV
                          </button>
                          <button
                            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                            onClick={() => exportReport(report, 'xlsx')}
                          >
                            Excel
                          </button>
                          <button
                            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                            onClick={() => exportReport(report, 'pdf')}
                          >
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteReport(report.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomReports;
