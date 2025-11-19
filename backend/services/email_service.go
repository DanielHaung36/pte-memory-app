package services

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"pte-memory-backend/models"
)

// EmailConfig SMTP配置
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

// GetEmailConfig 获取邮件配置
func GetEmailConfig() *EmailConfig {
	return &EmailConfig{
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@pte-memory.com"),
		FromName:     getEnv("FROM_NAME", "PTE Memory App"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// SendEmail 发送邮件
func SendEmail(to, subject, htmlBody string) error {
	config := GetEmailConfig()

	if config.SMTPUser == "" || config.SMTPPassword == "" {
		// 如果未配置SMTP，跳过发送（仅记录日志）
		fmt.Printf("Email would be sent to %s: %s\n", to, subject)
		return nil
	}

	// 构建邮件
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + htmlBody

	// SMTP认证
	auth := smtp.PlainAuth("", config.SMTPUser, config.SMTPPassword, config.SMTPHost)

	// 发送邮件
	addr := fmt.Sprintf("%s:%s", config.SMTPHost, config.SMTPPort)
	err := smtp.SendMail(addr, auth, config.FromEmail, []string{to}, []byte(message))

	if err != nil {
		return fmt.Errorf("发送邮件失败: %v", err)
	}

	return nil
}

// SendWelcomeEmail 发送欢迎邮件
func SendWelcomeEmail(user models.User) error {
	subject := "欢迎加入 PTE Memory App！"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 欢迎加入 PTE Memory App!</h1>
        </div>
        <div class="content">
            <p>你好 <strong>{{.Username}}</strong>，</p>
            <p>欢迎加入我们的学习社区！我们很高兴你能成为我们的一员。</p>
            <p>PTE Memory App 使用科学的艾宾浩斯记忆曲线帮助你高效学习，我们提供：</p>
            <ul>
                <li>📚 PTE/IELTS 专项题库</li>
                <li>🧠 智能复习提醒</li>
                <li>📊 学习数据分析</li>
                <li>🎮 趣味学习游戏</li>
                <li>👥 社区互动学习</li>
            </ul>
            <p>开始你的学习之旅吧！</p>
            <a href="http://localhost:3000/dashboard" class="button">开始学习</a>
        </div>
        <div class="footer">
            <p>© 2025 PTE Memory App. All rights reserved.</p>
            <p>如果你不想接收此类邮件，可以在设置中关闭邮件通知。</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("welcome").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, user); err != nil {
		return err
	}

	return SendEmail(user.Email, subject, body.String())
}

// SendReviewReminderEmail 发送复习提醒邮件
func SendReviewReminderEmail(user models.User, dueCount int) error {
	subject := fmt.Sprintf("📝 你有 %d 道题目需要复习", dueCount)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .count { font-size: 48px; font-weight: bold; color: #f5576c; }
        .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 复习提醒</h1>
        </div>
        <div class="content">
            <p>你好 <strong>{{.Username}}</strong>，</p>
            <p>根据艾宾浩斯记忆曲线，你有一些题目需要复习了！</p>
            <div class="stats">
                <div class="count">{{.DueCount}}</div>
                <p>道题目等待复习</p>
            </div>
            <p>及时复习可以巩固记忆，提高学习效率！</p>
            <a href="http://localhost:3000/review" class="button">立即复习</a>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("reminder").Parse(tmpl)
	if err != nil {
		return err
	}

	data := struct {
		Username string
		DueCount int
	}{
		Username: user.Username,
		DueCount: dueCount,
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return SendEmail(user.Email, subject, body.String())
}

// SendStreakReminderEmail 发送连击保护提醒
func SendStreakReminderEmail(user models.User) error {
	subject := fmt.Sprintf("🔥 保护你的 %d 天连击！", user.Streak)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .streak { font-size: 72px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #fa709a; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 连击提醒</h1>
        </div>
        <div class="content">
            <p>你好 <strong>{{.Username}}</strong>，</p>
            <p>你已经坚持学习了：</p>
            <div class="streak">🔥 {{.Streak}} 天</div>
            <p>今天还没有学习，别让连击中断哦！</p>
            <p>坚持就是胜利！</p>
            <a href="http://localhost:3000/dashboard" class="button">继续学习</a>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("streak").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, user); err != nil {
		return err
	}

	return SendEmail(user.Email, subject, body.String())
}

// SendAchievementEmail 发送成就解锁邮件
func SendAchievementEmail(user models.User, achievementTitle, achievementDesc string) error {
	subject := "🏆 恭喜解锁新成就！"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .achievement { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 3px solid #ffd700; }
        .trophy { font-size: 72px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 成就解锁！</h1>
        </div>
        <div class="content">
            <p>你好 <strong>{{.Username}}</strong>，</p>
            <div class="achievement">
                <div class="trophy">🏆</div>
                <h2>{{.Title}}</h2>
                <p>{{.Description}}</p>
            </div>
            <p>继续加油，解锁更多成就！</p>
            <a href="http://localhost:3000/achievements" class="button">查看我的成就</a>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("achievement").Parse(tmpl)
	if err != nil {
		return err
	}

	data := struct {
		Username    string
		Title       string
		Description string
	}{
		Username:    user.Username,
		Title:       achievementTitle,
		Description: achievementDesc,
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return SendEmail(user.Email, subject, body.String())
}

// SendPasswordResetEmail 发送密码重置邮件
func SendPasswordResetEmail(user models.User, resetToken string) error {
	subject := "🔐 重置你的密码"

	resetLink := fmt.Sprintf("http://localhost:3000/auth/reset-password?token=%s", resetToken)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 密码重置</h1>
        </div>
        <div class="content">
            <p>你好 <strong>{{.Username}}</strong>，</p>
            <p>我们收到了你的密码重置请求。</p>
            <p>点击下面的按钮重置密码（链接30分钟内有效）：</p>
            <a href="{{.ResetLink}}" class="button">重置密码</a>
            <div class="warning">
                <strong>⚠️ 安全提示：</strong><br>
                如果你没有请求重置密码，请忽略此邮件。你的密码不会被更改。
            </div>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("reset").Parse(tmpl)
	if err != nil {
		return err
	}

	data := struct {
		Username  string
		ResetLink string
	}{
		Username:  user.Username,
		ResetLink: resetLink,
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return SendEmail(user.Email, subject, body.String())
}
