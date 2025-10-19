import { AIPersonalization } from '../aiPersonalization.js';

describe('AI Personalization Role-Based Tests', () => {
  let aiPersonalization;

  beforeEach(() => {
    aiPersonalization = new AIPersonalization();
  });

  afterEach(() => {
    aiPersonalization.userProfiles.clear();
  });

  describe('Role-Based Personalization Level Calculation', () => {
    test('should give Premium users higher personalization scores', () => {
      const premiumProfile = {
        name: 'Premium User',
        role: 'Premium',
        industry: 'Technology',
        experience_level: 'expert',
        communication_style: 'professional'
      };
      
      const standardProfile = {
        name: 'Standard User',
        role: 'Standard',
        industry: 'Technology',
        experience_level: 'expert',
        communication_style: 'professional'
      };

      const preferences = { tone: 'professional', detail: 'high' };
      const behaviorPatterns = { interactions: 10, preferences: 5 };

      const premiumLevel = aiPersonalization.calculatePersonalizationLevel(premiumProfile, preferences, behaviorPatterns);
      const standardLevel = aiPersonalization.calculatePersonalizationLevel(standardProfile, preferences, behaviorPatterns);

      // Premium users should get higher personalization levels
      expect(premiumLevel).toBe('high');
      expect(standardLevel).toBe('medium');
    });

    test('should give Standard users basic personalization with minimal boost', () => {
      const standardProfile = {
        name: 'Standard User',
        role: 'Standard',
        industry: 'Technology',
        experience_level: 'beginner',
        communication_style: 'casual'
      };

      const preferences = { tone: 'casual' };
      const behaviorPatterns = { interactions: 2 };

      const level = aiPersonalization.calculatePersonalizationLevel(standardProfile, preferences, behaviorPatterns);
      
      // Standard users should get basic personalization
      expect(level).toBe('basic');
    });

    test('should handle users without roles', () => {
      const noRoleProfile = {
        name: 'No Role User',
        role: '',
        industry: 'Technology',
        experience_level: 'intermediate',
        communication_style: 'professional'
      };

      const preferences = { tone: 'professional' };
      const behaviorPatterns = { interactions: 5 };

      const level = aiPersonalization.calculatePersonalizationLevel(noRoleProfile, preferences, behaviorPatterns);
      
      // Users without roles should get standard calculation
      expect(level).toBe('medium');
    });
  });

  describe('Role-Based Personalization Application', () => {
    test('should apply Premium personalization features', async () => {
      const userId = 'premium_user';
      const profile = {
        name: 'Premium User',
        role: 'Premium',
        industry: 'Technology',
        experience_level: 'expert',
        communication_style: 'professional'
      };

      aiPersonalization.userProfiles.set(userId, profile);

      const response = {
        content: 'This is a test response',
        type: 'analysis'
      };

      const personalizedResponse = await aiPersonalization.applyRoleBasedPersonalization(userId, response, profile);

      expect(personalizedResponse.enhancedFeatures).toBe(true);
      expect(personalizedResponse.prioritySupport).toBe(true);
      expect(personalizedResponse.advancedAnalytics).toBe(true);
      expect(personalizedResponse.detailedInsights).toBe(true);
      expect(personalizedResponse.content).toContain('[Premium Feature: Enhanced insights and priority support available]');
    });

    test('should apply Standard personalization features', async () => {
      const userId = 'standard_user';
      const profile = {
        name: 'Standard User',
        role: 'Standard',
        industry: 'Technology',
        experience_level: 'intermediate',
        communication_style: 'casual'
      };

      aiPersonalization.userProfiles.set(userId, profile);

      const response = {
        content: 'This is a test response',
        type: 'analysis'
      };

      const personalizedResponse = await aiPersonalization.applyRoleBasedPersonalization(userId, response, profile);

      expect(personalizedResponse.enhancedFeatures).toBe(false);
      expect(personalizedResponse.prioritySupport).toBe(false);
      expect(personalizedResponse.advancedAnalytics).toBe(false);
      expect(personalizedResponse.detailedInsights).toBe(false);
      expect(personalizedResponse.content).toBe('This is a test response'); // No premium features added
    });

    test('should handle users without roles', async () => {
      const userId = 'no_role_user';
      const profile = {
        name: 'No Role User',
        role: '',
        industry: 'Technology',
        experience_level: 'intermediate',
        communication_style: 'professional'
      };

      aiPersonalization.userProfiles.set(userId, profile);

      const response = {
        content: 'This is a test response',
        type: 'analysis'
      };

      const personalizedResponse = await aiPersonalization.applyRoleBasedPersonalization(userId, response, profile);

      // Users without roles should get unmodified response
      expect(personalizedResponse).toEqual(response);
    });
  });

  describe('Integration with Main Personalization Flow', () => {
    test('should integrate role-based personalization in personalizeResponse', async () => {
      const userId = 'premium_user';
      const profile = {
        name: 'Premium User',
        role: 'Premium',
        industry: 'Technology',
        experience_level: 'expert',
        communication_style: 'professional'
      };

      aiPersonalization.userProfiles.set(userId, profile);

      const response = {
        content: 'This is a test response',
        type: 'analysis'
      };

      const personalizedResponse = await aiPersonalization.personalizeResponse(userId, response);

      // Should have both level-based and role-based personalization
      expect(personalizedResponse.personalization.level).toBeDefined();
      expect(personalizedResponse.enhancedFeatures).toBe(true);
      expect(personalizedResponse.prioritySupport).toBe(true);
      expect(personalizedResponse.content).toContain('[Premium Feature: Enhanced insights and priority support available]');
    });

    test('should integrate role-based personalization for Standard users', async () => {
      const userId = 'standard_user';
      const profile = {
        name: 'Standard User',
        role: 'Standard',
        industry: 'Technology',
        experience_level: 'intermediate',
        communication_style: 'casual'
      };

      aiPersonalization.userProfiles.set(userId, profile);

      const response = {
        content: 'This is a test response',
        type: 'analysis'
      };

      const personalizedResponse = await aiPersonalization.personalizeResponse(userId, response);

      // Should have level-based personalization but no premium features
      expect(personalizedResponse.personalization.level).toBeDefined();
      expect(personalizedResponse.enhancedFeatures).toBe(false);
      expect(personalizedResponse.prioritySupport).toBe(false);
      expect(personalizedResponse.content).toBe('This is a test response');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null profile gracefully', async () => {
      const userId = 'no_profile_user';
      const response = { content: 'Test response' };

      const personalizedResponse = await aiPersonalization.applyRoleBasedPersonalization(userId, response, null);

      expect(personalizedResponse).toEqual(response);
    });

    test('should handle undefined role gracefully', async () => {
      const userId = 'undefined_role_user';
      const profile = {
        name: 'User',
        role: undefined,
        industry: 'Technology'
      };

      const response = { content: 'Test response' };

      const personalizedResponse = await aiPersonalization.applyRoleBasedPersonalization(userId, response, profile);

      expect(personalizedResponse).toEqual(response);
    });

    test('should handle invalid role values', async () => {
      const userId = 'invalid_role_user';
      const profile = {
        name: 'User',
        role: 'InvalidRole',
        industry: 'Technology'
      };

      const response = { content: 'Test response' };

      const personalizedResponse = await aiPersonalization.applyRoleBasedPersonalization(userId, response, profile);

      expect(personalizedResponse).toEqual(response);
    });
  });
});
