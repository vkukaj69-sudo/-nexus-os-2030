# NEXUS OS Memory Architecture

## Memory Types

### 1. Episodic Memory (Events)
Specific interactions and their outcomes
- User asked X, agent did Y, result was Z
- Timestamps, context, emotional valence

### 2. Semantic Memory (Facts)
Knowledge about the user and their world
- User's name, preferences, goals
- Brand voice, audience, values

### 3. Procedural Memory (How-To)
Learned procedures and patterns
- "When user asks for X, approach Y works best"
- Success/failure patterns

### 4. Working Memory (Current Context)
Active information for current task
- Current conversation
- Active goals
- Loaded context

## Schema Design

### episodic_memories
- id: UUID
- user_id: FK
- agent_id: VARCHAR
- interaction_type: VARCHAR
- input_summary: TEXT
- output_summary: TEXT  
- outcome: ENUM (success, partial, failure)
- context: JSONB
- embedding: VECTOR(1536)
- created_at: TIMESTAMP

### semantic_memories
- id: UUID
- user_id: FK
- memory_type: VARCHAR (fact, preference, goal, constraint)
- subject: VARCHAR
- predicate: VARCHAR
- object: TEXT
- confidence: FLOAT
- source: VARCHAR (explicit, inferred)
- embedding: VECTOR(1536)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### procedural_memories
- id: UUID
- user_id: FK
- agent_id: VARCHAR
- trigger_pattern: TEXT
- procedure: JSONB
- success_count: INT
- failure_count: INT
- last_used: TIMESTAMP
- embedding: VECTOR(1536)

### working_memory (Redis)
- Key: user:{id}:working
- Value: JSON with current context, goals, loaded memories
- TTL: 1 hour (refreshed on activity)
