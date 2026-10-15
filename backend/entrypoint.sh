#!/bin/bash
set -e

# Default PORT to 10000 if not set (Render standard)
PORT="${PORT:-10000}"

# Configure Apache to listen on Render's dynamic PORT
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Set DocumentRoot to Laravel public
sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Clear and rebuild cache
php artisan optimize:clear

# Run database migrations if database environment variables exist
if [ -n "$DB_HOST" ] || [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    php artisan migrate --force --no-interaction || echo "Migrations finished or skipped"
fi

# Ensure storage symlink exists for uploaded images
php artisan storage:link || true

# Ensure proper permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "Starting Apache web server on port ${PORT}..."
exec apache2-foreground
