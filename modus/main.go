package main

import (
	"context"
	"time"

	_ "github.com/hypermodeinc/modus/sdk/go"
	CharonOTP "modus/agents/auth/CharonOTP"
)

// Valid OTP channel values (for reference)
// Supported channels: "email", "sms", "whatsapp", "telegram"

// OTPRequest represents the request to generate and send OTP
type OTPRequest struct {
	Channel   string `json:"channel"`
	Recipient string `json:"recipient"`
}

// OTPResponse represents the response from OTP generation and sending
type OTPResponse struct {
	OTPID     string    `json:"otpId"`
	Sent      bool      `json:"sent"`
	Channel   string    `json:"channel"`
	ExpiresAt time.Time `json:"expiresAt"`
	Message   string    `json:"message,omitempty"`
}

// Convert main package types to CharonOTP package types
func convertToCharonOTPRequest(req OTPRequest) CharonOTP.OTPRequest {
	return CharonOTP.OTPRequest{
		Channel:   CharonOTP.OTPChannel(req.Channel),
		Recipient: req.Recipient,
		UserID:    "", // Empty userID since not required for this agent
	}
}

func convertFromCharonOTPResponse(resp CharonOTP.OTPResponse) OTPResponse {
	return OTPResponse{
		OTPID:     resp.OTPID,
		Sent:      resp.Sent,
		Channel:   string(resp.Channel),
		ExpiresAt: resp.ExpiresAt,
		Message:   resp.Message,
	}
}

// SendOTP is the exported wrapper function for Modus
func SendOTP(req OTPRequest) (OTPResponse, error) {
	// Create context for internal use
	ctx := context.Background()
	charonReq := convertToCharonOTPRequest(req)
	charonResp, err := CharonOTP.SendOTP(ctx, charonReq)
	if err != nil {
		return OTPResponse{}, err
	}
	return convertFromCharonOTPResponse(charonResp), nil
}

func main() {
	// Explorer will use the exported functions
	// No actual implementation needed here
}
