package models

import (
	"encoding/json"
	"time"

	"github.com/markbates/pop"
	"github.com/markbates/validate"
	"github.com/markbates/validate/validators"
	"github.com/satori/go.uuid"
)

// App ...
type App struct {
	ID              uuid.UUID `json:"id" db:"id"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
	Plan            string    `json:"plan" db:"plan"`
	AppSlug         string    `json:"app_slug" db:"app_slug"`
	BitriseAPIToken string    `json:"-" db:"bitrise_api_token"` // to have authentication when making requests to Bitrise API
	APIToken        string    `json:"api_token" db:"api_token"` // to authenticate incoming requests from running builds
}

// String is not required by pop and may be deleted
func (a App) String() string {
	ja, err := json.Marshal(a)
	if err != nil {
		return ""
	}
	return string(ja)
}

// Apps is not required by pop and may be deleted
type Apps []App

// String is not required by pop and may be deleted
func (a Apps) String() string {
	ja, err := json.Marshal(a)
	if err != nil {
		return ""
	}
	return string(ja)
}

// Validate gets run everytime you call a "pop.Validate" method.
// This method is not required and may be deleted.
func (a *App) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: a.Plan, Name: "Plan"},
		&validators.StringIsPresent{Field: a.AppSlug, Name: "AppSlug"},
	), nil
}

// ValidateSave gets run everytime you call "pop.ValidateSave" method.
// This method is not required and may be deleted.
func (a *App) ValidateSave(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run everytime you call "pop.ValidateUpdate" method.
// This method is not required and may be deleted.
func (a *App) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
