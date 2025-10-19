/**
 * Email Editor Component
 * Rich text editor for composing and editing email responses
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Send,
  Save,
  X,
  Eye,
  EyeOff,
  FileText,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { emailService } from '@/lib/emailService';

const EmailEditor = ({ 
  initialContent = '',
  onSave,
  onSend,
  onCancel,
  templateId = null,
  businessContext = {},
  className = ''
}) => {
  const { toast } = useToast();
  const editorRef = useRef(null);
  const [content, setContent] = useState(initialContent);
  const [subject, setSubject] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isRichText, setIsRichText] = useState(true);
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [history, setHistory] = useState([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (editorRef.current && isRichText) {
      editorRef.current.focus();
    }
  }, [isRichText]);

  const executeCommand = (command, value = null) => {
    if (editorRef.current) {
      document.execCommand(command, false, value);
      editorRef.current.focus();
      updateHistory();
    }
  };

  const updateHistory = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setContent(newContent);
      }
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
      }
    }
  };

  const insertTemplate = (template) => {
    const templateContent = template.replace(/\{\{business_name\}\}/g, businessContext.businessName || 'Our Business');
    if (editorRef.current) {
      document.execCommand('insertHTML', false, templateContent);
      updateHistory();
    }
  };

  const loadTemplate = async (templateId) => {
    try {
      const templates = await emailService.getEmailTemplates(businessContext.userId);
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setContent(template.body);
        setSubject(template.subject);
        if (editorRef.current) {
          editorRef.current.innerHTML = template.body;
        }
        updateHistory();
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        variant: 'destructive',
        title: 'Template Load Failed',
        description: 'Could not load the selected template.',
      });
    }
  };

  const handleSave = async () => {
    try {
      const emailData = {
        content: isRichText ? content : editorRef.current?.value,
        subject,
        to,
        cc,
        bcc,
        isRichText,
        timestamp: new Date().toISOString()
      };

      await onSave(emailData);
      
      toast({
        title: 'Email Saved',
        description: 'Your email has been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save email:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Failed to save email.',
      });
    }
  };

  const handleSend = async () => {
    if (!to.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Recipient',
        description: 'Please enter an email address.',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Subject',
        description: 'Please enter a subject line.',
      });
      return;
    }

    try {
      const emailData = {
        to: to.trim(),
        subject: subject.trim(),
        cc: cc.trim(),
        bcc: bcc.trim(),
        body: isRichText ? content : editorRef.current?.value,
        html: isRichText ? content : null,
        timestamp: new Date().toISOString()
      };

      await onSend(emailData);
      
      toast({
        title: 'Email Sent',
        description: 'Your email has been sent successfully.',
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        variant: 'destructive',
        title: 'Send Failed',
        description: error.message || 'Failed to send email.',
      });
    }
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    { icon: Link, command: 'createLink', title: 'Insert Link' },
  ];

  return (
    <div className={`email-editor-container bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Editor</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRichText(!isRichText)}
          >
            <Type className="w-4 h-4" />
            {isRichText ? 'Plain' : 'Rich'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Email Headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To *
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="recipient@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CC
            </label>
            <input
              type="email"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="cc@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BCC
            </label>
            <input
              type="email"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="bcc@example.com"
            />
          </div>
        </div>

        {/* Toolbar */}
        {isRichText && !isPreview && (
          <motion.div 
            className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 border-r pr-2 mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            {/* Formatting Buttons */}
            {toolbarButtons.map(({ icon: Icon, command, value, title }) => (
              <Button
                key={command}
                variant="outline"
                size="sm"
                onClick={() => executeCommand(command, value)}
                title={title}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}

            {/* Font Controls */}
            <div className="flex items-center space-x-2 border-l pl-2 ml-2">
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  executeCommand('fontName', e.target.value);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
              
              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  executeCommand('fontSize', e.target.value);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="1">8px</option>
                <option value="2">10px</option>
                <option value="3">12px</option>
                <option value="4">14px</option>
                <option value="5">18px</option>
                <option value="6">24px</option>
                <option value="7">36px</option>
              </select>
              
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  executeCommand('foreColor', e.target.value);
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="Text Color"
              />
            </div>
          </motion.div>
        )}

        {/* Editor */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {isPreview ? (
            <div 
              className="p-4 min-h-[300px] bg-white"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <>
              {isRichText ? (
                <div
                  ref={editorRef}
                  contentEditable
                  className="p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }}
                  onInput={updateHistory}
                  onBlur={updateHistory}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 min-h-[300px] border-0 resize-none focus:outline-none"
                  placeholder="Type your email content here..."
                />
              )}
            </>
          )}
        </div>

        {/* Character Count */}
        <div className="text-right text-sm text-gray-500">
          {content.length} characters
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-lg">
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
            variant="outline"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Draft
          </Button>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!to.trim() || !subject.trim() || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-4 h-4 mr-1" />
          Send Email
        </Button>
      </div>
    </div>
  );
};

export default EmailEditor;
