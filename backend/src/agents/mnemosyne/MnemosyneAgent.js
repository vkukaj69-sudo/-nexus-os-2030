/**
 * NEXUS OS - Mnemosyne Agent
 * Memory & Knowledge Graph
 * Stores, retrieves, and connects creator knowledge
 */

const BaseAgent = require('../BaseAgent');

class MnemosyneAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'mnemosyne_01',
      name: 'Memory Architect',
      specialty: 'Identity - RAG & Digital Soul',
      capabilities: ['memory_store', 'memory_retrieve', 'knowledge_query', 'soul_manage']
    });

    this.pool = config.pool; // PostgreSQL pool
    this.memories = new Map(); // In-memory cache
  }

  setPool(pool) {
    this.pool = pool;
  }

  async execute(task) {
    const { type, payload } = task;

    switch (type) {
      case 'memory_store':
        return await this.storeMemory(payload);

      case 'memory_retrieve':
        return await this.retrieveMemory(payload);

      case 'knowledge_query':
        return await this.queryKnowledge(payload);

      case 'soul_store':
        return await this.storeSoul(payload);

      case 'soul_retrieve':
        return await this.retrieveSoul(payload);

      default:
        return await this.queryKnowledge(payload);
    }
  }

  async storeMemory(payload) {
    const { userId, memoryType, content, importance = 0.5 } = payload;

    if (!this.pool) {
      // Fallback to in-memory storage
      const key = `${userId}_${memoryType}_${Date.now()}`;
      this.memories.set(key, { content, importance, timestamp: new Date() });
      return { success: true, stored: 'in_memory', key };
    }

    try {
      const result = await this.pool.query(`
        INSERT INTO creator_memory (user_id, memory_type, content, importance, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [userId, memoryType, content, importance]);

      return {
        type: 'memory_store',
        success: true,
        memoryId: result.rows[0].id,
        timestamp: new Date()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async retrieveMemory(payload) {
    const { userId, memoryType, limit = 10 } = payload;

    if (!this.pool) {
      // Retrieve from in-memory
      const memories = [];
      for (const [key, value] of this.memories) {
        if (key.startsWith(`${userId}_${memoryType || ''}`)) {
          memories.push({ key, ...value });
        }
      }
      return { success: true, memories: memories.slice(0, limit) };
    }

    try {
      let query = `
        SELECT id, memory_type, content, importance, created_at
        FROM creator_memory
        WHERE user_id = $1
      `;
      const params = [userId];

      if (memoryType) {
        query += ` AND memory_type = $2`;
        params.push(memoryType);
      }

      query += ` ORDER BY importance DESC, created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await this.pool.query(query, params);

      return {
        type: 'memory_retrieve',
        success: true,
        memories: result.rows,
        count: result.rows.length,
        timestamp: new Date()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async queryKnowledge(payload) {
    const { userId, query, contextSize = 5 } = payload;

    // For now, simple keyword search
    // TODO: Implement vector similarity with pgvector

    if (!this.pool) {
      return { success: true, results: [], message: 'Database not connected' };
    }

    try {
      const result = await this.pool.query(`
        SELECT id, memory_type, content, importance
        FROM creator_memory
        WHERE user_id = $1
        AND content ILIKE $2
        ORDER BY importance DESC
        LIMIT $3
      `, [userId, `%${query}%`, contextSize]);

      return {
        type: 'knowledge_query',
        success: true,
        query,
        results: result.rows,
        count: result.rows.length,
        timestamp: new Date()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async storeSoul(payload) {
    const { userId, dna_signature, semantic_fingerprint, purity_score } = payload;

    if (!this.pool) {
      this.memories.set(`soul_${userId}`, { dna_signature, semantic_fingerprint, purity_score });
      return { success: true, stored: 'in_memory' };
    }

    try {
      const existing = await this.pool.query(
        'SELECT id FROM digital_soul WHERE user_id = $1',
        [userId]
      );

      if (existing.rows.length > 0) {
        await this.pool.query(`
          UPDATE digital_soul
          SET dna_signature = $1, semantic_fingerprint = $2, purity_score = $3, updated_at = NOW()
          WHERE user_id = $4
        `, [JSON.stringify(dna_signature), semantic_fingerprint, purity_score, userId]);
      } else {
        await this.pool.query(`
          INSERT INTO digital_soul (user_id, dna_signature, semantic_fingerprint, purity_score)
          VALUES ($1, $2, $3, $4)
        `, [userId, JSON.stringify(dna_signature), semantic_fingerprint, purity_score]);
      }

      return {
        type: 'soul_store',
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async retrieveSoul(payload) {
    const { userId } = payload;

    if (!this.pool) {
      const soul = this.memories.get(`soul_${userId}`);
      return { success: true, soul: soul || null };
    }

    try {
      const result = await this.pool.query(
        'SELECT * FROM digital_soul WHERE user_id = $1',
        [userId]
      );

      return {
        type: 'soul_retrieve',
        success: true,
        soul: result.rows[0] || null,
        timestamp: new Date()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Build context from memories for AI prompts
  async buildContext(userId, topic) {
    const memories = await this.queryKnowledge({ userId, query: topic, contextSize: 10 });
    const soul = await this.retrieveSoul({ userId });

    return {
      relevantMemories: memories.results || [],
      soul: soul.soul,
      contextBuilt: new Date()
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      cachedMemories: this.memories.size,
      databaseConnected: !!this.pool
    };
  }
}

module.exports = MnemosyneAgent;
