/**
 * Email Threading System
 * 
 * Provides email conversation threading, thread detection,
 * and conversation management capabilities.
 */

import { supabase } from './customSupabaseClient';

export class EmailThreading {
  constructor() {
    this.threadCache = new Map();
    this.threadPatterns = {
      replyPrefixes: ['re:', 're[', 're ', 're-'],
      forwardPrefixes: ['fwd:', 'fw:', 'fwd ', 'fw ', 'fwd-', 'fw-'],
      threadIndicators: ['thread', 'conversation', 'discussion']
    };
  }

  /**
   * Detect thread for an email
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Thread information
   */
  async detectThread(parsedData, userId) {
    try {
      // 1. Check for existing thread by message ID
      const existingThread = await this.findExistingThread(parsedData, userId);
      if (existingThread) {
        return existingThread;
      }

      // 2. Check for reply/forward patterns
      const replyThread = await this.detectReplyThread(parsedData, userId);
      if (replyThread) {
        return replyThread;
      }

      // 3. Check for subject-based threading
      const subjectThread = await this.detectSubjectThread(parsedData, userId);
      if (subjectThread) {
        return subjectThread;
      }

      // 4. Check for sender-based threading
      const senderThread = await this.detectSenderThread(parsedData, userId);
      if (senderThread) {
        return senderThread;
      }

      // 5. Create new thread
      return await this.createNewThread(parsedData, userId);

    } catch (error) {
      console.error('Thread detection failed:', error);
      return this.getDefaultThreadInfo(parsedData);
    }
  }

  /**
   * Find existing thread by message ID
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Existing thread or null
   */
  async findExistingThread(parsedData, userId) {
    try {
      if (!parsedData.messageId) return null;

      const { data: thread, error } = await supabase
        .from('email_threads')
        .select('*')
        .eq('user_id', userId)
        .eq('message_id', parsedData.messageId)
        .single();

      if (error || !thread) return null;

      return {
        threadId: thread.id,
        threadType: 'existing',
        messageId: thread.message_id,
        subject: thread.subject,
        participants: thread.participants,
        messageCount: thread.message_count,
        lastMessage: thread.last_message_at,
        createdAt: thread.created_at
      };

    } catch (error) {
      console.error('Failed to find existing thread:', error);
      return null;
    }
  }

