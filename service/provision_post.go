package service

// ProvisionData ...
type ProvisionData struct {
	Plan            string `json:"plan"`
	AppSlug         string `json:"app_slug"`
	BitriseAPIToken string `json:"api_token"`
}

// Env ...
type Env struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// ProvisionPostHandler ...
func ProvisionPostHandler(w http.ResponseWriter, r *http.Request) error {
	provData := &ProvisionData{}

	err := json.NewDecoder(r.Body).Decode(provData)
	if err != nil {
		log.Errorf("Failed to decode request body, error: %+v", errors.WithStack(err))
		return c.Render(http.StatusBadRequest, r.JSON(map[string]string{"error": "Failed to decode provisioning data"}))
	}

	exists, err := database.IsAppExists(provData.AppSlug)
	if err != nil {
		log.Errorf("Failed to check if App exists in DB, error: %+v", errors.WithStack(err))
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]string{"error": "Internal error"}))
	}
	if exists {
		log.Warnf("  [!] App already exists")
		//return c.Render(http.StatusConflict, r.JSON(map[string]string{"error": "App already exists"}))
	}

	envs := map[string][]Env{}
	hostURL := configs.GetAddonHost()
	envs["envs"] = append(envs["envs"], Env{Key: "ADDON_VDTESTING_API_URL", Value: fmt.Sprintf("%s/test", hostURL)})

	app := &models.App{
		AppSlug:         provData.AppSlug,
		Plan:            provData.Plan,
		BitriseAPIToken: provData.BitriseAPIToken,
	}

	if !exists {
		app.APIToken = generateRandomHash(50)

		err = database.AddApp(app)
		if err != nil {
			log.Errorf("Failed to add app to DB, error: %+v", errors.WithStack(err))
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]string{"error": "Internal error"}))
		}

		analyticsutils.SendAddonEvent(analyticsutils.EventAddonProvisioned, app.AppSlug, "", app.Plan)

		envs["envs"] = append(envs["envs"], Env{Key: "ADDON_VDTESTING_API_TOKEN", Value: app.APIToken})
		return c.Render(200, r.JSON(envs))
	}

	app, err = database.GetApp(app)
	if err != nil {
		log.Errorf("Failed to get app from DB, error: %+v", errors.WithStack(err))
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]string{"error": "Internal error"}))
	}

	envs["envs"] = append(envs["envs"], Env{Key: "ADDON_VDTESTING_API_TOKEN", Value: app.APIToken})
	return c.Render(200, r.JSON(envs))
}