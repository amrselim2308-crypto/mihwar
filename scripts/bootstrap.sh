#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  echo "A .env file already exists. Keep it and edit it manually; refusing to overwrite secrets."
  exit 1
fi

read -r -p "Main domain (example: mihwar.com): " domain
if [[ ! "$domain" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "Invalid domain name."
  exit 1
fi
read -r -p "Storage subdomain [storage.$domain]: " storage_domain
storage_domain="${storage_domain:-storage.$domain}"
if [[ ! "$storage_domain" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "Invalid storage domain name."
  exit 1
fi
read -r -p "First administrator email: " admin_email
if [[ ! "$admin_email" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "Invalid email address."
  exit 1
fi

cp .env.example .env
set_env() {
  local key="$1" value="$2" temp
  temp="$(mktemp)"
  grep -v "^${key}=" .env > "$temp" || true
  printf '%s=%s\n' "$key" "$value" >> "$temp"
  mv "$temp" .env
}

mysql_password="$(openssl rand -hex 24)"
root_password="$(openssl rand -hex 32)"
minio_user="mihwar$(openssl rand -hex 4)"
minio_password="$(openssl rand -hex 32)"
session_secret="$(openssl rand -hex 32)"
admin_setup_token="$(openssl rand -hex 32)"

set_env MIHWAR_DOMAIN "$domain"
set_env STORAGE_DOMAIN "$storage_domain"
set_env BOOTSTRAP_ADMIN_EMAIL "$admin_email"
set_env BOOTSTRAP_ADMIN_TOKEN "$admin_setup_token"
set_env SESSION_SECRET "$session_secret"
set_env MYSQL_PASSWORD "$mysql_password"
set_env MYSQL_ROOT_PASSWORD "$root_password"
set_env DATABASE_URL "mysql://mihwar:${mysql_password}@db:3306/mihwar"
set_env S3_ACCESS_KEY_ID "$minio_user"
set_env S3_SECRET_ACCESS_KEY "$minio_password"
set_env S3_ENDPOINT "http://minio:9000"
set_env S3_PUBLIC_ENDPOINT "https://${storage_domain}"
set_env S3_BUCKET "mihwar-private"
set_env S3_FORCE_PATH_STYLE "true"

chmod 600 .env
echo
echo "Created .env with unique secrets."
echo "Admin setup token (save it securely; required during the first admin registration): $admin_setup_token"
echo "Before starting: point $domain and $storage_domain DNS A records to this server and open TCP ports 80/443."
echo "Then run: docker compose up -d --build"
