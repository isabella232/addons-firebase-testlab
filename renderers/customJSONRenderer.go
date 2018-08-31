package renderers

import (
	"encoding/json"
	"io"

	"github.com/gobuffalo/buffalo/render"
)

type jsonRenderer struct {
	value interface{}
}

func (s jsonRenderer) ContentType() string {
	return "application/json"
}

func (s jsonRenderer) Render(w io.Writer, data render.Data) error {
	encoder := json.NewEncoder(w)
	encoder.SetEscapeHTML(false)
	return encoder.Encode(s.value)
}

// JSON renders the value using the "application/json"
// content type.
func JSON(v interface{}) render.Renderer {
	return jsonRenderer{value: v}
}
