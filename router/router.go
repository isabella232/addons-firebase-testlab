package router

import (
	"github.com/bitrise-io/addons-firebase-testlab/service"
	"github.com/bitrise-team/bitrise-api/configs"
	v0 "github.com/bitrise-team/bitrise-api/service/v0"
	"gopkg.in/DataDog/dd-trace-go.v1/contrib/gorilla/mux"
)

// New ...
func New(config configs.Model) *mux.Router {
	// StrictSlash: allow "trim slash"; /x/ REDIRECTS to /x
	r := mux.NewRouter(mux.WithServiceName("test-addon-mux")).StrictSlash(true)

	middlewareProvider := v0.MiddlewareProvider{}
	//
	// PROVISIONING
	// POST /provision - ProvisionPostHandler
	// PUT /provision/{app_slug} - ProvisionPutHandler
	// DELETE /provision/{app_slug} - ProvisionDeleteHandler

	//
	// TESTING
	// GET /test/{app_slug}/{build_slug}/{token} - TestGet
	// POST /test/{app_slug}/{build_slug}/{token} - TestPost
	// POST /test/assets/{app_slug}/{build_slug}/{token} - TestAssetsPost
	// GET /test/assets/{app_slug}/{build_slug}/{token} - TestAssetsGet

	//
	// TEST REPORTS
	// POST /test/apps/{app_slug}/builds/{build_slug}/test_reports/{token} - TestReportsPostHandler
	// PATCH /test/apps/{app_slug}/builds/{build_slug}/test_reports/{test_report_id}/{token} - TestReportPatchHandler

	//
	// API
	// GET /api/builds/{build_slug} - DashboardAPIGetHandler
	// GET /api/builds/{build_slug}/steps/{step_id} - StepAPIGetHandler
	// GET /api/builds/{build_slug}/test_reports - TestReportsListHandler

	//
	// DASHBOARD
	// GET /builds/{build_slug} - DashboardIndexGetHandler
	// GET /builds/{build_slug}/steps/{step_id} - DashboardIndexGetHandler
	// GET /templates/dashboard - DashboardGetHandler
	// GET /templates/details - DashboardDetailsGetHandler
	// POST /login - DashboardLoginPostHandler
	// app.ServeFiles("/assets", http.Dir("./frontend/assets/compiled"))         // serve assets for dashboard

	//
	// r.Handle("/v0.1/docs", middlewareProvider.CommonMiddleware().Then(
	// 	service.InternalErrHandlerFuncAdapter(v0.DocumentationHandler))).Methods("GET", "OPTIONS")

	// Root
	r.Handle("/", middlewareProvider.CommonMiddleware().ThenFunc(service.RootHandler))
	r.NotFoundHandler = middlewareProvider.CommonMiddleware().Then(&httpresponse.NotFoundHandler{})

	return r
}
