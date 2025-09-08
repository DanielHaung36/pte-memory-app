// AI Services for PTE Memory App
import nlp from 'compromise';
import fuzzysort from 'fuzzysort';

export interface AutoTagResult {
  tags: string[];
  difficulty: number;
  category: string;
  confidence: number;
}

export interface SimilarQuestion {
  id: string;
  title: string;
  similarity: number;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  type: string;
  category: string;
  level: number;
}

export interface LearningInsight {
  type: 'strength' | 'weakness' | 'suggestion';
  category: string;
  message: string;
  actionItems: string[];
}

export class AIServices {
  
  // Auto-generate tags from question text
  static generateAutoTags(questionText: string, questionType?: string): AutoTagResult {
    const doc = nlp(questionText);
    const text = questionText.toLowerCase();
    
    // Extract linguistic features
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');
    
    // PTE/IELTS specific keyword patterns
    const patterns = {
      listening: /listen|hear|audio|sound|recording|speaker|conversation|lecture/i,
      speaking: /speak|say|talk|pronounce|pronunciation|oral|accent|intonation/i,
      reading: /read|passage|text|article|paragraph|comprehension|scan|skim/i,
      writing: /write|essay|composition|argument|opinion|structure|paragraph/i,
      grammar: /grammar|tense|verb|noun|adjective|subject|object|clause/i,
      vocabulary: /vocabulary|word|meaning|definition|synonym|antonym|context/i,
    };
    
    // Detect category
    let detectedCategory = questionType || 'general';
    let maxScore = 0;
    
    Object.entries(patterns).forEach(([category, pattern]) => {
      const matches = text.match(pattern);
      if (matches && matches.length > maxScore) {
        maxScore = matches.length;
        detectedCategory = category;
      }
    });
    
    // Generate tags
    const tags = new Set<string>();
    
    // Add category tag
    if (detectedCategory !== 'general') {
      tags.add(detectedCategory);
    }
    
    // Add grammatical tags
    if (doc.has('#Gerund')) tags.add('gerund');
    if (doc.has('#PastTense')) tags.add('past-tense');
    if (doc.has('#Future')) tags.add('future-tense');
    if (doc.has('#Conditional')) tags.add('conditional');
    if (doc.has('#Passive')) tags.add('passive-voice');
    
    // Add semantic tags from nouns and verbs
    [...nouns, ...verbs, ...adjectives]
      .filter(word => word.length > 3)
      .slice(0, 5)
      .forEach(word => tags.add(word.toLowerCase()));
    
    // Calculate difficulty
    const difficulty = this.calculateDifficulty(questionText);
    
    return {
      tags: Array.from(tags),
      difficulty,
      category: detectedCategory,
      confidence: maxScore > 0 ? Math.min(maxScore * 0.3, 1) : 0.5
    };
  }
  
  // Calculate question difficulty
  static calculateDifficulty(text: string): number {
    const doc = nlp(text);
    const words = doc.terms().out('array');
    const sentences = doc.sentences().out('array');
    
    let difficulty = 1;
    
    // Word count factor
    if (words.length > 30) difficulty += 1;
    if (words.length > 50) difficulty += 1;
    
    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (avgWordLength > 6) difficulty += 1;
    
    // Sentence complexity
    if (sentences.length > 3) difficulty += 0.5;
    const avgWordsPerSentence = words.length / sentences.length;
    if (avgWordsPerSentence > 15) difficulty += 1;
    
    // Complex grammar structures
    if (doc.has('#Conditional') || doc.has('#Subjunctive')) difficulty += 1;
    if (doc.has('#Passive')) difficulty += 0.5;
    
    // Academic vocabulary
    const academicWords = ['consequently', 'furthermore', 'nevertheless', 'adequate', 'comprehensive', 'substantial', 'significant', 'analyze', 'evaluate', 'synthesize'];
    const hasAcademicWords = academicWords.some(word => text.toLowerCase().includes(word));
    if (hasAcademicWords) difficulty += 1;
    
    return Math.min(Math.round(difficulty), 5);
  }
  
  // Find similar questions using fuzzy matching
  static findSimilarQuestions(targetQuestion: string, questionBank: any[], limit = 5): SimilarQuestion[] {
    const results = fuzzysort.go(targetQuestion, questionBank, {
      key: 'title',
      limit,
      threshold: -10000
    });
    
    return results.map(result => ({
      id: result.obj.id,
      title: result.obj.title,
      similarity: Math.abs(result.score) / 1000 // Normalize score
    }));
  }
  