  /**
   * Detect reply thread
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Reply thread or null
   */
  async detectReplyThread(parsedData, userId) {
    try {
      const subject = parsedData.subject?.cleaned || '';
      const isReply = this.isReplyEmail(subject);

      if (!isReply) return null;

      // Extract original subject
      const originalSubject = this.extractOriginalSubject(subject);
      
      // Find thread by original subject
      const { data: thread, error } = await supabase
        .from('email_threads')
        .select('*')
        .eq('user_id', userId)
        .eq('original_subject', originalSubject)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !thread) return null;

      // Update thread with new message
      await this.updateThreadWithNewMessage(thread.id, parsedData);

      return {
        threadId: thread.id,
        threadType: 'reply',
        originalSubject,
        subject: parsedData.subject?.original || '',
        participants: [...(thread.participants || []), parsedData.from],
        messageCount: thread.message_count + 1,
        lastMessage: new Date().toISOString(),
        createdAt: thread.created_at
      };

    } catch (error) {
      console.error('Failed to detect reply thread:', error);
      return null;
    }
  }

  /**
   * Detect subject-based thread
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Subject thread or null
   */
  async detectSubjectThread(parsedData, userId) {
    try {
      const subject = parsedData.subject?.cleaned || '';
      if (!subject) return null;

      // Find similar subjects using fuzzy matching
      const { data: threads, error } = await supabase
        .from('email_threads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !threads) return null;

      // Find best matching thread
      const bestMatch = this.findBestSubjectMatch(subject, threads);
      if (!bestMatch) return null;

      // Update thread with new message
      await this.updateThreadWithNewMessage(bestMatch.id, parsedData);

      return {
        threadId: bestMatch.id,
        threadType: 'subject_match',
        originalSubject: bestMatch.original_subject,
        subject: parsedData.subject?.original || '',
        participants: [...(bestMatch.participants || []), parsedData.from],
        messageCount: bestMatch.message_count + 1,
        lastMessage: new Date().toISOString(),
        createdAt: bestMatch.created_at
      };

    } catch (error) {
      console.error('Failed to detect subject thread:', error);
      return null;
    }
  }

  /**
   * Detect sender-based thread
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Sender thread or null
   */
  async detectSenderThread(parsedData, userId) {
    try {
      const sender = parsedData.from;
      if (!sender) return null;

      // Find recent threads with same sender
      const { data: threads, error } = await supabase
        .from('email_threads')
        .select('*')
        .eq('user_id', userId)
        .contains('participants', [sender])
        .gte('last_message_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('last_message_at', { ascending: false })
        .limit(5);

      if (error || !threads || threads.length === 0) return null;

      // Use the most recent thread
      const recentThread = threads[0];

      // Update thread with new message
      await this.updateThreadWithNewMessage(recentThread.id, parsedData);

      return {
        threadId: recentThread.id,
        threadType: 'sender_match',
        originalSubject: recentThread.original_subject,
        subject: parsedData.subject?.original || '',
        participants: recentThread.participants,
        messageCount: recentThread.message_count + 1,
        lastMessage: new Date().toISOString(),
        createdAt: recentThread.created_at
      };

    } catch (error) {
      console.error('Failed to detect sender thread:', error);
      return null;
    }
  }

  /**
   * Create new thread
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New thread info
   */
  async createNewThread(parsedData, userId) {
    try {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const originalSubject = parsedData.subject?.cleaned || 'No Subject';

      // Create thread record
      const { data: thread, error } = await supabase
        .from('email_threads')
        .insert({
          id: threadId,
          user_id: userId,
          original_subject: originalSubject,
          subject: parsedData.subject?.original || '',
          participants: [parsedData.from],
          message_count: 1,
          message_id: parsedData.messageId,
          thread_type: 'new',
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create thread:', error);
        return this.getDefaultThreadInfo(parsedData);
      }

      return {
        threadId: thread.id,
        threadType: 'new',
        originalSubject,
        subject: parsedData.subject?.original || '',
        participants: [parsedData.from],
        messageCount: 1,
        lastMessage: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to create new thread:', error);
      return this.getDefaultThreadInfo(parsedData);
    }
  }

  /**
   * Update thread with new message
   * @param {string} threadId - Thread ID
   * @param {Object} parsedData - Parsed email data
   */
  async updateThreadWithNewMessage(threadId, parsedData) {
    try {
      // Update thread record
      await supabase
        .from('email_threads')
        .update({
          message_count: supabase.raw('message_count + 1'),
          last_message_at: new Date().toISOString(),
          participants: supabase.raw('array_append(participants, ?)', [parsedData.from])
        })
        .eq('id', threadId);

      // Add message to thread
      await supabase
        .from('email_thread_messages')
        .insert({
          thread_id: threadId,
          message_id: parsedData.messageId,
          from: parsedData.from,
          subject: parsedData.subject?.original || '',
          body: parsedData.body?.cleaned || '',
          received_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to update thread with new message:', error);
    }
  }

  /**
   * Check if email is a reply
   * @param {string} subject - Email subject
   * @returns {boolean} Is reply
   */
  isReplyEmail(subject) {
    if (!subject) return false;
    
    const lowerSubject = subject.toLowerCase();
    return this.threadPatterns.replyPrefixes.some(prefix => 
      lowerSubject.startsWith(prefix)
    );
  }

  /**
   * Check if email is a forward
   * @param {string} subject - Email subject
   * @returns {boolean} Is forward
   */
  isForwardEmail(subject) {
    if (!subject) return false;
    
    const lowerSubject = subject.toLowerCase();
    return this.threadPatterns.forwardPrefixes.some(prefix => 
      lowerSubject.startsWith(prefix)
    );
  }

  /**
   * Extract original subject from reply/forward
   * @param {string} subject - Email subject
   * @returns {string} Original subject
   */
  extractOriginalSubject(subject) {
    if (!subject) return '';

    let cleaned = subject;

    // Remove reply prefixes
    this.threadPatterns.replyPrefixes.forEach(prefix => {
      const regex = new RegExp(`^${prefix}\\s*`, 'i');
      cleaned = cleaned.replace(regex, '');
    });

    // Remove forward prefixes
    this.threadPatterns.forwardPrefixes.forEach(prefix => {
      const regex = new RegExp(`^${prefix}\\s*`, 'i');
      cleaned = cleaned.replace(regex, '');
    });

    return cleaned.trim();
  }

  /**
   * Find best subject match using fuzzy matching
   * @param {string} subject - Subject to match
   * @param {Array} threads - Threads to search
   * @returns {Object|null} Best match or null
   */
  findBestSubjectMatch(subject, threads) {
    if (!subject || !threads || threads.length === 0) return null;

    const subjectWords = subject.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;

    threads.forEach(thread => {
      const threadSubject = thread.original_subject?.toLowerCase() || '';
      const threadWords = threadSubject.split(/\s+/);
      
      // Calculate similarity score
      const score = this.calculateSubjectSimilarity(subjectWords, threadWords);
      
      if (score > bestScore && score > 0.6) { // Minimum 60% similarity
        bestScore = score;
        bestMatch = thread;
      }
    });

    return bestMatch;
  }

  /**
   * Calculate similarity between two subject word arrays
   * @param {Array} words1 - First word array
   * @param {Array} words2 - Second word array
   * @returns {number} Similarity score (0-1)
   */
  calculateSubjectSimilarity(words1, words2) {
    if (words1.length === 0 || words2.length === 0) return 0;

    // Remove common words for better matching
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const filteredWords1 = words1.filter(word => !commonWords.includes(word));
    const filteredWords2 = words2.filter(word => !commonWords.includes(word));

    if (filteredWords1.length === 0 || filteredWords2.length === 0) return 0;

    // Calculate Jaccard similarity
    const set1 = new Set(filteredWords1);
    const set2 = new Set(filteredWords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Get thread conversation
   * @param {string} threadId - Thread ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Thread conversation
   */
  async getThreadConversation(threadId, userId) {
    try {
      // Get thread info
      const { data: thread, error: threadError } = await supabase
        .from('email_threads')
        .select('*')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !thread) {
        throw new Error('Thread not found');
      }

      // Get thread messages
      const { data: messages, error: messagesError } = await supabase
        .from('email_thread_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('received_at', { ascending: true });

      if (messagesError) {
        throw new Error('Failed to fetch thread messages');
      }

      return {
        thread,
        messages: messages || [],
        messageCount: messages?.length || 0
      };

    } catch (error) {
      console.error('Failed to get thread conversation:', error);
      return {
        thread: null,
        messages: [],
        messageCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get user's email threads
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's threads
   */
  async getUserThreads(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'last_message_at',
        sortOrder = 'desc',
        search = null
      } = options;

      let query = supabase
        .from('email_threads')
        .select('*')
        .eq('user_id', userId);

      if (search) {
        query = query.or(`original_subject.ilike.%${search}%,subject.ilike.%${search}%`);
      }

      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data: threads, error } = await query;

      if (error) throw error;

      return threads || [];

    } catch (error) {
      console.error('Failed to get user threads:', error);
      return [];
    }
  }

  /**
   * Merge threads
   * @param {string} sourceThreadId - Source thread ID
   * @param {string} targetThreadId - Target thread ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Merge result
   */
  async mergeThreads(sourceThreadId, targetThreadId, userId) {
    try {
      // Get both threads
      const { data: sourceThread, error: sourceError } = await supabase
        .from('email_threads')
        .select('*')
        .eq('id', sourceThreadId)
        .eq('user_id', userId)
        .single();

      const { data: targetThread, error: targetError } = await supabase
        .from('email_threads')
        .select('*')
        .eq('id', targetThreadId)
        .eq('user_id', userId)
        .single();

      if (sourceError || targetError || !sourceThread || !targetThread) {
        throw new Error('One or both threads not found');
      }

      // Update target thread
      const mergedParticipants = [...new Set([...(targetThread.participants || []), ...(sourceThread.participants || [])])];
      const mergedMessageCount = targetThread.message_count + sourceThread.message_count;

      await supabase
        .from('email_threads')
        .update({
          participants: mergedParticipants,
          message_count: mergedMessageCount,
          last_message_at: sourceThread.last_message_at > targetThread.last_message_at ? 
            sourceThread.last_message_at : targetThread.last_message_at
        })
        .eq('id', targetThreadId);

      // Move messages from source to target
      await supabase
        .from('email_thread_messages')
        .update({ thread_id: targetThreadId })
        .eq('thread_id', sourceThreadId);

      // Delete source thread
      await supabase
        .from('email_threads')
        .delete()
        .eq('id', sourceThreadId);

      return {
        success: true,
        mergedThreadId: targetThreadId,
        message: 'Threads merged successfully'
      };

    } catch (error) {
      console.error('Failed to merge threads:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Split thread
   * @param {string} threadId - Thread ID
   * @param {Array} messageIds - Message IDs to move to new thread
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Split result
   */
  async splitThread(threadId, messageIds, userId) {
    try {
      // Get original thread
      const { data: originalThread, error: threadError } = await supabase
        .from('email_threads')
        .select('*')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !originalThread) {
        throw new Error('Thread not found');
      }

      // Create new thread
      const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await supabase
        .from('email_threads')
        .insert({
          id: newThreadId,
          user_id: userId,
          original_subject: originalThread.original_subject,
          subject: originalThread.subject,
          participants: originalThread.participants,
          message_count: messageIds.length,
          thread_type: 'split',
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        });

      // Move messages to new thread
      await supabase
        .from('email_thread_messages')
        .update({ thread_id: newThreadId })
        .eq('thread_id', threadId)
        .in('message_id', messageIds);

      // Update original thread message count
      await supabase
        .from('email_threads')
        .update({
          message_count: supabase.raw('message_count - ?', [messageIds.length])
        })
        .eq('id', threadId);

      return {
        success: true,
        newThreadId,
        originalThreadId: threadId,
        message: 'Thread split successfully'
      };

    } catch (error) {
      console.error('Failed to split thread:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get default thread info
   * @param {Object} parsedData - Parsed email data
   * @returns {Object} Default thread info
   */
  getDefaultThreadInfo(parsedData) {
    return {
      threadId: null,
      threadType: 'none',
      originalSubject: parsedData.subject?.cleaned || 'No Subject',
      subject: parsedData.subject?.original || '',
      participants: [parsedData.from],
      messageCount: 1,
      lastMessage: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Clear thread cache
   * @param {string} userId - Optional user ID
   */
  clearCache(userId = null) {
    if (userId) {
      this.threadCache.delete(userId);
    } else {
      this.threadCache.clear();
    }
  }
}

// Export singleton instance
export const emailThreading = new EmailThreading();
