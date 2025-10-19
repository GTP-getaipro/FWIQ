// Vocabulary pattern extraction utilities
export class VocabularyExtractor {
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);

    this.businessVocabulary = {
      'HVAC': {
        technical: ['hvac', 'furnace', 'condenser', 'evaporator', 'refrigerant', 'ductwork'],
        service: ['maintenance', 'repair', 'installation', 'tune-up', 'inspection'],
        common: ['heating', 'cooling', 'temperature', 'thermostat', 'air conditioning']
      },
      'Plumbing': {
        technical: ['plumbing', 'pipe', 'fixture', 'valve', 'fitting', 'sewer'],
        service: ['repair', 'installation', 'replacement', 'maintenance', 'inspection'],
        common: ['water', 'leak', 'drain', 'toilet', 'faucet', 'sink']
      },
      'Electrical': {
        technical: ['electrical', 'circuit', 'voltage', 'amperage', 'wiring', 'breaker'],
        service: ['installation', 'repair', 'upgrade', 'inspection', 'troubleshooting'],
        common: ['outlet', 'switch', 'light', 'power', 'electricity']
      },
      'Auto Repair': {
        technical: ['engine', 'transmission', 'brake', 'suspension', 'exhaust'],
        service: ['repair', 'maintenance', 'diagnostic', 'replacement', 'service'],
        common: ['car', 'vehicle', 'oil', 'tire', 'battery']
      },
      'Appliance Repair': {
        technical: ['compressor', 'motor', 'thermostat', 'heating element', 'control board'],
        service: ['repair', 'maintenance', 'replacement', 'diagnostic', 'service'],
        common: ['appliance', 'refrigerator', 'washer', 'dryer', 'dishwasher']
      }
    };
  }

  extractVocabularyPatterns(emails) {
    const wordFrequency = {};
    const phraseFrequency = {};
    const technicalTerms = new Set();
    const serviceTerms = new Set();

    emails.forEach(email => {
      const content = this.cleanText(email.body || '');
      const words = this.tokenizeText(content);
      const phrases = this.extractPhrases(content);

      // Count word frequency
      words.forEach(word => {
        if (!this.stopWords.has(word) && word.length > 2) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });

      // Count phrase frequency
      phrases.forEach(phrase => {
        phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1;
      });

      // Identify technical and service terms
      this.categorizeTerms(words, technicalTerms, serviceTerms);
    });

    return {
      commonWords: this.getTopItems(wordFrequency, 20),
      commonPhrases: this.getTopItems(phraseFrequency, 10),
      technicalTerms: Array.from(technicalTerms),
      serviceTerms: Array.from(serviceTerms),
      vocabularySize: Object.keys(wordFrequency).length,
      businessContext: this.detectBusinessContext(wordFrequency)
    };
  }

  cleanText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  tokenizeText(text) {
    return text.split(' ').filter(word => word.length > 0);
  }

  extractPhrases(text) {
    const phrases = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach(sentence => {
      const words = sentence.trim().split(' ');
      
      // Extract 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const twoWordPhrase = words.slice(i, i + 2).join(' ');
        if (twoWordPhrase.length > 5 && !this.isStopPhrase(twoWordPhrase)) {
          phrases.push(twoWordPhrase);
        }

        if (i < words.length - 2) {
          const threeWordPhrase = words.slice(i, i + 3).join(' ');
          if (threeWordPhrase.length > 8 && !this.isStopPhrase(threeWordPhrase)) {
            phrases.push(threeWordPhrase);
          }
        }
      }
    });

    return phrases;
  }

  isStopPhrase(phrase) {
    const stopPhrases = [
      'i am', 'you are', 'we are', 'they are', 'it is', 'this is',
      'that is', 'there is', 'there are', 'i have', 'you have'
    ];
    return stopPhrases.includes(phrase);
  }

  categorizeTerms(words, technicalTerms, serviceTerms) {
    Object.values(this.businessVocabulary).forEach(vocab => {
      vocab.technical.forEach(term => {
        if (words.includes(term)) {
          technicalTerms.add(term);
        }
      });

      vocab.service.forEach(term => {
        if (words.includes(term)) {
          serviceTerms.add(term);
        }
      });
    });
  }

  detectBusinessContext(wordFrequency) {
    const businessScores = {};

    Object.keys(this.businessVocabulary).forEach(business => {
      let score = 0;
      const vocab = this.businessVocabulary[business];

      [...vocab.technical, ...vocab.service, ...vocab.common].forEach(term => {
        if (wordFrequency[term]) {
          score += wordFrequency[term];
        }
      });

      businessScores[business] = score;
    });

    const topBusiness = Object.keys(businessScores).reduce((a, b) => 
      businessScores[a] > businessScores[b] ? a : b, 'General');

    return {
      detectedType: topBusiness,
      confidence: businessScores[topBusiness] || 0,
      scores: businessScores
    };
  }

  getTopItems(frequency, limit) {
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item, count]) => ({ item, count, frequency: count }));
  }

  extractSignatureVocabulary(emails) {
    const signatures = {
      greetings: {},
      closings: {},
      transitionWords: {},
      emphasisWords: {}
    };

    const greetingPatterns = /^(hello|hi|dear|good morning|good afternoon|greetings)/i;
    const closingPatterns = /(best regards|sincerely|thank you|thanks|best|regards|cheers)$/i;
    const transitionWords = ['however', 'therefore', 'additionally', 'furthermore', 'meanwhile'];
    const emphasisWords = ['important', 'urgent', 'critical', 'priority', 'essential'];

    emails.forEach(email => {
      const lines = (email.body || '').split('\n');
      
      // Extract greetings
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const greetingMatch = firstLine.match(greetingPatterns);
        if (greetingMatch) {
          const greeting = greetingMatch[0];
          signatures.greetings[greeting] = (signatures.greetings[greeting] || 0) + 1;
        }
      }

      // Extract closings
      if (lines.length > 1) {
        const lastLines = lines.slice(-3);
        lastLines.forEach(line => {
          const closingMatch = line.match(closingPatterns);
          if (closingMatch) {
            const closing = closingMatch[0];
            signatures.closings[closing] = (signatures.closings[closing] || 0) + 1;
          }
        });
      }

      // Extract transition and emphasis words
      const content = (email.body || '').toLowerCase();
      transitionWords.forEach(word => {
        if (content.includes(word)) {
          signatures.transitionWords[word] = (signatures.transitionWords[word] || 0) + 1;
        }
      });

      emphasisWords.forEach(word => {
        if (content.includes(word)) {
          signatures.emphasisWords[word] = (signatures.emphasisWords[word] || 0) + 1;
        }
      });
    });

    return {
      preferredGreeting: this.getTopItem(signatures.greetings),
      preferredClosing: this.getTopItem(signatures.closings),
      commonTransitions: this.getTopItems(signatures.transitionWords, 5),
      emphasisStyle: this.getTopItems(signatures.emphasisWords, 5)
    };
  }

  getTopItem(frequency) {
    const entries = Object.entries(frequency);
    if (entries.length === 0) return null;
    
    return entries.reduce(([maxKey, maxVal], [key, val]) => 
      val > maxVal ? [key, val] : [maxKey, maxVal]
    )[0];
  }

  analyzeWritingComplexity(emails) {
    let totalSentences = 0;
    let totalWords = 0;
    let totalSyllables = 0;

    emails.forEach(email => {
      const content = email.body || '';
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = this.tokenizeText(this.cleanText(content));

      totalSentences += sentences.length;
      totalWords += words.length;
      totalSyllables += words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    });

    const avgWordsPerSentence = totalSentences > 0 ? totalWords / totalSentences : 0;
    const avgSyllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 0;

    // Simple readability score (similar to Flesch Reading Ease)
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return {
      averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      averageSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
      readabilityScore: Math.round(readabilityScore),
      complexityLevel: this.getComplexityLevel(readabilityScore),
      totalWords,
      totalSentences
    };
  }

  countSyllables(word) {
    // Simple syllable counting algorithm
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    
    return matches ? matches.length : 1;
  }

  getComplexityLevel(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }
}
