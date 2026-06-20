#!/usr/bin/env bash
# Local dev run: loads backend/.env (gitignored) then starts the backend.
set -euo pipefail
cd "$(dirname "$0")"
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi
exec mvnd spring-boot:run -Dspring-boot.run.profiles=dev
