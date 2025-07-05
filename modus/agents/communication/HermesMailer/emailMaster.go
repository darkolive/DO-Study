package hermesmailer

import (
	"context"
	"fmt"
	"time"

	"github.com/mailersend/mailersend-go"
)

type HermesMailer struct {
	client *mailersend.Mailersend
}

func NewHermesMailer(apiKey string) *HermesMailer {
	return &HermesMailer{
		client: mailersend.NewMailersend(apiKey),
	}
}

type SendTemplateRequest struct {
	FromName   string            `json:"fromName"`
	FromEmail  string            `json:"fromEmail"`
	ToName     string            `json:"toName"`
	ToEmail    string            `json:"toEmail"`
	Subject    string            `json:"subject"`
	TemplateID string            `json:"templateId"`
	Variables  map[string]string `json:"variables"`
	Tags       []string          `json:"tags,omitempty"`
}

type SendTemplateResponse struct {
	MessageID string `json:"messageId"`
}

func (h *HermesMailer) Send(ctx context.Context, req *SendTemplateRequest) (*SendTemplateResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	from := mailersend.From{
		Name:  req.FromName,
		Email: req.FromEmail,
	}
	recipients := []mailersend.Recipient{
		{Name: req.ToName, Email: req.ToEmail},
	}
	personalization := []mailersend.Personalization{
		{
			Email: req.ToEmail,
			Data:  map[string]interface{}{},
		},
	}
	for k, v := range req.Variables {
		personalization[0].Data[k] = v
	}

	message := h.client.Email.NewMessage()
	message.SetFrom(from)
	message.SetRecipients(recipients)
	message.SetSubject(req.Subject)
	message.SetTemplateID(req.TemplateID)
	message.SetPersonalization(personalization)
	message.SetTags(req.Tags)

	res, err := h.client.Email.Send(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("failed to send: %w", err)
	}

	return &SendTemplateResponse{MessageID: res.Header.Get("X-Message-Id")}, nil
}