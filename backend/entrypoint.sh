#!/bin/bash
set -e

# Default PORT to 10000 if not set (Render standard)
PORT="${PORT:-10000}"

# Configure Apache to listen on Render's dynamic PORT
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Set DocumentRoot to Laravel public
sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Setup SQLite database if no external database host/url is configured
if [ -z "$DB_HOST" ] && [ -z "$DATABASE_URL" ]; then
    echo "No external DB detected. Initializing SQLite database..."
    export DB_CONNECTION=sqlite
    mkdir -p /var/www/html/database
    touch /var/www/html/database/database.sqlite
    chown -R www-data:www-data /var/www/html/database
    chmod -R 775 /var/www/html/database
fi

# Clear and rebuild cache
php artisan optimize:clear || true

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force --no-interaction || echo "Migration warning (continuing)"

# Seed initial menu, tables, and demo data if needed
echo "Seeding initial database records..."
php artisan db:seed --force --no-interaction || echo "Seed skipped or already seeded"

# Ensure storage symlink exists for uploaded product images
php artisan storage:link || true

# Ensure proper permissions across storage, cache, and database
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

echo "Starting Apache web server on port ${PORT}..."
exec apache2-foreground
