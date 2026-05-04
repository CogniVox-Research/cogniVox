#!/bin/bash
poetry install
poetry run fastapi run --port 8005
