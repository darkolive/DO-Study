package main

import (
	"context"
	"fmt"

	hermesmailer "modus/agents/communication/HermesMailer"
)

// TestMailerSend tests the MailerSend integration with detailed diagnostics
func TestMailerSend() (string, error) {
	ctx := context.Background()
	
	// Create mailer instance
	mailer := hermesmailer.NewHermesMailer("")
	
	// Test email request with minimal configuration
	req := &hermesmailer.SendTemplateRequest{
		FromName:   "DO Study Platform",
		FromEmail:  "info@darkolive.co.uk", // Ensure this domain is verified in MailerSend
		ToName:     "Test User",
		ToEmail:    "darren@darkolive.co.uk",
		Subject:    "Test OTP Email",
		TemplateID: "neqvygm91v8l0p7w", // Using same template ID as CharonOTP
		Variables: map[string]string{
			"otp_code": "123456",
			"purpose":  "authentication",
			"expires":  "5 minutes",
		},
		Tags: []string{"otp", "test"},
	}
	
	// Send email and capture detailed error information
	resp, err := mailer.Send(ctx, req)
	if err != nil {
		return "", fmt.Errorf("MailerSend test failed: %w", err)
	}
	
	return fmt.Sprintf("✅ MailerSend test successful! Message ID: %s", resp.MessageID), nil
}
