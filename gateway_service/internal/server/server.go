package server

import (
	"time"

	"github.com/CogniVox-Research/gatewar-server-R-D/internal/config"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
)

func NewFiberApp(cfg *config.Config, l *zap.Logger) *fiber.App{
	app := fiber.New(fiber.Config{
		Prefork: false,
		IdleTimeout: 10 * time.Second,
	})

	app.Use(fiberlogger.New(fiberlogger.Config{
		Format:     "[${time}] ${status} - ${method} ${path}\n",
	}))

	app.Get("/health", func(c * fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{"status":"ok"})
	})

	return app
}