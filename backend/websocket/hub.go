package websocket

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// 允许跨域连接，生产环境应该限制origin
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Message 定义WebSocket消息结构
type Message struct {
	Type    string      `json:"type"`
	UserID  string      `json:"user_id,omitempty"`
	Data    interface{} `json:"data"`
	Time    time.Time   `json:"time"`
}

// Client 表示WebSocket客户端
type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan Message
	Hub    *Hub
}

// Hub 管理WebSocket连接
type Hub struct {
	Clients    map[*Client]bool
	UserClients map[string][]*Client // 按用户ID分组的客户端
	Broadcast  chan Message
	Register   chan *Client
	Unregister chan *Client
	mutex      sync.RWMutex
}

// NewHub 创建新的Hub
func NewHub() *Hub {
	return &Hub{
		Clients:     make(map[*Client]bool),
		UserClients: make(map[string][]*Client),
		Broadcast:   make(chan Message, 256),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
	}
}

// Run 启动Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mutex.Lock()
			h.Clients[client] = true
			
			// 按用户ID分组
			if client.UserID != "" {
				h.UserClients[client.UserID] = append(h.UserClients[client.UserID], client)
			}
			h.mutex.Unlock()
			
			log.Printf("WebSocket client connected: %s (User: %s)", client.ID, client.UserID)
			
			// 发送连接成功消息
			select {
			case client.Send <- Message{
				Type: "connected",
				Data: map[string]string{"status": "connected", "client_id": client.ID},
				Time: time.Now(),
			}:
			default:
				close(client.Send)
				h.removeClient(client)
			}

		case client := <-h.Unregister:
			h.removeClient(client)

		case message := <-h.Broadcast:
			h.broadcastMessage(message)
		}
	}
}

// removeClient 移除客户端
func (h *Hub) removeClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if _, ok := h.Clients[client]; ok {
		delete(h.Clients, client)
		close(client.Send)
		
		// 从用户分组中移除
		if client.UserID != "" {
			clients := h.UserClients[client.UserID]
			for i, c := range clients {
				if c == client {
					h.UserClients[client.UserID] = append(clients[:i], clients[i+1:]...)
					break
				}
			}
			if len(h.UserClients[client.UserID]) == 0 {
				delete(h.UserClients, client.UserID)
			}
		}
		
		log.Printf("WebSocket client disconnected: %s (User: %s)", client.ID, client.UserID)
	}
}

// broadcastMessage 广播消息
func (h *Hub) broadcastMessage(message Message) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	// 如果指定了用户ID，只发送给该用户
	if message.UserID != "" {
		clients := h.UserClients[message.UserID]
		for _, client := range clients {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.Clients, client)
			}
		}
		return
	}
	
	// 广播给所有客户端
	for client := range h.Clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.Clients, client)
		}
	}
}

// SendToUser 发送消息给特定用户
func (h *Hub) SendToUser(userID string, messageType string, data interface{}) {
	message := Message{
		Type:   messageType,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
	
	go func() {
		h.Broadcast <- message
	}()
}

// SendToAll 发送消息给所有用户
func (h *Hub) SendToAll(messageType string, data interface{}) {
	message := Message{
		Type: messageType,
		Data: data,
		Time: time.Now(),
	}
	
	go func() {
		h.Broadcast <- message
	}()
}

// GetUserConnections 获取用户连接数
func (h *Hub) GetUserConnections(userID string) int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	return len(h.UserClients[userID])
}

// GetTotalConnections 获取总连接数
func (h *Hub) GetTotalConnections() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	return len(h.Clients)
}

// readPump 处理从WebSocket连接读取消息
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	// 设置读取限制
	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var message Message
		err := c.Conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		
		// 处理客户端发送的消息
		c.handleMessage(message)
	}
}

// writePump 处理向WebSocket连接写入消息
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage 处理客户端消息
func (c *Client) handleMessage(message Message) {
	switch message.Type {
	case "ping":
		// 响应ping消息
		c.Send <- Message{
			Type: "pong",
			Data: map[string]interface{}{"timestamp": time.Now().Unix()},
			Time: time.Now(),
		}
		
	case "question_created":
		// 题目创建通知
		if c.UserID != "" {
			c.Hub.SendToUser(c.UserID, "question_created", message.Data)
		}
		
	case "review_completed":
		// 复习完成通知
		if c.UserID != "" {
			c.Hub.SendToUser(c.UserID, "review_completed", message.Data)
		}
		
	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

// HandleWebSocket 处理WebSocket连接
func HandleWebSocket(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Query("user_id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		client := &Client{
			ID:     generateClientID(),
			UserID: userID,
			Conn:   conn,
			Send:   make(chan Message, 256),
			Hub:    hub,
		}

		client.Hub.Register <- client

		// 启动读写协程
		go client.writePump()
		go client.readPump()
	}
}

// generateClientID 生成客户端ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + string(rune(time.Now().UnixNano()%26+65))
}