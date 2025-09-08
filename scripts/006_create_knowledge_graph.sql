-- 006_create_knowledge_graph.sql
-- Knowledge Graph Tables for PTE Memory System

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Knowledge Nodes Table
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    node_type VARCHAR(50) NOT NULL, -- skill, topic, grammar, vocabulary, strategy
    level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
    category VARCHAR(50), -- listening, speaking, reading, writing
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Knowledge Edges Table (relationships between nodes)
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(50) NOT NULL, -- prerequisite, related, contains, enables
    weight DECIMAL(3,2) DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent self-references and duplicate edges
    CONSTRAINT no_self_reference CHECK (from_node_id != to_node_id),
    UNIQUE(from_node_id, to_node_id, edge_type)
);

-- User Knowledge Progress Table
CREATE TABLE IF NOT EXISTS user_knowledge_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    mastery_level DECIMAL(3,2) DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 1),
    study_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_studied TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, node_id)
);

-- Learning Paths Table
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    node_ids JSONB DEFAULT '[]', -- ordered array of node IDs
    is_active BOOLEAN DEFAULT true,
    progress DECIMAL(3,2) DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question-Knowledge Node Junction Table (many-to-many)
CREATE TABLE IF NOT EXISTS question_knowledge_nodes (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relevance DECIMAL(3,2) DEFAULT 0.8 CHECK (relevance BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (question_id, node_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_category ON knowledge_nodes(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_level ON knowledge_nodes(level);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON knowledge_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON knowledge_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON knowledge_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_progress_user ON user_knowledge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_progress_node ON user_knowledge_progress(node_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_progress_mastery ON user_knowledge_progress(mastery_level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_active ON learning_paths(is_active);

-- Insert Initial PTE/IELTS Knowledge Graph Data
INSERT INTO knowledge_nodes (name, description, node_type, level, category) VALUES 
-- Listening Skills
('Basic Listening Comprehension', 'Understanding simple conversations and announcements', 'skill', 1, 'listening'),
('Note Taking While Listening', 'Effective note-taking strategies during listening tasks', 'skill', 2, 'listening'),
('Listening for Gist', 'Understanding main ideas in spoken text', 'skill', 2, 'listening'),
('Listening for Detail', 'Identifying specific information in audio', 'skill', 3, 'listening'),
('Academic Listening', 'Understanding lectures and academic discussions', 'skill', 4, 'listening'),

-- Speaking Skills  
('Pronunciation Basics', 'Clear pronunciation of English sounds', 'skill', 1, 'speaking'),
('Fluency and Rhythm', 'Speaking smoothly with natural rhythm', 'skill', 2, 'speaking'),
('Oral Response Structure', 'Organizing spoken responses effectively', 'skill', 3, 'speaking'),
('Academic Speaking', 'Formal presentation and discussion skills', 'skill', 4, 'speaking'),

-- Reading Skills
('Scanning for Information', 'Quickly finding specific details in text', 'skill', 1, 'reading'),
('Skimming for Main Ideas', 'Rapidly understanding general content', 'skill', 2, 'reading'),
('Reading Comprehension', 'Deep understanding of written texts', 'skill', 3, 'reading'),
('Academic Reading', 'Understanding complex academic texts', 'skill', 4, 'reading'),

-- Writing Skills
('Basic Sentence Structure', 'Constructing grammatically correct sentences', 'skill', 1, 'writing'),
('Paragraph Development', 'Building coherent paragraphs', 'skill', 2, 'writing'),
('Essay Organization', 'Structuring complete essays', 'skill', 3, 'writing'),
('Academic Writing', 'Formal academic writing techniques', 'skill', 4, 'writing'),

-- Grammar Topics
('Present Tenses', 'Present simple, continuous, perfect tenses', 'grammar', 2, 'writing'),
('Past Tenses', 'Past simple, continuous, perfect tenses', 'grammar', 2, 'writing'),
('Future Tenses', 'Future simple, continuous, perfect tenses', 'grammar', 3, 'writing'),
('Conditionals', 'First, second, third conditional structures', 'grammar', 3, 'writing'),
('Passive Voice', 'Active to passive voice transformations', 'grammar', 4, 'writing'),

-- Vocabulary Topics
('Academic Vocabulary', 'Common academic words and phrases', 'vocabulary', 3, 'reading'),
('Business English', 'Professional and business terminology', 'vocabulary', 3, 'listening'),
('Daily Life Vocabulary', 'Common everyday words and expressions', 'vocabulary', 1, 'speaking'),
('Technical Terms', 'Subject-specific technical vocabulary', 'vocabulary', 4, 'reading'),

-- Test Strategies
('Time Management', 'Effective time allocation during tests', 'strategy', 2, 'listening'),
('Multiple Choice Strategy', 'Techniques for multiple choice questions', 'strategy', 2, 'reading'),
('Essay Planning Strategy', 'Planning and organizing written responses', 'strategy', 3, 'writing'),
('Speaking Test Strategy', 'Approaches for speaking test sections', 'strategy', 3, 'speaking');

-- Create relationships between knowledge nodes
-- Let me get the IDs first and then create edges
DO $$
DECLARE
    basic_listening UUID;
    note_taking UUID;
    pronunciation UUID;
    fluency UUID;
    present_tenses UUID;
    academic_vocab UUID;
    time_mgmt UUID;
BEGIN
    -- Get some node IDs for creating relationships
    SELECT id INTO basic_listening FROM knowledge_nodes WHERE name = 'Basic Listening Comprehension';
    SELECT id INTO note_taking FROM knowledge_nodes WHERE name = 'Note Taking While Listening';
    SELECT id INTO pronunciation FROM knowledge_nodes WHERE name = 'Pronunciation Basics';
    SELECT id INTO fluency FROM knowledge_nodes WHERE name = 'Fluency and Rhythm';
    SELECT id INTO present_tenses FROM knowledge_nodes WHERE name = 'Present Tenses';
    SELECT id INTO academic_vocab FROM knowledge_nodes WHERE name = 'Academic Vocabulary';
    SELECT id INTO time_mgmt FROM knowledge_nodes WHERE name = 'Time Management';
    
    -- Insert prerequisite relationships
    INSERT INTO knowledge_edges (from_node_id, to_node_id, edge_type, weight) VALUES
    (basic_listening, note_taking, 'prerequisite', 0.8),
    (pronunciation, fluency, 'prerequisite', 0.7),
    (present_tenses, academic_vocab, 'related', 0.6),
    (basic_listening, time_mgmt, 'enables', 0.5);
END $$;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_nodes_updated_at BEFORE UPDATE ON knowledge_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_knowledge_progress_updated_at BEFORE UPDATE ON user_knowledge_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();