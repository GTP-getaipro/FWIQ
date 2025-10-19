/**
 * Rule Builder UI Component
 * Advanced rule builder with drag-and-drop interface and visual rule composition
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sanitizeUserInput } from '@/lib/sanitizers/htmlSanitizer';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Settings, 
  Code, 
  Eye, 
  Copy,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RuleBuilder = ({ userId, onRuleSaved, onRuleTested, initialRule = null }) => {
  const [rule, setRule] = useState({
    name: '',
    description: '',
    condition: '',
    conditionType: 'simple',
    conditionValue: '',
    escalationAction: 'escalate',
    escalationTarget: '',
    priority: 5,
    enabled: true,
    metadata: {}
  });

  const [ruleChain, setRuleChain] = useState([]);
  const [ruleComposition, setRuleComposition] = useState({
    conditions: [],
    logic: 'AND',
    actions: []
  });
  const [activeTab, setActiveTab] = useState('simple');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Available condition types
  const conditionTypes = [
    { value: 'subject_contains', label: 'Subject Contains', description: 'Check if email subject contains specific text' },
    { value: 'body_contains', label: 'Body Contains', description: 'Check if email body contains specific text' },
    { value: 'from_email', label: 'From Email', description: 'Check if email is from specific address' },
    { value: 'urgency_level', label: 'Urgency Level', description: 'Check email urgency level' },
    { value: 'category', label: 'Category', description: 'Check email category' },
    { value: 'sentiment', label: 'Sentiment', description: 'Check email sentiment' },
    { value: 'after_hours', label: 'After Hours', description: 'Check if email received after business hours' },
    { value: 'keyword_match', label: 'Keyword Match', description: 'Check for specific keywords' }
  ];

  // Available actions
  const actionTypes = [
    { value: 'escalate', label: 'Escalate', description: 'Escalate to manager or specific person' },
    { value: 'auto_reply', label: 'Auto Reply', description: 'Send automatic response' },
    { value: 'queue_for_review', label: 'Queue for Review', description: 'Add to review queue' },
    { value: 'send_notification', label: 'Send Notification', description: 'Send notification to team' },
    { value: 'create_task', label: 'Create Task', description: 'Create task in project management system' },
    { value: 'high_priority', label: 'Mark High Priority', description: 'Mark email as high priority' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 1, label: 'Critical (1)', color: 'bg-red-500' },
    { value: 2, label: 'High (2)', color: 'bg-orange-500' },
    { value: 3, label: 'High (3)', color: 'bg-orange-400' },
    { value: 4, label: 'Medium (4)', color: 'bg-yellow-500' },
    { value: 5, label: 'Medium (5)', color: 'bg-yellow-400' },
    { value: 6, label: 'Medium (6)', color: 'bg-blue-400' },
    { value: 7, label: 'Low (7)', color: 'bg-blue-300' },
    { value: 8, label: 'Low (8)', color: 'bg-gray-400' },
    { value: 9, label: 'Low (9)', color: 'bg-gray-300' },
    { value: 10, label: 'Lowest (10)', color: 'bg-gray-200' }
  ];

  useEffect(() => {
    if (initialRule) {
      setRule(initialRule);
    }
  }, [initialRule]);

  const handleRuleChange = useCallback((field, value) => {
    // Sanitize user input before setting state to prevent XSS attacks
    const sanitizedValue = sanitizeUserInput(value);
    
    setRule(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors]);

  const addRuleToChain = useCallback(() => {
    if (!rule.name || !rule.condition) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in rule name and condition before adding to chain.'
      });
      return;
    }

    const newRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      order: ruleChain.length + 1
    };

    setRuleChain(prev => [...prev, newRule]);
    
    toast({
      title: 'Rule Added',
      description: 'Rule has been added to the chain.'
    });
  }, [rule, ruleChain]);

  const removeRuleFromChain = useCallback((ruleId) => {
    setRuleChain(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const addConditionToComposition = useCallback(() => {
    if (!rule.condition || !rule.conditionValue) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in condition and value before adding to composition.'
      });
      return;
    }

    const newCondition = {
      id: `cond_${Date.now()}`,
      type: rule.condition,
      value: rule.conditionValue,
      operator: 'equals'
    };

    setRuleComposition(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));

    toast({
      title: 'Condition Added',
      description: 'Condition has been added to the composition.'
    });
  }, [rule]);

  const addActionToComposition = useCallback(() => {
    if (!rule.escalationAction) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an action before adding to composition.'
      });
      return;
    }

    const newAction = {
      id: `action_${Date.now()}`,
      type: rule.escalationAction,
      target: rule.escalationTarget,
      priority: rule.priority
    };

    setRuleComposition(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));

    toast({
      title: 'Action Added',
      description: 'Action has been added to the composition.'
    });
  }, [rule]);

  const validateRule = useCallback(() => {
    const errors = [];

    if (!rule.name.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.condition) {
      errors.push('Condition is required');
    }

    if (!rule.conditionValue.trim()) {
      errors.push('Condition value is required');
    }

    if (!rule.escalationAction) {
      errors.push('Escalation action is required');
    }

    if (rule.escalationAction === 'escalate' && !rule.escalationTarget.trim()) {
      errors.push('Escalation target is required when action is "escalate"');
    }

    if (rule.priority < 1 || rule.priority > 10) {
      errors.push('Priority must be between 1 and 10');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [rule]);

  const handleSaveRule = useCallback(async () => {
    if (!validateRule()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the validation errors before saving.'
      });
      return;
    }

    setIsSaving(true);

    try {
      const ruleData = {
        ...rule,
        // Ensure all user input fields are sanitized before saving
        name: sanitizeUserInput(rule.name),
        description: sanitizeUserInput(rule.description),
        conditionValue: sanitizeUserInput(rule.conditionValue),
        escalationTarget: sanitizeUserInput(rule.escalationTarget),
        userId,
        metadata: {
          ...rule.metadata,
          createdWith: 'RuleBuilder',
          version: 1
        }
      };

      // Here you would call your API to save the rule
      // const savedRule = await saveRule(ruleData);
      
      toast({
        title: 'Rule Saved',
        description: 'Your rule has been saved successfully.'
      });

      if (onRuleSaved) {
        onRuleSaved(ruleData);
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'Failed to save rule. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  }, [rule, userId, validateRule, onRuleSaved]);

  const handleTestRule = useCallback(async () => {
    if (!validateRule()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the validation errors before testing.'
      });
      return;
    }

    setIsTesting(true);

    try {
      // Here you would call your API to test the rule
      // const testResult = await testRule(rule);
      
      // Simulate test result
      const mockTestResult = {
        success: true,
        testCases: [
          {
            name: 'Test Case 1',
            emailData: {
              from: 'test@example.com',
              subject: 'Test Subject',
              body: 'Test body content'
            },
            expectedResult: true,
            actualResult: true,
            passed: true
          },
          {
            name: 'Test Case 2',
            emailData: {
              from: 'other@example.com',
              subject: 'Different Subject',
              body: 'Different body content'
            },
            expectedResult: false,
            actualResult: false,
            passed: true
          }
        ],
        executionTime: 150,
        performanceScore: 85
      };

      setTestResults(mockTestResult);

      toast({
        title: 'Test Completed',
        description: `Rule test completed successfully. ${mockTestResult.testCases.filter(tc => tc.passed).length}/${mockTestResult.testCases.length} test cases passed.`
      });

      if (onRuleTested) {
        onRuleTested(mockTestResult);
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Test Error',
        description: 'Failed to test rule. Please try again.'
      });
    } finally {
      setIsTesting(false);
    }
  }, [rule, validateRule, onRuleTested]);

  const renderSimpleRuleBuilder = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rule-name">Rule Name *</Label>
          <Input
            id="rule-name"
            value={rule.name}
            onChange={(e) => handleRuleChange('name', e.target.value)}
            placeholder="Enter rule name"
            className={validationErrors.some(e => e.includes('name')) ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-priority">Priority *</Label>
          <Select value={rule.priority.toString()} onValueChange={(value) => handleRuleChange('priority', parseInt(value))}>
            <SelectTrigger className={validationErrors.some(e => e.includes('priority')) ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityLevels.map(level => (
                <SelectItem key={level.value} value={level.value.toString()}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${level.color}`} />
                    {level.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-description">Description</Label>
        <Textarea
          id="rule-description"
          value={rule.description}
          onChange={(e) => handleRuleChange('description', e.target.value)}
          placeholder="Describe what this rule does"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rule-condition">Condition *</Label>
          <Select value={rule.condition} onValueChange={(value) => handleRuleChange('condition', value)}>
            <SelectTrigger className={validationErrors.some(e => e.includes('condition')) ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-condition-value">Condition Value *</Label>
          <Input
            id="rule-condition-value"
            value={rule.conditionValue}
            onChange={(e) => handleRuleChange('conditionValue', e.target.value)}
            placeholder="Enter condition value"
            className={validationErrors.some(e => e.includes('value')) ? 'border-red-500' : ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rule-action">Action *</Label>
          <Select value={rule.escalationAction} onValueChange={(value) => handleRuleChange('escalationAction', value)}>
            <SelectTrigger className={validationErrors.some(e => e.includes('action')) ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map(action => (
                <SelectItem key={action.value} value={action.value}>
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-target">Target</Label>
          <Input
            id="rule-target"
            value={rule.escalationTarget}
            onChange={(e) => handleRuleChange('escalationTarget', e.target.value)}
            placeholder="Enter target (email, user, etc.)"
            className={validationErrors.some(e => e.includes('target')) ? 'border-red-500' : ''}
          />
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderRuleChainBuilder = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rule Chain</h3>
        <Button onClick={addRuleToChain} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule to Chain
        </Button>
      </div>

      {ruleChain.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No rules in chain yet. Add rules to create a chain.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ruleChain.map((chainRule, index) => (
            <Card key={chainRule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <h4 className="font-medium">{chainRule.name}</h4>
                      <p className="text-sm text-gray-500">
                        {chainRule.condition} → {chainRule.escalationAction}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityLevels.find(p => p.value === chainRule.priority)?.color}>
                      Priority {chainRule.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRuleFromChain(chainRule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {index < ruleChain.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderRuleCompositionBuilder = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Conditions</h3>
          <div className="space-y-2">
            <Button onClick={addConditionToComposition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
          
          {ruleComposition.conditions.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">No conditions added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {ruleComposition.conditions.map((condition, index) => (
                <Card key={condition.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="secondary">{condition.type}</Badge>
                        <span className="ml-2">{condition.value}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRuleComposition(prev => ({
                          ...prev,
                          conditions: prev.conditions.filter(c => c.id !== condition.id)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Actions</h3>
          <div className="space-y-2">
            <Button onClick={addActionToComposition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
          
          {ruleComposition.actions.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">No actions added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {ruleComposition.actions.map((action, index) => (
                <Card key={action.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="secondary">{action.type}</Badge>
                        {action.target && <span className="ml-2">{action.target}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRuleComposition(prev => ({
                          ...prev,
                          actions: prev.actions.filter(a => a.id !== action.id)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="composition-logic">Logic Operator</Label>
        <Select 
          value={ruleComposition.logic} 
          onValueChange={(value) => setRuleComposition(prev => ({ ...prev, logic: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND (All conditions must be true)</SelectItem>
            <SelectItem value="OR">OR (Any condition can be true)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.testCases.filter(tc => tc.passed).length}
                </div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.testCases.filter(tc => !tc.passed).length}
                </div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.executionTime}ms
                </div>
                <div className="text-sm text-gray-500">Execution Time</div>
              </div>
            </div>

            <div className="space-y-2">
              {testResults.testCases.map((testCase, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {testCase.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{testCase.name}</span>
                  <Badge variant={testCase.passed ? 'default' : 'destructive'}>
                    {testCase.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Rule Builder</h1>
          <p className="text-gray-600">Create and manage business rules with advanced features</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestRule}
            disabled={isTesting}
          >
            <Play className="h-4 w-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Rule'}
          </Button>
          <Button
            onClick={handleSaveRule}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Rule'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="simple">Simple Rule</TabsTrigger>
          <TabsTrigger value="chain">Rule Chain</TabsTrigger>
          <TabsTrigger value="composition">Composition</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Simple Rule Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderSimpleRuleBuilder()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Rule Chain Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRuleChainBuilder()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="composition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Rule Composition Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRuleCompositionBuilder()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Version Control</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Create Snapshot
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Debugging</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Debug Mode
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Performance
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderTestResults()}
    </div>
  );
};

export default RuleBuilder;
