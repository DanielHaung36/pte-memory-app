package services

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WebSocketService struct {
	upgrader websocket.Upgrader
	clients  map[string]*websocket.Conn
	mutex    sync.RWMutex
}

type Message struct {
	Type      string      `json:"type"`
	UserID    string      `json:"user_id,omitempty"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}

// NewWebSocketService creates a new WebSocket service
func NewWebSocketService() *WebSocketService {
	return &WebSocketService{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
		clients: make(map[string]*websocket.Conn),
	}
}

// SetupRoutes sets up WebSocket routes in Gin
func (ws *WebSocketService) SetupRoutes(router *gin.Engine) {
	router.GET("/ws", ws.HandleWebSocket)
	log.Println("WebSocket routes configured at /ws")
}

// HandleWebSocket handles WebSocket connections
func (ws *WebSocketService) HandleWebSocket(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	conn, err := ws.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Store connection
	ws.mutex.Lock()
	ws.clients[userID] = conn
	ws.mutex.Unlock()

	// Remove connection when done
	defer func() {
		ws.mutex.Lock()
		delete(ws.clients, userID)
		ws.mutex.Unlock()
		log.Printf("User %s disconnected", userID)
	}()

	log.Printf("User %s connected via WebSocket", userID)

	// Send welcome message
	welcomeMsg := Message{
		Type:      "connected",
		Data:      map[string]interface{}{"message": "Connected to PTE Memory App"},
		Timestamp: time.Now(),
	}
	ws.SendToUser(userID, welcomeMsg)

	// Listen for messages
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		// Handle different message types
		ws.handleMessage(userID, msg)
	}
}

// handleMessage processes incoming WebSocket messages
func (ws *WebSocketService) handleMessage(userID string, msg Message) {
	switch msg.Type {
	case "ping":
		response := Message{
			Type:      "pong",
			Data:      map[string]interface{}{"message": "pong"},
			Timestamp: time.Now(),
		}
		ws.SendToUser(userID, response)

	case "join_study_session":
		// Handle study session join
		sessionID, ok := msg.Data.(map[string]interface{})["session_id"].(string)
		if !ok {
			return
		}
		response := Message{
			Type: "joined_study_session",
			Data: map[string]interface{}{
				"session_id": sessionID,
				"message":    "Joined study session successfully",
			},
			Timestamp: time.Now(),
		}
		ws.SendToUser(userID, response)

	case "update_progress":
		// Broadcast progress update
		ws.BroadcastProgressUpdate(userID, msg.Data)

	case "streak_achieved":
		// Handle streak achievement
		if streakData, ok := msg.Data.(map[string]interface{}); ok {
			if streak, ok := streakData["streak"].(float64); ok {
				ws.BroadcastStreakAchievement(userID, int(streak))
			}
		}

	case "knowledge_mastered":
		// Handle knowledge mastery
		if knowledgeData, ok := msg.Data.(map[string]interface{}); ok {
			nodeID, _ := knowledgeData["node_id"].(string)
			nodeName, _ := knowledgeData["node_name"].(string)
			ws.BroadcastKnowledgeMastery(userID, nodeID, nodeName)
		}
	}
}

// SendToUser sends a message to a specific user
func (ws *WebSocketService) SendToUser(userID string, message Message) error {
	ws.mutex.RLock()
	conn, exists := ws.clients[userID]
	ws.mutex.RUnlock()

	if !exists {
		return nil // User not connected
	}

	return conn.WriteJSON(message)
}

// BroadcastToAll broadcasts a message to all connected clients
func (ws *WebSocketService) BroadcastToAll(message Message) {
	ws.mutex.RLock()
	defer ws.mutex.RUnlock()

	for userID, conn := range ws.clients {
		err := conn.WriteJSON(message)
		if err != nil {
			log.Printf("Error broadcasting to user %s: %v", userID, err)
			// Remove broken connection
			delete(ws.clients, userID)
		}
	}
}

// NotifyUser sends a notification to a specific user
func (ws *WebSocketService) NotifyUser(userID, message, notificationType string) {
	notification := Message{
		Type: "notification",
		Data: map[string]interface{}{
			"id":        time.Now().Unix(),
			"message":   message,
			"type":      notificationType,
			"timestamp": time.Now().Format("2006-01-02 15:04:05"),
		},
		Timestamp: time.Now(),
	}

	ws.SendToUser(userID, notification)
}

// BroadcastStreakAchievement broadcasts streak achievements
func (ws *WebSocketService) BroadcastStreakAchievement(userID string, streakCount int) {
	celebration := Message{
		Type: "celebration",
		Data: map[string]interface{}{
			"type":    "streak",
			"count":   streakCount,
			"message": getStreakMessage(streakCount),
			"user_id": userID,
		},
		Timestamp: time.Now(),
	}

	ws.SendToUser(userID, celebration)
}

// BroadcastKnowledgeMastery broadcasts knowledge mastery achievements
func (ws *WebSocketService) BroadcastKnowledgeMastery(userID, nodeID, nodeName string) {
	mastery := Message{
		Type: "mastery_celebration",
		Data: map[string]interface{}{
			"node_id":   nodeID,
			"node_name": nodeName,
			"message":   "🎉 You've mastered: " + nodeName + "!",
			"user_id":   userID,
		},
		Timestamp: time.Now(),
	}

	ws.SendToUser(userID, mastery)
}

// BroadcastProgressUpdate broadcasts progress updates
func (ws *WebSocketService) BroadcastProgressUpdate(userID string, progressData interface{}) {
	progress := Message{
		Type: "progress_updated",
		Data: map[string]interface{}{
			"user_id":   userID,
			"progress":  progressData,
			"timestamp": time.Now().Format("2006-01-02 15:04:05"),
		},
		Timestamp: time.Now(),
	}

	ws.SendToUser(userID, progress)
}

// GetConnectedUsers returns the list of connected user IDs
func (ws *WebSocketService) GetConnectedUsers() []string {
	ws.mutex.RLock()
	defer ws.mutex.RUnlock()

	users := make([]string, 0, len(ws.clients))
	for userID := range ws.clients {
		users = append(users, userID)
	}
	return users
}

// IsUserConnected checks if a user is currently connected
func (ws *WebSocketService) IsUserConnected(userID string) bool {
	ws.mutex.RLock()
	defer ws.mutex.RUnlock()

	_, exists := ws.clients[userID]
	return exists
}

// Helper function to get streak celebration messages
func getStreakMessage(streak int) string {
	switch {
	case streak >= 30:
		return "🔥 Incredible! 30+ day streak!"
	case streak >= 15:
		return "🌟 Outstanding! Half month streak!"
	case streak >= 10:
		return "💎 Amazing! 10 day streak!"
	case streak >= 7:
		return "🎯 Fantastic! One week streak!"
	case streak >= 5:
		return "⭐ Great job! 5 day streak!"
	case streak >= 3:
		return "🎉 Nice! 3 day streak!"
	default:
		return "👏 Good start! Keep going!"
	}
}