  // Generate study recommendations based on performance
  static generateStudyRecommendations(userStats: any): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    // Analyze accuracy by category
    const categories = ['listening', 'speaking', 'reading', 'writing'];
    
    categories.forEach(category => {
      const accuracy = userStats[`${category}_accuracy`] || 0;
      
      if (accuracy < 0.6) {
        insights.push({
          type: 'weakness',
          category,
          message: `Your ${category} skills need improvement (${(accuracy * 100).toFixed(1)}% accuracy)`,
          actionItems: this.getImprovementActions(category)
        });
      } else if (accuracy > 0.8) {
        insights.push({
          type: 'strength',
          category,
          message: `Excellent ${category} performance (${(accuracy * 100).toFixed(1)}% accuracy)`,
          actionItems: [`Continue practicing ${category} to maintain proficiency`]
        });
      }
    });
    
    // Study streak analysis
    const streak = userStats.study_streak || 0;
    if (streak < 3) {
      insights.push({
        type: 'suggestion',
        category: 'motivation',
        message: 'Build a consistent study habit',
        actionItems: [
          'Set a daily study reminder',
          'Start with 15-minute sessions',
          'Focus on one skill per day'
        ]
      });
    }
    
    // Time of day analysis
    if (userStats.best_study_time) {
      insights.push({
        type: 'suggestion',
        category: 'scheduling',
        message: `Your peak performance time is ${userStats.best_study_time}`,
        actionItems: [
          `Schedule challenging topics during ${userStats.best_study_time}`,
          'Use this time for new material learning'
        ]
      });
    }
    
