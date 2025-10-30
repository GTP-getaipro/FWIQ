import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle2, Edit3 } from 'lucide-react';

/**
 * Classification Feedback Button Component
 * 
 * Allows users to correct AI email classifications, building training data
 * for continuous learning and model improvement.
 * 
 * @param {Object} props
 * @param {string} props.emailId - Unique email identifier
 * @param {Object} props.originalClassification - AI's original classification
 * @param {Object} props.emailData - Email metadata for context
 * @param {string} props.provider - Email provider (gmail/outlook)
 * @param {string} props.variant - Button variant (default: 'outline')
 * @param {string} props.size - Button size (default: 'sm')
 */
const ClassificationFeedbackButton = ({
  emailId,
  originalClassification,
  emailData,
  provider = 'gmail',
  variant = 'outline',
  size = 'sm'
}) => {
  const [open, setOpen] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState('');
  const [correctedSecondary, setCorrectedSecondary] = useState('');
  const [correctedCanReply, setCorrectedCanReply] = useState(originalClassification?.ai_can_reply);
  const [reason, setReason] = useState('');
  const [confidenceRating, setConfidenceRating] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // All possible categories
  const categories = [
    { value: 'URGENT', label: '🚨 Urgent/Emergency', description: 'Immediate action required' },
    { value: 'SALES', label: '💰 Sales', description: 'New inquiries, quotes' },
    { value: 'FORMSUB', label: '📝 Form Submission', description: 'Contact form submissions' },
    { value: 'SUPPORT', label: '🛠️ Support', description: 'Customer service, technical issues' },
    { value: 'MANAGER', label: '👔 Manager', description: 'Internal/team emails' },
    { value: 'SUPPLIERS', label: '📦 Suppliers', description: 'Vendor communications' },
    { value: 'BANKING', label: '🏦 Banking', description: 'Financial transactions' },
    { value: 'RECRUITMENT', label: '👥 Recruitment', description: 'Job applications, hiring' },
    { value: 'MISC', label: '📋 Miscellaneous', description: 'Everything else' },
    { value: 'OUT_OF_SCOPE', label: '⛔ Out of Scope', description: 'Wrong department' },
  ];

  const submitFeedback = async () => {
    if (!correctedCategory) {
      toast({
        variant: 'destructive',
        title: 'Category Required',
        description: 'Please select the correct category'
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'submit-classification-feedback',
        {
          body: {
            email_id: emailId,
            provider,
            original_classification: originalClassification,
            corrected_primary_category: correctedCategory,
            corrected_secondary_category: correctedSecondary || null,
            corrected_ai_can_reply: correctedCanReply,
            correction_reason: reason || null,
            email_subject: emailData?.subject,
            email_from: emailData?.from,
            email_body_preview: emailData?.bodyPreview || emailData?.body,
            email_metadata: {
              to: emailData?.to,
              date: emailData?.date,
              hasAttachments: emailData?.hasAttachments
            },
            confidence_rating: confidenceRating,
            feedback_type: 'manual_correction',
            correction_source: 'web_portal'
          }
        }
      );

      if (error) throw error;

      toast({
        title: '✅ Thank you!',
        description: data?.message || 'Your feedback helps improve the AI',
      });

      setOpen(false);
      
      // Reset form
      setCorrectedCategory('');
      setCorrectedSecondary('');
      setReason('');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Please try again'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if AI was wrong
  const isWrong = originalClassification?.primary_category && 
                  correctedCategory && 
                  originalClassification.primary_category !== correctedCategory;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Edit3 className="w-4 h-4" />
          Correct Classification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Improve AI Classification</DialogTitle>
          <DialogDescription>
            Help the AI learn by correcting this classification. Your feedback makes the system smarter!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Preview */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium">{emailData?.subject || 'No subject'}</p>
            <p className="text-xs text-gray-600">From: {emailData?.from || 'Unknown'}</p>
          </div>

          {/* Original Classification */}
          <div className="space-y-2">
            <Label>AI's Classification</Label>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {originalClassification?.primary_category || 'Unknown'}
                </p>
                <p className="text-xs text-blue-700">
                  Confidence: {Math.round((originalClassification?.confidence || 0) * 100)}%
                  {originalClassification?.ai_can_reply && ' • Can Reply: Yes'}
                </p>
              </div>
            </div>
          </div>

          {/* Corrected Classification */}
          <div className="space-y-2">
            <Label htmlFor="corrected-category">Correct Category *</Label>
            <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
              <SelectTrigger id="corrected-category">
                <SelectValue placeholder="Select correct category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-xs text-gray-500">{cat.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary Category (Optional) */}
          {correctedCategory && ['SALES', 'SUPPORT', 'BANKING', 'MANAGER'].includes(correctedCategory) && (
            <div className="space-y-2">
              <Label htmlFor="corrected-secondary">Secondary Category (Optional)</Label>
              <Select value={correctedSecondary} onValueChange={setCorrectedSecondary}>
                <SelectTrigger id="corrected-secondary">
                  <SelectValue placeholder="Select if applicable" />
                </SelectTrigger>
                <SelectContent>
                  {correctedCategory === 'SALES' && (
                    <>
                      <SelectItem value="FORMSUB">Form Submission</SelectItem>
                      <SelectItem value="Quote">Quote Request</SelectItem>
                    </>
                  )}
                  {correctedCategory === 'SUPPORT' && (
                    <>
                      <SelectItem value="General">General Support</SelectItem>
                      <SelectItem value="Complaints">Complaints</SelectItem>
                    </>
                  )}
                  {correctedCategory === 'BANKING' && (
                    <>
                      <SelectItem value="e-Transfer">e-Transfer</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Wire">Wire Transfer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI Can Reply? */}
          <div className="space-y-2">
            <Label htmlFor="can-reply">Should AI Reply to This?</Label>
            <Select 
              value={correctedCanReply?.toString()} 
              onValueChange={(v) => setCorrectedCanReply(v === 'true')}
            >
              <SelectTrigger id="can-reply">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">✅ Yes - AI can draft a reply</SelectItem>
                <SelectItem value="false">❌ No - Needs human response</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confidence Rating */}
          <div className="space-y-2">
            <Label>How Confident Are You? {confidenceRating}/5</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setConfidenceRating(rating)}
                  className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                    confidenceRating >= rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {confidenceRating <= 2 && '⚠️ Uncertain - feedback may be reviewed'}
              {confidenceRating === 3 && '✓ Moderate - standard quality'}
              {confidenceRating === 4 && '✓✓ Confident - good quality'}
              {confidenceRating === 5 && '✓✓✓ Very confident - excellent quality'}
            </p>
          </div>

          {/* Optional Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Why? (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., 'Customer is asking for pricing, should be SALES not SUPPORT'"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Feedback Impact Message */}
          {isWrong && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <strong>AI was incorrect!</strong> This feedback is valuable for training.
                Thank you for helping improve the system.
              </div>
            </div>
          )}
          
          {!isWrong && correctedCategory && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-800">
                Confirming AI's classification. This builds confidence in the model.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submitFeedback}
            disabled={submitting || !correctedCategory}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>Submit Feedback</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassificationFeedbackButton;

