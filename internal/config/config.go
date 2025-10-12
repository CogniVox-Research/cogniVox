package config

import "github.com/spf13/viper"


type AppConfig struct {
	AppName  string
	Env      string
	Port     string
	LogLevel string
}

type Config struct {
	App AppConfig
}

func Load() (*Config, error) {
	v := viper.New()

	v.SetConfigName("config")
    v.SetConfigType("yaml")
    v.AddConfigPath(".")
    v.AddConfigPath("./internal/config")
    v.AutomaticEnv()

	// v.SetDefault("Port", 8080)
	// v.SetDefault("Env", "development")

	if err := v.ReadInConfig(); err != nil {
		panic(err)
	}

	var cfg Config
	if err:= v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}