-- NEXUS OS Memory System Tables
-- Sprint 1: Cognitive Foundation

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════
-- EPISODIC MEMORY (Specific interactions)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS episodic_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    outcome VARCHAR(20) DEFAULT 'success' CHECK (outcome IN ('success', 'partial', 'failure')),
    context JSONB DEFAULT '{}',
    emotional_valence FLOAT DEFAULT 0,
    importance FLOAT DEFAULT 0.5,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_episodic_user ON episodic_memories(user_id);
CREATE INDEX idx_episodic_agent ON episodic_memories(agent_id);
CREATE INDEX idx_episodic_time ON episodic_memories(created_at DESC);
CREATE INDEX idx_episodic_embedding ON episodic_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ═══════════════════════════════════════════
-- SEMANTIC MEMORY (Facts & Knowledge)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS semantic_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN ('fact', 'preference', 'goal', 'constraint', 'identity')),
    subject VARCHAR(255) NOT NULL,
    predicate VARCHAR(255) NOT NULL,
    object TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(50) DEFAULT 'inferred' CHECK (source IN ('explicit', 'inferred', 'observed')),
    embedding vector(1536),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_semantic_user ON semantic_memories(user_id);
CREATE INDEX idx_semantic_type ON semantic_memories(memory_type);
CREATE INDEX idx_semantic_subject ON semantic_memories(subject);
CREATE INDEX idx_semantic_embedding ON semantic_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ═══════════════════════════════════════════
-- PROCEDURAL MEMORY (Learned patterns)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS procedural_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50) NOT NULL,
    trigger_pattern TEXT NOT NULL,
    procedure JSONB NOT NULL,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    success_rate FLOAT GENERATED ALWAYS AS (
        CASE WHEN (success_count + failure_count) > 0 
        THEN success_count::FLOAT / (success_count + failure_count) 
        ELSE 0 END
    ) STORED,
    embedding vector(1536),
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_procedural_user ON procedural_memories(user_id);
CREATE INDEX idx_procedural_agent ON procedural_memories(agent_id);
CREATE INDEX idx_procedural_success ON procedural_memories(success_rate DESC);
CREATE INDEX idx_procedural_embedding ON procedural_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ═══════════════════════════════════════════
-- MEMORY CONSOLIDATION LOG
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS memory_consolidation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    consolidation_type VARCHAR(50) NOT NULL,
    memories_processed INTEGER DEFAULT 0,
    patterns_extracted INTEGER DEFAULT 0,
    memories_pruned INTEGER DEFAULT 0,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════

-- Function to find similar memories by embedding
CREATE OR REPLACE FUNCTION find_similar_memories(
    query_embedding vector(1536),
    target_user_id INTEGER,
    memory_table VARCHAR(50),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    memory_id UUID,
    similarity FLOAT
) AS $$
BEGIN
    IF memory_table = 'episodic' THEN
        RETURN QUERY
        SELECT id, 1 - (embedding <=> query_embedding) as sim
        FROM episodic_memories
        WHERE user_id = target_user_id
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> query_embedding) > similarity_threshold
        ORDER BY embedding <=> query_embedding
        LIMIT max_results;
    ELSIF memory_table = 'semantic' THEN
        RETURN QUERY
        SELECT id, 1 - (embedding <=> query_embedding) as sim
        FROM semantic_memories
        WHERE user_id = target_user_id
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> query_embedding) > similarity_threshold
        ORDER BY embedding <=> query_embedding
        LIMIT max_results;
    ELSIF memory_table = 'procedural' THEN
        RETURN QUERY
        SELECT id, 1 - (embedding <=> query_embedding) as sim
        FROM procedural_memories
        WHERE user_id = target_user_id
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> query_embedding) > similarity_threshold
        ORDER BY embedding <=> query_embedding
        LIMIT max_results;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update memory access
CREATE OR REPLACE FUNCTION touch_memory(memory_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE semantic_memories 
    SET access_count = access_count + 1, last_accessed = NOW()
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE episodic_memories IS 'Stores specific interaction events with outcomes';
COMMENT ON TABLE semantic_memories IS 'Stores facts, preferences, and knowledge about users';
COMMENT ON TABLE procedural_memories IS 'Stores learned patterns and procedures';
