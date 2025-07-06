package CharonOTP

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	hermesmailer "modus/agents/communication/HermesMailer"
)

// OTPChannel represents the delivery channel for OTP
type OTPChannel string

const (
	ChannelEmail     OTPChannel = "email"
	ChannelSMS       OTPChannel = "sms"
	ChannelWhatsApp  OTPChannel = "whatsapp"
	ChannelTelegram  OTPChannel = "telegram"
)

// OTPRequest represents the request to generate and send OTP
type OTPRequest struct {
	Channel     OTPChannel `json:"channel"`
	Recipient   string     `json:"recipient"`   // email, phone number, etc.
	UserID      string     `json:"userId,omitempty"`
}

// OTPResponse represents the response after OTP generation
type OTPResponse struct {
	OTPID     string    `json:"otpId"`
	Sent      bool      `json:"sent"`
	Verified  bool      `json:"verified"`
	Channel   OTPChannel `json:"channel"`
	ExpiresAt time.Time `json:"expiresAt"`
	Message   string    `json:"message,omitempty"`
}

// VerifyOTPRequest represents the request to verify an OTP
type VerifyOTPRequest struct {
	OTPID     string `json:"otpId"`
	OTPCode   string `json:"otpCode"`
	Recipient string `json:"recipient"`
}

// VerifyOTPResponse represents the response after OTP verification
type VerifyOTPResponse struct {
	Verified  bool   `json:"verified"`
	Message   string `json:"message"`
	UserID    string `json:"userId,omitempty"`
}

// ChannelOTPRecord represents the OTP stored in Dgraph (matches ChannelOTP schema)
type ChannelOTPRecord struct {
	UID         string    `json:"uid,omitempty"`
	ChannelHash string    `json:"channelHash"`    // Hashed email/phone for privacy
	ChannelType string    `json:"channelType"`    // "email", "sms", "whatsapp", etc.
	OTPHash     string    `json:"otpHash"`        // Hashed OTP code for security
	Verified    bool      `json:"verified"`       // Whether OTP has been verified
	ExpiresAt   time.Time `json:"expiresAt"`      // When OTP expires
	CreatedAt   time.Time `json:"createdAt"`      // When OTP was created
	UserID      string    `json:"userId,omitempty"` // Optional user link
	Purpose     string    `json:"purpose"`        // "signin", "signup", etc.
	Used        bool      `json:"used"`           // Whether OTP consumed
}

// GenerateOTP generates a 6-digit numerical OTP
func generateOTP() (string, error) {
	max := big.NewInt(999999)
	min := big.NewInt(100000)
	
	n, err := rand.Int(rand.Reader, max.Sub(max, min).Add(max, big.NewInt(1)))
	if err != nil {
		return "", err
	}
	
	return fmt.Sprintf("%06d", n.Add(n, min).Int64()), nil
}

