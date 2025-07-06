package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
)

// DebugMailerSend provides detailed diagnostics for MailerSend setup
func DebugMailerSend() (string, error) {
	
	// Check if API key is set
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("❌ API_KEY environment variable is not set")
	}
	
	// Check API key format (should start with mlsn.)
	if len(apiKey) < 10 {
		return "", fmt.Errorf("❌ API_KEY appears to be invalid (too short)")
	}
	
	// Create test payload directly
	payload := map[string]interface{}{
		"from": map[string]string{
			"email": "info@darkolive.co.uk",
			"name":  "DO Study Platform",
		},
		"to": []map[string]string{
			{
				"email": "darren@darkolive.co.uk",
				"name":  "Test User",
			},
		},
		"subject": "Test OTP Email",
		"text":    "Your OTP code is: 123456",
		"html":    "<p>Your OTP code is: <strong>123456</strong></p>",
	}
	
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("❌ Failed to marshal payload: %v", err)
	}
	
	// Make HTTP request using Modus connection
	request := http.NewRequest("https://api.mailersend.com/v1/email/", &http.RequestOptions{
		Method: "POST",
		Body: payloadBytes,
	})
	
	resp, err := http.Fetch(request)
	if err != nil {
		return "", fmt.Errorf("❌ MailerSend API Error: %w", err)
	}
	
	if !resp.Ok() {
		responseText := resp.Text()
		return "", fmt.Errorf("❌ MailerSend API returned error: %d %s - %s", resp.Status, resp.StatusText, responseText)
	}
	
	messageID := ""
	if resp.Headers != nil {
		if msgID := resp.Headers.Get("X-Message-Id"); msgID != nil && *msgID != "" {
			messageID = *msgID
		}
	}
	
	return fmt.Sprintf("✅ MailerSend test email sent successfully! API Key: %s..., Message ID: %s", 
		apiKey[:10], messageID), nil
}
