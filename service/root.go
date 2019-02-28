package service

import (
	"net/http"

	"github.com/bitrise-io/addons-firebase-testlab/metrics"
	"github.com/bitrise-io/addons-firebase-testlab/trackables"
	"github.com/github.com/bitrise-io/api-utils/httpresponse"
)

// RootHandler ...
func RootHandler(w http.ResponseWriter, r *http.Request) {
	client := metrics.NewDogStatsDMetrics("")
	client.Track(trackables.Root{}, "rootPathOpened")

	httpresponse.RespondWithJSONNoErr(w, http.StatusOK, RootResponseItemModel{
		Message: "Welcome to Bitrise Testing Addon",
	})
}
