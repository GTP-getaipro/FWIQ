/**
 * Email Preview Component
 * Displays original email and AI-generated response with editing capabilities
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  User, 
  Clock, 
  FileText, 
  Send, 
  RefreshCw, 
  Edit3, 
  Check, 
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { aiService } from '@/lib/aiService';
import { emailService } from '@/lib/emailService';

const EmailPreview = ({ 
  email, 
  businessContext = {}, 
  onApprove, 
  onEdit, 
  onCancel,
  className = ''
}) => {
  const { toast } = useToast();
  const [aiResponse, setAiResponse] = useState('');
  const [editedResponse, setEditedResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (email) {
      generateResponse();
      classifyEmail();
    }
  }, [email, businessContext]);

  const generateResponse = async () => {
    if (!email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🤖 Generating AI response for email:', email.subject);
      
      const response = await aiService.generateResponse(email, {
        businessType: businessContext.businessType,
        businessName: businessContext.businessName,
        ...businessContext
      });

      setAiResponse(response.response || '');
      setEditedResponse(response.response || '');
      
      console.log('✅ AI response generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate AI response:', error);
      setError('Failed to generate AI response. Please try again.');
      
      // Fallback response
      const fallbackResponse = `Thank you for your email regarding "${email.subject}". We have received your message and will respond shortly.`;
      setAiResponse(fallbackResponse);
      setEditedResponse(fallbackResponse);
    } finally {
      setLoading(false);
    }
  };

  const classifyEmail = async () => {
    if (!email) return;
    
    try {
      const result = await aiService.classifyEmail(email);
      setClassification(result);
    } catch (error) {
      console.error('❌ Failed to classify email:', error);
      setClassification({
        category: 'general',
        confidence: 0.5,
        priority: 'medium',
        sentiment: 'neutral'
      });
    }
  };

  const handleApprove = async () => {
    try {
      console.log('📧 Sending approved email response');
      
      await onApprove({
        response: editedResponse,
        originalEmail: email,
        classification: classification,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Email Sent Successfully!',
        description: 'Your response has been sent to the customer.',
      });
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Email',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    onEdit && onEdit(editedResponse);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit && onEdit(editedResponse);
  };

  const handleCancelEdit = () => {
    setEditedResponse(aiResponse);
    setIsEditing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'support': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'sales': return <User className="w-4 h-4 text-green-500" />;
      case 'quote': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <Mail className="w-8 h-8 mr-2" />
        No email selected for preview
      </div>
    );
  }

  return (
    <div className={`email-preview-container bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
        </div>
        
        {classification && (
          <div className="flex items-center space-x-2">
            {getCategoryIcon(classification.category)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(classification.priority)}`}>
              {classification.category} • {classification.priority}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Original Email */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">Original Email</h4>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                <strong>From:</strong> {email.sender || email.from}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                <strong>Subject:</strong> {email.subject}
              </span>
            </div>
            
            {email.timestamp && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  <strong>Received:</strong> {new Date(email.timestamp).toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {email.body || email.content}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Response */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <h4 className="font-medium text-gray-900">AI Generated Response</h4>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={generateResponse}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Regenerate
            </Button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Generating response...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AI response will appear here..."
                readOnly={!isEditing}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  {editedResponse.length} characters
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          {classification && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>Confidence: {Math.round(classification.confidence * 100)}%</span>
              <span>•</span>
              <span>Sentiment: {classification.sentiment}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleApprove}
            disabled={loading || !editedResponse.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-1" />
            Send Response
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
