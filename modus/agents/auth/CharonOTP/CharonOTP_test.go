package CharonOTP

import (
	"context"
	"testing"
)

func TestGenerateOTP(t *testing.T) {
	otp, err := generateOTP()
	if err != nil {
		t.Fatalf("Failed to generate OTP: %v", err)
	}
	
	if len(otp) != 6 {
		t.Errorf("Expected OTP length 6, got %d", len(otp))
	}
	
	// Verify it's all digits
	for _, char := range otp {
		if char < '0' || char > '9' {
			t.Errorf("OTP contains non-digit character: %c", char)
		}
	}
	
	t.Logf("Generated OTP: %s", otp)
}

func TestSendOTPRequest(t *testing.T) {
	ctx := context.Background()
	
	// Test email channel
	req := OTPRequest{
		Channel:   ChannelEmail,
		Recipient: "darren@darkolive.co.uk",
		UserID:    "user123",
	}
	
	resp, err := SendOTP(ctx, req)
	if err != nil {
		t.Logf("SendOTP returned error (expected due to placeholder): %v", err)
	}
	
	t.Logf("Response: %+v", resp)
	
	// Test validation
	invalidReq := OTPRequest{}
	_, err = SendOTP(ctx, invalidReq)
	if err == nil {
		t.Error("Expected error for empty request")
	}
}

func TestOTPChannels(t *testing.T) {
	channels := []OTPChannel{ChannelEmail, ChannelSMS, ChannelWhatsApp, ChannelTelegram}
	
	for _, channel := range channels {
		t.Run(string(channel), func(t *testing.T) {
			req := OTPRequest{
				Channel:   channel,
				Recipient: "darren@darkolive.co.uk",
			}
			
			resp, err := SendOTP(context.Background(), req)
			t.Logf("Channel %s - Response: %+v, Error: %v", channel, resp, err)
		})
	}
}
