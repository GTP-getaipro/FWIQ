import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Plus, 
  Edit3, 
  FileText,
  Tag,
  Calendar,
  BarChart3,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { advancedTemplateEngine } from '@/lib/advancedTemplateEngine';

const TemplateEditor = ({ 
  initialTemplateId = null,
  onSave,
  onCancel,
  businessContext = {},
  className = ''
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);
  
  // Template form state
  const [templateForm, setTemplateForm] = useState({
    subject: '',
    html: '',
    text: '',
    category: 'custom',
    tags: [],
    metadata: {}
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    if (initialTemplateId) {
      loadTemplate(initialTemplateId);
    }
  }, []);

  const loadTemplates = () => {
    const allTemplates = advancedTemplateEngine.getTemplates({
      search: searchTerm,
      category: filterCategory
    });
    setTemplates(allTemplates);
  };

  const loadTemplate = (templateId) => {
    const template = advancedTemplateEngine.getTemplate(templateId);
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        subject: template.subject,
        html: template.html,
        text: template.text,
        category: template.metadata.category,
        tags: template.metadata.tags,
        metadata: template.metadata
      });
      setIsEditing(true);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      subject: '',
      html: '',
      text: '',
      category: 'custom',
      tags: [],
      metadata: {}
    });
    setIsEditing(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.subject.trim() || !templateForm.html.trim() || !templateForm.text.trim()) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Subject, HTML, and text content are required.',
        });
        return;
      }

      let savedTemplate;
      if (selectedTemplate) {
        savedTemplate = advancedTemplateEngine.updateTemplate(selectedTemplate.id, templateForm);
      } else {
        savedTemplate = advancedTemplateEngine.createTemplate(templateForm);
      }

      toast({
        title: 'Template Saved',
        description: `Template "${savedTemplate.subject}" has been saved successfully.`,
      });

      loadTemplates();
      setSelectedTemplate(savedTemplate);
      setIsEditing(false);
      
      if (onSave) {
        onSave(savedTemplate);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message,
      });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const success = advancedTemplateEngine.deleteTemplate(templateId);
      if (success) {
        toast({
          title: 'Template Deleted',
          description: 'Template has been deleted successfully.',
        });
        loadTemplates();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message,
      });
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      const duplicatedTemplate = advancedTemplateEngine.duplicateTemplate(templateId, 'Copy');
      toast({
        title: 'Template Duplicated',
        description: `Template has been duplicated as "${duplicatedTemplate.subject}".`,
      });
      loadTemplates();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Failed',
        description: error.message,
      });
    }
  };

  const handlePreviewTemplate = (templateId) => {
    try {
      const template = advancedTemplateEngine.getTemplate(templateId);
      const compiled = advancedTemplateEngine.compileTemplate(templateId, {
        user: businessContext.user || { firstName: 'John', lastName: 'Doe', email: 'john@example.com', companyName: 'Example Corp' },
        appUrl: businessContext.appUrl || 'https://app.floworx-iq.com',
        // Add sample data for preview
        emailCount: 5,
        workflowName: 'Email Automation',
        workflowType: 'Email Processing',
        deploymentTime: new Date().toLocaleDateString(),
        ...businessContext
      });
      
      setSelectedTemplate({ ...template, compiled });
      setIsPreview(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Preview Failed',
        description: error.message,
      });
    }
  };

  const handleExportTemplates = () => {
    try {
      const exportData = advancedTemplateEngine.exportTemplates();
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-templates-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Templates Exported',
        description: 'Templates have been exported successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message,
      });
    }
  };

  const handleImportTemplates = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const results = advancedTemplateEngine.importTemplates(importData);
        
        toast({
          title: 'Import Complete',
          description: `${results.imported} templates imported, ${results.skipped} skipped.`,
        });
        
        loadTemplates();
        setShowImportExport(false);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error.message,
        });
      }
    };
    reader.readAsText(file);
  };

  const categories = ['system', 'notification', 'workflow', 'billing', 'report', 'custom'];

  return (
    <div className={`template-editor-container bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Template Editor</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportExport(!showImportExport)}
          >
            <Download className="w-4 h-4" />
            Import/Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* Sidebar - Template List */}
        <div className="w-1/3 border-r bg-gray-50">
          {/* Search and Filter */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  loadTemplates();
                }}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                loadTemplates();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto">
            {templates.map(template => (
              <div
                key={template.id}
                className={`p-3 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => loadTemplate(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {template.subject}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        {template.metadata.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        v{template.version}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Used {template.metadata.usage} times
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTemplate(template.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTemplate(template.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {isEditing ? (
            <TemplateForm
              templateForm={templateForm}
              setTemplateForm={setTemplateForm}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setIsEditing(false);
                setSelectedTemplate(null);
              }}
              businessContext={businessContext}
            />
          ) : isPreview && selectedTemplate ? (
            <TemplatePreview
              template={selectedTemplate}
              onClose={() => setIsPreview(false)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a template to edit or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import/Export Modal */}
      <AnimatePresence>
        {showImportExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowImportExport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Import/Export Templates</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImportExport(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Templates
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTemplates}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Button
                    onClick={handleExportTemplates}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Templates
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Template Form Component
const TemplateForm = ({ templateForm, setTemplateForm, onSave, onCancel, businessContext }) => {
  const [activeTab, setActiveTab] = useState('content');

  const tabs = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Email subject line"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML Content *
              </label>
              <textarea
                value={templateForm.html}
                onChange={(e) => setTemplateForm({ ...templateForm, html: e.target.value })}
                placeholder="HTML email content..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Content *
              </label>
              <textarea
                value={templateForm.text}
                onChange={(e) => setTemplateForm({ ...templateForm, text: e.target.value })}
                placeholder="Plain text email content..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="custom">Custom</option>
                <option value="system">System</option>
                <option value="notification">Notification</option>
                <option value="workflow">Workflow</option>
                <option value="billing">Billing</option>
                <option value="report">Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                value={templateForm.tags.join(', ')}
                onChange={(e) => setTemplateForm({ 
                  ...templateForm, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="tag1, tag2, tag3"
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Subject:</strong> {templateForm.subject || 'No subject'}
                </div>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: templateForm.html || '<p>No content</p>' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
};

// Template Preview Component
const TemplatePreview = ({ template, onClose }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Template Preview</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-4">
            <strong>Subject:</strong> {template.compiled?.subject || template.subject}
          </div>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: template.compiled?.html || template.html }}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