    return insights;
  }
  
  // Get improvement actions for specific skills
  private static getImprovementActions(category: string): string[] {
    const actions = {
      listening: [
        'Practice with different accents and speeds',
        'Focus on note-taking while listening',
        'Use subtitle removal technique',
        'Work on predicting content'
      ],
      speaking: [
        'Record yourself speaking daily',
        'Practice pronunciation with IPA',
        'Work on fluency with timed responses',
        'Focus on intonation patterns'
      ],
      reading: [
        'Practice skimming and scanning techniques',
        'Build academic vocabulary',
        'Work on inference questions',
        'Time yourself on passage reading'
      ],
      writing: [
        'Practice essay structure templates',
        'Focus on cohesion and coherence',
        'Work on complex sentence structures',
        'Build topic-specific vocabulary'
      ]
    };
    
    return actions[category as keyof typeof actions] || ['Regular practice recommended'];
  }
  
  // Analyze learning patterns and suggest optimal study schedule
  static optimizeStudySchedule(performanceData: any[]): any {
    // Analyze performance by time, day, and duration
    const timeSlots = ['morning', 'afternoon', 'evening'];
    const performance = {} as any;
    
    timeSlots.forEach(slot => {
      const slotData = performanceData.filter(d => this.getTimeSlot(d.timestamp) === slot);
      if (slotData.length > 0) {
        performance[slot] = {
          accuracy: slotData.reduce((sum, d) => sum + d.accuracy, 0) / slotData.length,
          count: slotData.length,
          avgDuration: slotData.reduce((sum, d) => sum + d.duration, 0) / slotData.length
        };
      }
    });
    
    // Find optimal time slot
    const bestSlot = Object.keys(performance).reduce((best, slot) => 
      performance[slot].accuracy > performance[best]?.accuracy ? slot : best
    );
    
    return {
      optimalTime: bestSlot,
      recommendations: {
        bestAccuracy: performance[bestSlot]?.accuracy || 0,
        suggestedDuration: Math.round(performance[bestSlot]?.avgDuration || 30),
        weeklyGoal: Math.max(5, performance[bestSlot]?.count || 3) * 7
      }
    };
  }
  
  // Helper to categorize time
  private static getTimeSlot(timestamp: string): string {
    const hour = new Date(timestamp).getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  // Smart question difficulty adjustment
  static suggestDifficultyAdjustment(recentPerformance: any[]): number {
    if (recentPerformance.length < 5) return 0; // Not enough data
    
    const recentAccuracy = recentPerformance.slice(-5).reduce((sum, p) => sum + p.accuracy, 0) / 5;
    const trend = this.calculateTrend(recentPerformance.slice(-10));
    
    if (recentAccuracy > 0.8 && trend > 0.1) {
      return 1; // Increase difficulty
    } else if (recentAccuracy < 0.6 && trend < -0.1) {
      return -1; // Decrease difficulty
    }
    
    return 0; // Keep current difficulty
  }
  
  // Calculate performance trend
  private static calculateTrend(data: any[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-3).reduce((sum, d) => sum + d.accuracy, 0) / 3;
    const older = data.slice(0, 3).reduce((sum, d) => sum + d.accuracy, 0) / 3;
    
    return recent - older;
  }
  
  // Knowledge gap analysis
  static analyzeKnowledgeGaps(userProgress: any[], knowledgeNodes: KnowledgeNode[]): any {
    const nodeMap = new Map(knowledgeNodes.map(node => [node.id, node]));
    const gaps = [];
    const strengths = [];
    
    userProgress.forEach(progress => {
      const node = nodeMap.get(progress.node_id);
      if (!node) return;
      
      if (progress.mastery_level < 0.5) {
        gaps.push({
          node,
          masteryLevel: progress.mastery_level,
          priority: (1 - progress.mastery_level) * node.level
        });
      } else if (progress.mastery_level > 0.8) {
        strengths.push({
          node,
          masteryLevel: progress.mastery_level
        });
      }
    });
    
    // Sort gaps by priority
    gaps.sort((a, b) => b.priority - a.priority);
    
    return {
      criticalGaps: gaps.slice(0, 5),
      strengths: strengths.slice(0, 3),
      recommendations: this.generateGapRecommendations(gaps.slice(0, 5))
    };
  }
  
  private static generateGapRecommendations(gaps: any[]): string[] {
    if (gaps.length === 0) return ['Great job! Keep up the consistent practice.'];
    
    const recommendations = [];
    const categories = [...new Set(gaps.map(g => g.node.category))];
    
    if (categories.length === 1) {
      recommendations.push(`Focus intensively on ${categories[0]} skills this week`);
    } else {
      recommendations.push('Distribute study time across multiple weak areas');
    }
    
    if (gaps.some(g => g.node.level <= 2)) {
      recommendations.push('Start with foundational concepts before advancing');
    }
    
    recommendations.push('Spend 70% of study time on weak areas, 30% on review');
    
    return recommendations;
  }

  // AI驱动的错题知识图谱分析
  static analyzeQuestionsForKnowledgeGraph(questions: any[]): {
    nodes: any[];
    edges: any[];
    insights: string[];
  } {
    const nodes = [];
    const edges = [];
    const insights = [];
    const skillMap = new Map();
    const conceptMap = new Map();

    // 分析错题中的技能和概念模式
    questions.forEach(question => {
      // 基于问题内容和类型提取技能点
      const extractedSkills = this.extractSkillsFromQuestion(question);
      const extractedConcepts = this.extractConceptsFromQuestion(question);

      extractedSkills.forEach(skill => {
        if (!skillMap.has(skill.name)) {
          skillMap.set(skill.name, {
            id: `skill_${skill.name}`,
            name: skill.name,
            type: 'skill',
            category: question.question_type,
            level: skill.level,
            masteryLevel: this.calculateMasteryFromQuestions(questions, skill.name),
            questionCount: 0
          });
        }
        skillMap.get(skill.name).questionCount++;
      });

      extractedConcepts.forEach(concept => {
        if (!conceptMap.has(concept.name)) {
          conceptMap.set(concept.name, {
            id: `concept_${concept.name}`,
            name: concept.name,
            type: 'concept',
            category: question.question_type,
            level: concept.level,
            masteryLevel: this.calculateMasteryFromQuestions(questions, concept.name),
            questionCount: 0
          });
        }
        conceptMap.get(concept.name).questionCount++;
      });
    });

    // 转换为节点数组
    nodes.push(...Array.from(skillMap.values()));
    nodes.push(...Array.from(conceptMap.values()));

    // 生成连接边（基于共现和层级关系）
    this.generateKnowledgeEdges(nodes, edges);

    // 生成AI洞察
    insights.push(...this.generateKnowledgeInsights(nodes, questions));

    return { nodes, edges, insights };
  }

  // 从问题中提取技能点
  private static extractSkillsFromQuestion(question: any): any[] {
    const skills = [];
    const content = (question.title + ' ' + question.content).toLowerCase();

    // 根据问题类型和关键词映射技能点
    const skillPatterns = {
      listening: [
        { name: 'Summarize Spoken Text', keywords: ['summarize', 'summary', 'main idea'], level: 3 },
        { name: 'Multiple Choice', keywords: ['choose', 'select', 'option'], level: 2 },
        { name: 'Fill in Blanks', keywords: ['blank', 'fill', 'missing'], level: 2 },
        { name: 'Highlight Correct Summary', keywords: ['highlight', 'correct summary'], level: 3 },
        { name: 'Write from Dictation', keywords: ['dictation', 'write exactly'], level: 1 }
      ],
      speaking: [
        { name: 'Read Aloud', keywords: ['read aloud', 'pronunciation'], level: 1 },
        { name: 'Repeat Sentence', keywords: ['repeat', 'sentence'], level: 2 },
        { name: 'Describe Image', keywords: ['describe', 'image', 'picture'], level: 3 },
        { name: 'Re-tell Lecture', keywords: ['retell', 'lecture'], level: 4 },
        { name: 'Answer Short Question', keywords: ['short answer', 'brief'], level: 2 }
      ],
      reading: [
        { name: 'Multiple Choice', keywords: ['multiple choice', 'select'], level: 2 },
        { name: 'Re-order Paragraphs', keywords: ['reorder', 'arrange', 'sequence'], level: 4 },
        { name: 'Fill in Blanks', keywords: ['fill', 'blank', 'complete'], level: 3 },
        { name: 'Multiple Choice (Multiple)', keywords: ['multiple answers', 'several'], level: 3 }
      ],
      writing: [
        { name: 'Summarize Written Text', keywords: ['summarize', 'written text'], level: 3 },
        { name: 'Essay Writing', keywords: ['essay', 'argue', 'discuss'], level: 4 },
        { name: 'Grammar', keywords: ['grammar', 'structure'], level: 2 },
        { name: 'Vocabulary', keywords: ['vocabulary', 'word choice'], level: 2 }
      ]
    };

    const typeSkills = skillPatterns[question.question_type] || [];
    typeSkills.forEach(skill => {
      if (skill.keywords.some(keyword => content.includes(keyword))) {
        skills.push(skill);
      }
    });

    // 如果没有匹配到特定技能，添加通用技能
    if (skills.length === 0) {
      skills.push({
        name: `${question.question_type.charAt(0).toUpperCase()}${question.question_type.slice(1)} General`,
        level: question.difficulty_level || 2
      });
    }

    return skills;
  }

  // 从问题中提取概念点
  private static extractConceptsFromQuestion(question: any): any[] {
    const concepts = [];
    const content = (question.title + ' ' + question.content + ' ' + (question.explanation || '')).toLowerCase();

    // 通用概念模式
    const conceptPatterns = [
      { name: 'Time Management', keywords: ['time', 'quickly', 'fast', 'seconds'], level: 1 },
      { name: 'Note Taking', keywords: ['note', 'write down', 'record'], level: 2 },
      { name: 'Critical Thinking', keywords: ['analyze', 'evaluate', 'compare'], level: 4 },
      { name: 'Memory Techniques', keywords: ['remember', 'memorize', 'recall'], level: 2 },
      { name: 'Stress Management', keywords: ['nervous', 'pressure', 'anxiety'], level: 1 },
      { name: 'Academic Vocabulary', keywords: ['academic', 'formal', 'technical'], level: 3 }
    ];

    conceptPatterns.forEach(concept => {
      if (concept.keywords.some(keyword => content.includes(keyword))) {
        concepts.push(concept);
      }
    });

    // 基于难度级别添加概念
    if (question.difficulty_level >= 4) {
      concepts.push({ name: 'Advanced Strategies', level: 4 });
    } else if (question.difficulty_level <= 2) {
      concepts.push({ name: 'Foundation Skills', level: 1 });
    }

    return concepts;
  }

  // 计算基于问题的掌握度
  private static calculateMasteryFromQuestions(questions: any[], skillName: string): number {
    const relatedQuestions = questions.filter(q => 
      this.extractSkillsFromQuestion(q).some(s => s.name === skillName) ||
      this.extractConceptsFromQuestion(q).some(c => c.name === skillName)
    );

    if (relatedQuestions.length === 0) return 0.5;

    const totalCorrect = relatedQuestions.filter(q => q.is_correct).length;
    return totalCorrect / relatedQuestions.length;
  }

  // 生成知识图谱边 - 增强版智能算法
  private static generateKnowledgeEdges(nodes: any[], edges: any[]) {
    // 创建技能依赖映射
    const skillDependencies = {
      'Foundation Skills': [],
      'Time Management': ['Foundation Skills'],
      'Note Taking': ['Foundation Skills', 'Time Management'],
      'Academic Vocabulary': ['Foundation Skills'],
      'Grammar': ['Foundation Skills', 'Academic Vocabulary'],
      'Reading General': ['Foundation Skills', 'Academic Vocabulary'],
      'Writing General': ['Foundation Skills', 'Grammar', 'Academic Vocabulary'],
      'Listening General': ['Foundation Skills', 'Note Taking'],
      'Speaking General': ['Foundation Skills', 'Academic Vocabulary'],
      'Multiple Choice': ['Reading General', 'Academic Vocabulary'],
      'Fill in Blanks': ['Reading General', 'Grammar', 'Academic Vocabulary'],
      'Re-order Paragraphs': ['Reading General', 'Critical Thinking'],
      'Summarize Written Text': ['Reading General', 'Writing General', 'Note Taking'],
      'Essay Writing': ['Writing General', 'Grammar', 'Critical Thinking'],
      'Summarize Spoken Text': ['Listening General', 'Writing General', 'Note Taking'],
      'Write from Dictation': ['Listening General', 'Writing General'],
      'Read Aloud': ['Speaking General'],
      'Repeat Sentence': ['Listening General', 'Speaking General', 'Memory Techniques'],
      'Describe Image': ['Speaking General', 'Academic Vocabulary'],
      'Re-tell Lecture': ['Listening General', 'Speaking General', 'Note Taking'],
      'Answer Short Question': ['Listening General', 'Speaking General'],
      'Critical Thinking': ['Academic Vocabulary', 'Note Taking'],
      'Memory Techniques': ['Foundation Skills'],
      'Advanced Strategies': ['Critical Thinking', 'Memory Techniques']
    };

    // 为每个节点找到相关连接
    nodes.forEach((node1, i) => {
      nodes.forEach((node2, j) => {
        if (i === j) return; // 跳过自己

        let connectionType = null;
        let strength = 0;

        // 1. 检查技能依赖关系
        const dependencies = skillDependencies[node1.name] || [];
        if (dependencies.includes(node2.name)) {
          connectionType = 'requires';
          strength = 0.9;
        } else if ((skillDependencies[node2.name] || []).includes(node1.name)) {
          connectionType = 'enables';
          strength = 0.85;
        }

        // 2. 同类别技能的层级关系
        if (!connectionType && node1.category === node2.category) {
          const levelDiff = Math.abs(node1.level - node2.level);
          if (levelDiff === 1) {
            connectionType = node1.level < node2.level ? 'leads_to' : 'builds_on';
            strength = 0.8;
          } else if (levelDiff === 2) {
            connectionType = 'related_skill';
            strength = 0.6;
          }
        }

        // 3. 跨类别的技能支撑关系
        if (!connectionType) {
          const crossSkillRelations = {
            'Grammar': ['Writing', 'Speaking'],
            'Academic Vocabulary': ['Reading', 'Writing', 'Speaking', 'Listening'],
            'Note Taking': ['Listening', 'Writing'],
            'Time Management': ['Reading', 'Writing', 'Speaking', 'Listening'],
            'Critical Thinking': ['Reading', 'Writing'],
            'Memory Techniques': ['Speaking', 'Listening']
          };

          Object.entries(crossSkillRelations).forEach(([skill, supportedCategories]) => {
            if (node1.name.includes(skill.split(' ')[0]) && 
                supportedCategories.some(cat => node2.category.includes(cat.toLowerCase()))) {
              connectionType = 'supports';
              strength = 0.7;
            }
          });
        }

        // 4. 基于掌握度的相关性
        if (!connectionType && Math.abs(node1.masteryLevel - node2.masteryLevel) < 0.3) {
          connectionType = 'similar_level';
          strength = 0.5;
        }

        // 5. 问题类型的相关性
        if (!connectionType && node1.type === node2.type && node1.category !== node2.category) {
          connectionType = 'same_skill_type';
          strength = 0.4;
        }

        // 如果找到了连接关系，添加边
        if (connectionType && strength > 0) {
          // 检查是否已存在相同的连接（避免重复）
          const existingEdge = edges.find(edge => 
            (edge.source === node1.id && edge.target === node2.id) ||
            (edge.source === node2.id && edge.target === node1.id)
          );

          if (!existingEdge) {
            edges.push({
              id: `edge_${node1.id}_${node2.id}`,
              source: node1.id,
              target: node2.id,
              type: connectionType,
              strength: strength,
              color: this.getEdgeColor(connectionType),
              label: this.getEdgeLabel(connectionType)
            });
          }
        }
      });
    });

    // 确保每个节点至少有一个连接
    nodes.forEach(node => {
      const hasConnection = edges.some(edge => 
        edge.source === node.id || edge.target === node.id
      );
      
      if (!hasConnection && nodes.length > 1) {
        // 找到掌握度最相近的节点连接
        const similarNode = nodes
          .filter(n => n.id !== node.id)
          .sort((a, b) => Math.abs(a.masteryLevel - node.masteryLevel) - Math.abs(b.masteryLevel - node.masteryLevel))[0];
        
        if (similarNode) {
          edges.push({
            id: `edge_${node.id}_${similarNode.id}`,
            source: node.id,
            target: similarNode.id,
            type: 'related',
            strength: 0.3,
            color: '#94a3b8',
            label: '相关'
          });
        }
      }
    });
  }

  // 获取边的颜色
  private static getEdgeColor(type: string): string {
    const colors = {
      'requires': '#dc2626',      // 红色 - 必需关系
      'enables': '#16a34a',       // 绿色 - 促进关系  
      'supports': '#2563eb',      // 蓝色 - 支撑关系
      'leads_to': '#ea580c',      // 橙色 - 进阶关系
      'builds_on': '#7c3aed',     // 紫色 - 基础关系
      'related_skill': '#0891b2', // 青色 - 相关技能
      'similar_level': '#65a30d', // 绿色 - 相似水平
      'same_skill_type': '#be185d', // 粉色 - 同类技能
      'related': '#94a3b8'        // 灰色 - 一般关系
    };
    return colors[type] || '#94a3b8';
  }

  // 获取边的标签
  private static getEdgeLabel(type: string): string {
    const labels = {
      'requires': '需要',
      'enables': '促成',
      'supports': '支撑',
      'leads_to': '进阶到',
      'builds_on': '基于',
      'related_skill': '相关技能',
      'similar_level': '相似水平',
      'same_skill_type': '同类技能',
      'related': '相关'
    };
    return labels[type] || '相关';
  }

  // 生成AI知识洞察
  private static generateKnowledgeInsights(nodes: any[], questions: any[]): string[] {
    const insights = [];
    
    // 分析薄弱环节
    const weakNodes = nodes.filter(n => n.masteryLevel < 0.5).sort((a, b) => a.masteryLevel - b.masteryLevel);
    if (weakNodes.length > 0) {
      insights.push(`🎯 重点关注: ${weakNodes[0].name} (掌握度: ${(weakNodes[0].masteryLevel * 100).toFixed(1)}%)`);
    }

    // 分析强项
    const strongNodes = nodes.filter(n => n.masteryLevel > 0.8);
    if (strongNodes.length > 0) {
      insights.push(`💪 优势技能: 你在 ${strongNodes.map(n => n.name).join(', ')} 方面表现优秀`);
    }

    // 学习路径建议
    const categories = [...new Set(nodes.map(n => n.category))];
    if (categories.length > 1) {
      const weakestCategory = categories
        .map(cat => ({
          category: cat,
          avgMastery: nodes.filter(n => n.category === cat).reduce((sum, n) => sum + n.masteryLevel, 0) /
                     nodes.filter(n => n.category === cat).length
        }))
        .sort((a, b) => a.avgMastery - b.avgMastery)[0];
      
      insights.push(`📚 建议优先复习 ${weakestCategory.category} 相关内容`);
    }

    // 错题数量分析
    const totalQuestions = questions.length;
    if (totalQuestions > 20) {
      insights.push(`📊 已分析 ${totalQuestions} 道错题，识别出 ${nodes.length} 个知识点`);
    } else {
      insights.push(`💡 建议再完成更多练习以获得更准确的分析结果`);
    }

    return insights;
  }
}