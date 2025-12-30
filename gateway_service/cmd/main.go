package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/CogniVox-Research/gatewar-server-R-D/internal/config"
	"github.com/CogniVox-Research/gatewar-server-R-D/internal/logger"
	"github.com/CogniVox-Research/gatewar-server-R-D/internal/server"
)


func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Println("config load error:", err)
		os.Exit(1)
	}

	lgr, err:= logger.NewLogger(cfg.App.Env)
	if err != nil {
		fmt.Println("logger init error:", err)
		os.Exit(1)
	}

	defer lgr.Sync()

	app := server.NewFiberApp(cfg, lgr)

	go func ()  {
		addr := fmt.Sprintf(":%v", cfg.App.Port)
		lgr.Sugar().Infof("starting  server on %s", addr)
		if app.Listen(addr); err != nil {
			lgr.Sugar().Fatalf("listen error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	lgr.Sugar().Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		lgr.Sugar().Errorf("server shutdown error: %v", err)
	}

    lgr.Sugar().Info("server stopped")
}