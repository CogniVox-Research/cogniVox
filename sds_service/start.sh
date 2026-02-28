#!/bin/bash
poetry install
poetry run fastapi dev --port 8006
