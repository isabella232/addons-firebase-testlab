package models

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gobuffalo/pop"
	"github.com/gobuffalo/uuid"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"
)

// TestReport ...
type TestReport struct {
	ID               uuid.UUID        `json:"id" db:"id"`
	Name             string           `json:"name" db:"name"`
	Filename         string           `json:"filename" db:"filename"`
	Filesize         int              `json:"filesize" db:"filesize"`
	Step             json.RawMessage  `json:"step" db:"step"`
	Uploaded         bool             `json:"uploaded" db:"uploaded"`
	AppSlug          string           `json:"app_slug" db:"app_slug"`
	BuildSlug        string           `json:"build_slug" db:"build_slug"`
	CreatedAt        time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time        `json:"-" db:"updated_at"`
	TestReportAssets TestReportAssets `has_many:"test_report_assets" json:"assets" db:"-"`
}

// Validate ...
func (t *TestReport) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: t.Filename, Name: "Filename"},
		&validators.IntIsGreaterThan{Field: t.Filesize, Compared: 0, Name: "Filesize"},
	), nil
}

// PathInBucket ...
func (t *TestReport) PathInBucket() string {
	return fmt.Sprintf("builds/%s/test_reports/%s/%s", t.BuildSlug, t.ID, t.Filename)
}
