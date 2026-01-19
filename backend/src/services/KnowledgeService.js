/**
 * NEXUS OS - Knowledge Graph Service
 * Manages entities and relationships
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class KnowledgeService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
  }

  async generateEmbedding(text) {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding error:', error.message);
      return null;
    }
  }

  // ═══════════════════════════════════════════
  // ENTITY OPERATIONS
  // ═══════════════════════════════════════════

  async createEntity(userId, data) {
    const { entityType, name, description = '', properties = {} } = data;
    const embedding = await this.generateEmbedding(`${name}: ${description}`);

    try {
      const result = await this.pool.query(`
        INSERT INTO entities (user_id, entity_type, name, description, properties, embedding)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, entity_type, name) 
        DO UPDATE SET description = $4, properties = $5, embedding = $6, updated_at = NOW()
        RETURNING id
      `, [userId, entityType, name, description, properties, embedding ? `[${embedding.join(',')}]` : null]);

      return { success: true, entityId: result.rows[0].id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getEntity(userId, entityId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM entities WHERE id = $1 AND user_id = $2',
        [entityId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      return null;
    }
  }

  async findEntities(userId, query, limit = 10) {
    const embedding = await this.generateEmbedding(query);

    try {
      let result;
      if (embedding) {
        result = await this.pool.query(`
          SELECT *, 1 - (embedding <=> $1::vector) as similarity
          FROM entities WHERE user_id = $2 AND embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector LIMIT $3
        `, [`[${embedding.join(',')}]`, userId, limit]);
      } else {
        result = await this.pool.query(`
          SELECT * FROM entities 
          WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
          ORDER BY importance DESC LIMIT $3
        `, [userId, `%${query}%`, limit]);
      }
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async getEntitiesByType(userId, entityType) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM entities WHERE user_id = $1 AND entity_type = $2 ORDER BY importance DESC',
        [userId, entityType]
      );
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // RELATIONSHIP OPERATIONS
  // ═══════════════════════════════════════════

  async createRelationship(userId, data) {
    const { sourceId, targetId, relationshipType, properties = {}, strength = 0.5, confidence = 0.8 } = data;

    try {
      const result = await this.pool.query(`
        INSERT INTO relationships (user_id, source_id, target_id, relationship_type, properties, strength, confidence)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, source_id, target_id, relationship_type)
        DO UPDATE SET properties = $5, strength = $6, confidence = $7, updated_at = NOW()
        RETURNING id
      `, [userId, sourceId, targetId, relationshipType, properties, strength, confidence]);

      return { success: true, relationshipId: result.rows[0].id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getRelationships(userId, entityId) {
    try {
      const result = await this.pool.query(`
        SELECT r.*, 
          s.name as source_name, s.entity_type as source_type,
          t.name as target_name, t.entity_type as target_type
        FROM relationships r
        JOIN entities s ON r.source_id = s.id
        JOIN entities t ON r.target_id = t.id
        WHERE r.user_id = $1 AND (r.source_id = $2 OR r.target_id = $2)
        ORDER BY r.strength DESC
      `, [userId, entityId]);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // GRAPH QUERIES
  // ═══════════════════════════════════════════

  async getEntityGraph(userId, entityId, depth = 2) {
    try {
      const result = await this.pool.query(`
        WITH RECURSIVE graph AS (
          SELECT source_id, target_id, relationship_type, 1 as depth
          FROM relationships WHERE user_id = $1 AND (source_id = $2 OR target_id = $2)
          UNION
          SELECT r.source_id, r.target_id, r.relationship_type, g.depth + 1
          FROM relationships r
          JOIN graph g ON (r.source_id = g.target_id OR r.target_id = g.source_id)
          WHERE r.user_id = $1 AND g.depth < $3
        )
        SELECT DISTINCT e.*, g.relationship_type, g.depth
        FROM graph g
        JOIN entities e ON (e.id = g.source_id OR e.id = g.target_id)
        WHERE e.id != $2
      `, [userId, entityId, depth]);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async queryGraph(userId, question) {
    // Use AI to understand the question and query the graph
    const entities = await this.findEntities(userId, question, 5);
    
    if (entities.length === 0) return { entities: [], relationships: [], answer: 'No relevant entities found.' };

    const allRelationships = [];
    for (const entity of entities) {
      const rels = await this.getRelationships(userId, entity.id);
      allRelationships.push(...rels);
    }

    return {
      entities,
      relationships: allRelationships,
      answer: this.summarizeGraph(entities, allRelationships, question)
    };
  }

  summarizeGraph(entities, relationships, question) {
    if (entities.length === 0) return 'No knowledge found.';
    
    const entityList = entities.map(e => `${e.name} (${e.entity_type})`).join(', ');
    const relList = relationships.slice(0, 5).map(r => 
      `${r.source_name} --[${r.relationship_type}]--> ${r.target_name}`
    ).join('; ');

    return `Found: ${entityList}. Relationships: ${relList || 'none'}`;
  }

  // ═══════════════════════════════════════════
  // ENTITY EXTRACTION (Auto-populate graph)
  // ═══════════════════════════════════════════

  async extractAndStore(userId, text, contextType = 'content') {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    
    const prompt = `Extract entities and relationships from this text. Return JSON only:
{
  "entities": [{"type": "person|brand|topic|product|company|concept", "name": "...", "description": "..."}],
  "relationships": [{"source": "name1", "target": "name2", "type": "works_with|competes_with|uses|creates|targets|part_of"}]
}

Text: ${text}`;

    try {
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, error: 'No JSON found' };

      const extracted = JSON.parse(jsonMatch[0]);
      const entityIds = {};

      // Create entities
      for (const e of extracted.entities || []) {
        const res = await this.createEntity(userId, {
          entityType: e.type,
          name: e.name,
          description: e.description || ''
        });
        if (res.success) entityIds[e.name] = res.entityId;
      }

      // Create relationships
      for (const r of extracted.relationships || []) {
        if (entityIds[r.source] && entityIds[r.target]) {
          await this.createRelationship(userId, {
            sourceId: entityIds[r.source],
            targetId: entityIds[r.target],
            relationshipType: r.type
          });
        }
      }

      return { success: true, entities: Object.keys(entityIds).length, relationships: (extracted.relationships || []).length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = KnowledgeService;
