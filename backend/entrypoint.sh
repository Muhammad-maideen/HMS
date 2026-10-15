#!/bin/bash
set -e

# Default PORT to 10000 if not set (Render standard)
export PORT="${PORT:-10000}"

# Tell Apache to listen on PORT
echo "Listen ${PORT}" > /etc/apache2/ports.conf

# Ensure .env exists and has required keys
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Write environment variables into .env
php -r "
\$envFile = '/var/www/html/.env';
\$content = file_exists(\$envFile) ? file_get_contents(\$envFile) : '';
\$keys = ['APP_KEY', 'APP_NAME', 'APP_ENV', 'APP_DEBUG', 'APP_URL', 'DB_CONNECTION', 'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'];
foreach (\$keys as \$k) {
    \$val = getenv(\$k);
    if (\$val !== false && \$val !== '') {
        if (preg_match('/^' . \$k . '=/m', \$content)) {
            \$content = preg_replace('/^' . \$k . '=.*$/m', \$k . '=\"' . \$val . '\"', \$content);
        } else {
            \$content .= \"\n\" . \$k . '=\"' . \$val . '\"';
        }
    }
}
file_put_contents(\$envFile, \$content);
"

# Setup SQLite database if no external database is configured
if [ -z "$DB_HOST" ] && [ -z "$DATABASE_URL" ]; then
    echo "Using SQLite database..."
    touch /var/www/html/database/database.sqlite
    chmod 666 /var/www/html/database/database.sqlite
fi

# Rebuild Laravel cache
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force --no-interaction || echo "Migration notice"

# Seed initial tables and menu data if needed
echo "Seeding initial database records..."
php artisan db:seed --force --no-interaction || echo "Seed notice"

# Ensure storage symlink exists for uploaded product images
php artisan storage:link || true

# Fix permissions
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

echo "Starting Apache web server on port ${PORT}..."
exec apache2-foreground
