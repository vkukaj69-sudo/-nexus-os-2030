/**
 * NEXUS OS - Memory Service
 * Cognitive memory system for agents
 * Handles episodic, semantic, and procedural memories
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class MemoryService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    this.cache = new Map(); // Working memory cache
  }

  // ═══════════════════════════════════════════
  // EMBEDDING GENERATION
  // ═══════════════════════════════════════════

  async generateEmbedding(text) {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      return null;
    }
  }

  // ═══════════════════════════════════════════
  // EPISODIC MEMORY (Events)
  // ═══════════════════════════════════════════

  async storeEpisodic(userId, data) {
    const { agentId, interactionType, input, output, outcome = 'success', context = {} } = data;
    
    const summary = `${interactionType}: ${input?.substring(0, 200)} -> ${output?.substring(0, 200)}`;
    const embedding = await this.generateEmbedding(summary);
    
    const importance = this.calculateImportance(outcome, context);

    try {
      const result = await this.pool.query(`
        INSERT INTO episodic_memories 
        (user_id, agent_id, interaction_type, input_summary, output_summary, outcome, context, importance, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [userId, agentId, interactionType, input?.substring(0, 500), output?.substring(0, 500), outcome, context, importance, embedding ? `[${embedding.join(',')}]` : null]);

      return { success: true, memoryId: result.rows[0].id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async recallEpisodic(userId, query, limit = 5) {
    const embedding = await this.generateEmbedding(query);
    
    if (!embedding) {
      // Fallback to text search
      const result = await this.pool.query(`
        SELECT * FROM episodic_memories 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, limit]);
      return result.rows;
    }

    try {
      const result = await this.pool.query(`
        SELECT *, 1 - (embedding <=> $1::vector) as similarity
        FROM episodic_memories
        WHERE user_id = $2 AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, [`[${embedding.join(',')}]`, userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Episodic recall error:', error.message);
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // SEMANTIC MEMORY (Facts)
  // ═══════════════════════════════════════════

  async storeSemantic(userId, data) {
    const { memoryType, subject, predicate, object, confidence = 0.8, source = 'inferred' } = data;
    
    const text = `${subject} ${predicate} ${object}`;
    const embedding = await this.generateEmbedding(text);

    try {
      // Check if similar memory exists
      const existing = await this.pool.query(`
        SELECT id FROM semantic_memories 
        WHERE user_id = $1 AND subject = $2 AND predicate = $3
      `, [userId, subject, predicate]);

      if (existing.rows.length > 0) {
        // Update existing
        await this.pool.query(`
          UPDATE semantic_memories 
          SET object = $1, confidence = $2, updated_at = NOW(), embedding = $3
          WHERE id = $4
        `, [object, confidence, embedding ? `[${embedding.join(',')}]` : null, existing.rows[0].id]);
        return { success: true, memoryId: existing.rows[0].id, updated: true };
      }

      // Insert new
      const result = await this.pool.query(`
        INSERT INTO semantic_memories 
        (user_id, memory_type, subject, predicate, object, confidence, source, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [userId, memoryType, subject, predicate, object, confidence, source, embedding ? `[${embedding.join(',')}]` : null]);

      return { success: true, memoryId: result.rows[0].id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async recallSemantic(userId, query, limit = 10) {
    const embedding = await this.generateEmbedding(query);

    try {
      let result;
      if (embedding) {
        result = await this.pool.query(`
          SELECT *, 1 - (embedding <=> $1::vector) as similarity
          FROM semantic_memories
          WHERE user_id = $2 AND embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT $3
        `, [`[${embedding.join(',')}]`, userId, limit]);
      } else {
        result = await this.pool.query(`
          SELECT * FROM semantic_memories 
          WHERE user_id = $1 
          AND (subject ILIKE $2 OR object ILIKE $2)
          ORDER BY confidence DESC
          LIMIT $3
        `, [userId, `%${query}%`, limit]);
      }

      // Touch accessed memories
      for (const row of result.rows) {
        await this.pool.query('SELECT touch_memory($1)', [row.id]);
      }

      return result.rows;
    } catch (error) {
      console.error('Semantic recall error:', error.message);
      return [];
    }
  }

  async getFacts(userId, subject) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM semantic_memories 
        WHERE user_id = $1 AND subject = $2
        ORDER BY confidence DESC
      `, [userId, subject]);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // PROCEDURAL MEMORY (Patterns)
  // ═══════════════════════════════════════════

  async storeProcedural(userId, data) {
    const { agentId, triggerPattern, procedure } = data;
    
    const embedding = await this.generateEmbedding(triggerPattern);

    try {
      const result = await this.pool.query(`
        INSERT INTO procedural_memories 
        (user_id, agent_id, trigger_pattern, procedure, embedding)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [userId, agentId, triggerPattern, procedure, embedding ? `[${embedding.join(',')}]` : null]);

      return { success: true, memoryId: result.rows[0].id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async recallProcedural(userId, agentId, situation, limit = 3) {
    const embedding = await this.generateEmbedding(situation);

    try {
      const result = await this.pool.query(`
        SELECT *, 1 - (embedding <=> $1::vector) as similarity
        FROM procedural_memories
        WHERE user_id = $2 AND agent_id = $3 AND embedding IS NOT NULL
        AND success_rate > 0.5
        ORDER BY success_rate DESC, embedding <=> $1::vector
        LIMIT $4
      `, [`[${embedding.join(',')}]`, userId, agentId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Procedural recall error:', error.message);
      return [];
    }
  }

  async updateProceduralOutcome(memoryId, success) {
    try {
      const field = success ? 'success_count' : 'failure_count';
      await this.pool.query(`
        UPDATE procedural_memories 
        SET ${field} = ${field} + 1, last_used = NOW()
        WHERE id = $1
      `, [memoryId]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════
  // WORKING MEMORY (Current Context)
  // ═══════════════════════════════════════════

  setWorkingMemory(userId, data) {
    const key = `working:${userId}`;
    this.cache.set(key, {
      ...data,
      timestamp: Date.now()
    });
  }

  getWorkingMemory(userId) {
    const key = `working:${userId}`;
    const memory = this.cache.get(key);
    
    // Expire after 1 hour
    if (memory && Date.now() - memory.timestamp > 3600000) {
      this.cache.delete(key);
      return null;
    }
    
    return memory;
  }

  clearWorkingMemory(userId) {
    this.cache.delete(`working:${userId}`);
  }

  // ═══════════════════════════════════════════
  // CONTEXT BUILDING
  // ═══════════════════════════════════════════

  async buildContext(userId, query, agentId = null) {
    const [episodic, semantic, procedural, working] = await Promise.all([
      this.recallEpisodic(userId, query, 3),
      this.recallSemantic(userId, query, 5),
      agentId ? this.recallProcedural(userId, agentId, query, 2) : [],
      this.getWorkingMemory(userId)
    ]);

    return {
      episodic: episodic.map(e => ({
        type: e.interaction_type,
        input: e.input_summary,
        output: e.output_summary,
        outcome: e.outcome,
        when: e.created_at
      })),
      semantic: semantic.map(s => ({
        fact: `${s.subject} ${s.predicate} ${s.object}`,
        confidence: s.confidence,
        type: s.memory_type
      })),
      procedural: procedural.map(p => ({
        trigger: p.trigger_pattern,
        procedure: p.procedure,
        successRate: p.success_rate
      })),
      working,
      builtAt: new Date()
    };
  }

  // ═══════════════════════════════════════════
  // MEMORY CONSOLIDATION
  // ═══════════════════════════════════════════

  async consolidate(userId) {
    const startTime = Date.now();
    let patternsExtracted = 0;
    let memoriesPruned = 0;

    try {
      // 1. Find repeated episodic patterns
      const patterns = await this.pool.query(`
        SELECT agent_id, interaction_type, outcome, COUNT(*) as count
        FROM episodic_memories
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY agent_id, interaction_type, outcome
        HAVING COUNT(*) >= 3
      `, [userId]);

      // 2. Extract semantic memories from patterns
      for (const pattern of patterns.rows) {
        if (pattern.outcome === 'success' && pattern.count >= 3) {
          await this.storeSemantic(userId, {
            memoryType: 'preference',
            subject: 'user',
            predicate: `prefers ${pattern.agent_id} for`,
            object: pattern.interaction_type,
            confidence: Math.min(0.9, 0.5 + pattern.count * 0.1),
            source: 'inferred'
          });
          patternsExtracted++;
        }
      }

      // 3. Prune old low-importance episodic memories
      const pruned = await this.pool.query(`
        DELETE FROM episodic_memories
        WHERE user_id = $1 
        AND importance < 0.3 
        AND created_at < NOW() - INTERVAL '30 days'
        RETURNING id
      `, [userId]);
      memoriesPruned = pruned.rowCount;

      // 4. Log consolidation
      await this.pool.query(`
        INSERT INTO memory_consolidation_log
        (user_id, consolidation_type, memories_processed, patterns_extracted, memories_pruned, duration_ms)
        VALUES ($1, 'daily', $2, $3, $4, $5)
      `, [userId, patterns.rows.length, patternsExtracted, memoriesPruned, Date.now() - startTime]);

      return {
        success: true,
        patternsExtracted,
        memoriesPruned,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  calculateImportance(outcome, context) {
    let importance = 0.5;
    
    if (outcome === 'success') importance += 0.1;
    if (outcome === 'failure') importance += 0.2; // Failures are important to remember
    if (context.userFeedback === 'positive') importance += 0.2;
    if (context.userFeedback === 'negative') importance += 0.15;
    if (context.isFirstTime) importance += 0.1;
    
    return Math.min(1, importance);
  }
}

module.exports = MemoryService;
