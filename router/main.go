package router

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"

	"github.com/gin-gonic/gin"
)

func SetRouter(router *gin.Engine) {
	SetApiRouter(router)
	SetDashboardRouter(router)
	SetRelayRouter(router)
	SetVideoRouter(router)
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.URL.Path, "/v1") || strings.HasPrefix(c.Request.URL.Path, "/api") {
			controller.RelayNotFound(c)
			return
		}
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "not found",
		})
	})
}
