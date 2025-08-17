#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <project_name_or_path>"
	exit 1
fi

ARG="$1"

# If ARG is an absolute or relative path (contains a /), use it as-is; otherwise assume it's under $HOME
if [[ "$ARG" == */* || "$ARG" == /* ]]; then
	TARGET_DIR="$ARG"
else
	TARGET_DIR="$HOME/$ARG"
fi

if [[ ! -d "$TARGET_DIR" ]]; then
	echo "Error: directory not found: $TARGET_DIR"
	exit 1
fi

cd "$TARGET_DIR"

if [[ ! -f "docker-compose.yml" && ! -f "docker-compose.yaml" ]]; then
	echo "Error: docker-compose file not found in $TARGET_DIR"
	exit 1
fi

if command -v docker-compose >/dev/null 2>&1; then
	COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
	COMPOSE_CMD="docker compose"
else
	echo "Error: neither docker-compose nor 'docker compose' is available on PATH."
	exit 1
fi

echo "Bringing down existing services and removing images..."
$COMPOSE_CMD down --rmi all

echo "Rebuilding and starting services..."
$COMPOSE_CMD up --build