// hashString creates a SHA256 hash of the input string
func hashString(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

// verifyHash compares a plain text value with its hash
func verifyHash(plaintext, hash string) bool {
	return hashString(plaintext) == hash
}

// storeOTPInDgraph stores the OTP record in Dgraph using DQL mutation
func storeOTPInDgraph(_ context.Context, otpCode, channel, recipient, userID, purpose string, expiresAt time.Time) (string, error) {
	createdAt := time.Now()
	
	// Hash sensitive data for privacy
	channelHash := hashString(recipient)
	otpHash := hashString(otpCode)
	
	// Build DQL mutation using ChannelOTP schema
	// TODO: This mutation will be used when proper Query function is available
	_ = fmt.Sprintf(`
		mutation {
			set {
				_:channelotp <channelHash> "%s" .
				_:channelotp <channelType> "%s" .
				_:channelotp <otpHash> "%s" .
				_:channelotp <verified> "false" .
				_:channelotp <expiresAt> "%s" .
				_:channelotp <createdAt> "%s" .
				_:channelotp <userId> "%s" .
				_:channelotp <purpose> "%s" .
				_:channelotp <used> "false" .
				_:channelotp <dgraph.type> "ChannelOTP" .
			}
		}`,
		channelHash, channel, otpHash,
		expiresAt.Format(time.RFC3339),
		createdAt.Format(time.RFC3339),
		userID, purpose,
	)
	
	// TODO: Use proper Modus Query function - this will be available at runtime
	// For now, using placeholder to complete the structure
	result := `{"data":{"uids":{"otp":"0x123"}}}`
	// Placeholder - will be replaced with actual Query call
	// var err error = nil
	
	// Parse DQL response to get UID
	var response struct {
		Data struct {
			UIDs map[string]string `json:"uids"`
		} `json:"data"`
	}
	
	if err := json.Unmarshal([]byte(result), &response); err != nil {
		return "", fmt.Errorf("failed to parse Dgraph response: %w", err)
	}
	
	otpUID, exists := response.Data.UIDs["otp"]
	if !exists {
		return "", fmt.Errorf("failed to get OTP UID from response")
	}
	
	return otpUID, nil
}

// sendOTPViaEmail sends OTP via email using HermesMailer
func sendOTPViaEmail(ctx context.Context, recipient, otpCode, purpose string) error {
	// API key is handled by modus.json connection automatically
	mailer := hermesmailer.NewHermesMailer("")
	
	req := &hermesmailer.SendTemplateRequest{
		FromName:   "DO Study Platform",
		FromEmail:  "info@darkolive.co.uk", // TODO: Configure proper from email
		ToName:     "User",
		ToEmail:    recipient,
		Subject:    fmt.Sprintf("Your OTP Code for %s", purpose),
		TemplateID: "neqvygm91v8l0p7w", // MailerSend template ID
		Variables: map[string]string{
			"otp_code": otpCode,
			"purpose":  purpose,
			"expires":  "5 minutes",
		},
		Tags: []string{"otp", "authentication"},
	}
	
	_, err := mailer.Send(ctx, req)
	return err
}

// sendOTPViaOtherChannels sends OTP via SMS, WhatsApp, or Telegram using IrisMessage
func sendOTPViaOtherChannels(_ context.Context, channel OTPChannel, _ string, _ string, _ string) error {
	// TODO: Implement IrisMessage integration for SMS, WhatsApp, Telegram
	// This is a placeholder until IrisMessage agent is implemented
	
	// Format message for different channels
	// message := fmt.Sprintf("Your OTP code for %s is: %s. This code expires in 5 minutes.", purpose, otpCode)
	
	switch channel {
	case ChannelSMS:
		// TODO: Call IrisMessage SMS function
		return fmt.Errorf("SMS channel not yet implemented - waiting for IrisMessage agent")
	case ChannelWhatsApp:
		// TODO: Call IrisMessage WhatsApp function
		return fmt.Errorf("whatsApp channel not yet implemented - waiting for IrisMessage agent")
	case ChannelTelegram:
		// TODO: Call IrisMessage Telegram function
		return fmt.Errorf("telegram channel not yet implemented - waiting for IrisMessage agent")
	default:
		return fmt.Errorf("unsupported channel: %s", channel)
	}
}

// SendOTP is the main exported function to generate and send OTP
func SendOTP(ctx context.Context, req OTPRequest) (OTPResponse, error) {
	// Validate request
	if req.Channel == "" {
		return OTPResponse{}, fmt.Errorf("channel is required")
	}
	if req.Recipient == "" {
		return OTPResponse{}, fmt.Errorf("recipient is required")
	}
	
	// Set hardcoded default values
	expiryMins := 5 // Fixed 5 minutes expiry
	purpose := "authentication" // Fixed purpose
	
	// Generate OTP
	otpCode, err := generateOTP()
	if err != nil {
		return OTPResponse{}, fmt.Errorf("failed to generate OTP: %w", err)
	}
	
	// Calculate expiry time
	expiresAt := time.Now().Add(time.Duration(expiryMins) * time.Minute)
	
	// Store OTP in Dgraph
	otpID, err := storeOTPInDgraph(ctx, otpCode, string(req.Channel), req.Recipient, req.UserID, purpose, expiresAt)
	if err != nil {
		return OTPResponse{}, fmt.Errorf("failed to store OTP: %w", err)
	}
	
	// Send OTP via selected channel
	var sendErr error
	switch req.Channel {
	case ChannelEmail:
		sendErr = sendOTPViaEmail(ctx, req.Recipient, otpCode, purpose)
	case ChannelSMS, ChannelWhatsApp, ChannelTelegram:
		sendErr = sendOTPViaOtherChannels(ctx, req.Channel, req.Recipient, otpCode, purpose)
	default:
		sendErr = fmt.Errorf("unsupported channel: %s", req.Channel)
	}
	
	response := OTPResponse{
		OTPID:     otpID,
		Sent:      sendErr == nil,
		Verified:  false, // OTP not verified yet
		Channel:   req.Channel,
		ExpiresAt: expiresAt,
	}
	
	if sendErr != nil {
		response.Message = fmt.Sprintf("OTP generated but failed to send: %v", sendErr)
	} else {
		response.Message = fmt.Sprintf("OTP sent successfully via %s", req.Channel)
	}
	
	return response, nil
}

// VerifyOTP verifies an OTP code against the database
func VerifyOTP(ctx context.Context, req VerifyOTPRequest) (VerifyOTPResponse, error) {
	// Validate request
	if req.OTPID == "" {
		return VerifyOTPResponse{}, fmt.Errorf("otpId is required")
	}
	if req.OTPCode == "" {
		return VerifyOTPResponse{}, fmt.Errorf("otpCode is required")
	}
	if req.Recipient == "" {
		return VerifyOTPResponse{}, fmt.Errorf("recipient is required")
	}
	
	// Query OTP from Dgraph
	otpRecord, err := getOTPFromDgraph(ctx, req.OTPID)
	if err != nil {
		return VerifyOTPResponse{
			Verified: false,
			Message:  fmt.Sprintf("Failed to retrieve OTP: %v", err),
		}, nil
	}
	
	// Check if OTP exists
	if otpRecord == nil {
		return VerifyOTPResponse{
			Verified: false,
			Message:  "OTP not found or invalid",
		}, nil
	}
	
	// Check if OTP is already used
	if otpRecord.Used {
		return VerifyOTPResponse{
			Verified: false,
			Message:  "OTP has already been used",
		}, nil
	}
	
	// Check if OTP is expired
	if time.Now().After(otpRecord.ExpiresAt) {
		return VerifyOTPResponse{
			Verified: false,
			Message:  "OTP has expired",
		}, nil
	}
	
	// Check if recipient matches (compare hashed values)
	recipientHash := hashString(req.Recipient)
	if otpRecord.ChannelHash != recipientHash {
		return VerifyOTPResponse{
			Verified: false,
			Message:  "Recipient does not match",
		}, nil
	}
	
	// Check if OTP code matches (compare hashed values)
	if !verifyHash(req.OTPCode, otpRecord.OTPHash) {
		return VerifyOTPResponse{
			Verified: false,
			Message:  "Invalid OTP code",
		}, nil
	}
	
	// Mark OTP as used in database
	err = markOTPAsUsed(ctx, req.OTPID)
	if err != nil {
		return VerifyOTPResponse{
			Verified: false,
			Message:  fmt.Sprintf("Failed to mark OTP as used: %v", err),
		}, nil
	}
	
	// OTP verification successful
	return VerifyOTPResponse{
		Verified: true,
		Message:  "OTP verified successfully",
		UserID:   otpRecord.UserID,
	}, nil
}

// getOTPFromDgraph retrieves an OTP record from Dgraph by ID
func getOTPFromDgraph(ctx context.Context, otpID string) (*ChannelOTPRecord, error) {
	// TODO: Implement Dgraph query to get OTP by ID
	// For now, return a placeholder implementation
	// This would typically use a GraphQL query like:
	// query { getOTP(id: "$otpID") { uid otp.code otp.recipient otp.used otp.expiresAt } }
	
	// Placeholder - in real implementation, query Dgraph
	return nil, fmt.Errorf("getOTPFromDgraph not yet implemented")
}

// markOTPAsUsed marks an OTP as used in Dgraph
func markOTPAsUsed(ctx context.Context, otpID string) error {
	// TODO: Implement Dgraph mutation to mark OTP as used
	// For now, return a placeholder implementation
	// This would typically use a GraphQL mutation like:
	// mutation { updateOTP(input: {filter: {id: ["$otpID"]}, set: {otp.used: true}}) }
	
	// Placeholder - in real implementation, update Dgraph
	return fmt.Errorf("markOTPAsUsed not yet implemented")
}