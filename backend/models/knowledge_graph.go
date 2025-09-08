package models

import (
	"time"
	"gorm.io/gorm"
)

// KnowledgeNode represents a knowledge point in the graph
type KnowledgeNode struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	NodeType    string    `json:"node_type"` // skill, topic, grammar, vocabulary, strategy
	Level       int       `json:"level"`     // 1-5 difficulty level
	Category    string    `json:"category"`  // listening, speaking, reading, writing
	Metadata    string    `json:"metadata" gorm:"type:jsonb"` // Additional properties
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relationships
	ParentEdges []KnowledgeEdge `json:"parent_edges" gorm:"foreignKey:ToNodeID"`
	ChildEdges  []KnowledgeEdge `json:"child_edges" gorm:"foreignKey:FromNodeID"`
	Questions   []Question      `json:"questions" gorm:"many2many:question_knowledge_nodes;"`
}

// KnowledgeEdge represents relationships between knowledge nodes
type KnowledgeEdge struct {
	ID         string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	FromNodeID string    `json:"from_node_id" gorm:"not null"`
	ToNodeID   string    `json:"to_node_id" gorm:"not null"`
	EdgeType   string    `json:"edge_type"` // prerequisite, related, contains, enables
	Weight     float64   `json:"weight"`    // relationship strength 0-1
	Metadata   string    `json:"metadata" gorm:"type:jsonb"`
	CreatedAt  time.Time `json:"created_at"`
	
	FromNode KnowledgeNode `json:"from_node" gorm:"foreignKey:FromNodeID"`
	ToNode   KnowledgeNode `json:"to_node" gorm:"foreignKey:ToNodeID"`
}

// UserKnowledgeProgress tracks user's mastery of knowledge points
type UserKnowledgeProgress struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"not null"`
	NodeID       string    `json:"node_id" gorm:"not null"`
	MasteryLevel float64   `json:"mastery_level"` // 0-1, calculated from performance
	StudyCount   int       `json:"study_count"`   // times studied
	CorrectCount int       `json:"correct_count"` // times answered correctly
	LastStudied  time.Time `json:"last_studied"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	
	User KnowledgeNode `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Node KnowledgeNode `json:"node" gorm:"foreignKey:NodeID"`
}

// LearningPath represents personalized learning sequences
type LearningPath struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string    `json:"user_id" gorm:"not null"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	NodeIDs     string    `json:"node_ids" gorm:"type:jsonb"` // ordered array of node IDs
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	Progress    float64   `json:"progress"`  // 0-1 completion percentage
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// QuestionKnowledgeNode junction table for many-to-many relationship
type QuestionKnowledgeNode struct {
	QuestionID string  `json:"question_id" gorm:"primaryKey"`
	NodeID     string  `json:"node_id" gorm:"primaryKey"`
	Relevance  float64 `json:"relevance"` // how relevant this node is to the question (0-1)
}