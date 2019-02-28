package service

import (
	"github.com/bitrise-team/bitrise-api/models"
	"github.com/bitrise-tools/gotgen/configs"
)

// MiddlewareProvider ...
type MiddlewareProvider struct {
	Config       configs.Model
	DataProvider models.DataInterface
}
