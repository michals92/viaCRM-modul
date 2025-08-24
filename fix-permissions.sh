#!/bin/bash

# Fix permissions for ViaCRM module in Docker environment

echo "🔧 Fixing permissions for ViaCRM module..."

# Fix ownership of main module directory
echo "Setting ownership of main directories..."
docker exec espocrm chown www-data:www-data /var/www/html/application/Espo/Modules/ViaCrm 2>/dev/null
docker exec espocrm chown www-data:www-data /var/www/html/client/modules/viacrm 2>/dev/null

# Set correct ownership for all backend files recursively
echo "Setting ownership of backend files..."
docker exec espocrm chown -R www-data:www-data /var/www/html/application/Espo/Modules/ViaCrm/ 2>/dev/null || echo "Backend files not found"

# Set correct ownership for all client files recursively  
echo "Setting ownership of client files..."
docker exec espocrm chown -R www-data:www-data /var/www/html/client/modules/viacrm/ 2>/dev/null || echo "Client files not found"

# Set directory permissions (755 = rwxr-xr-x)
echo "Setting directory permissions..."
docker exec espocrm find /var/www/html/application/Espo/Modules/ViaCrm/ -type d -exec chmod 755 {} \; 2>/dev/null
docker exec espocrm find /var/www/html/client/modules/viacrm/ -type d -exec chmod 755 {} \; 2>/dev/null

# Set file permissions (644 = rw-r--r--)
echo "Setting file permissions..."
docker exec espocrm find /var/www/html/application/Espo/Modules/ViaCrm/ -type f -exec chmod 644 {} \; 2>/dev/null
docker exec espocrm find /var/www/html/client/modules/viacrm/ -type f -exec chmod 644 {} \; 2>/dev/null

# Fix data directory permissions if it exists
echo "Fixing data directory permissions..."
docker exec espocrm chown -R www-data:www-data /var/www/html/data/ 2>/dev/null || echo "Data directory already correct"
docker exec espocrm chmod -R 755 /var/www/html/data/ 2>/dev/null || echo "Data directory permissions already correct"

# Clear cache and rebuild
echo "Clearing cache and rebuilding..."
docker exec espocrm php /var/www/html/clear_cache.php 2>/dev/null || echo "Cache clear failed"
docker exec espocrm php /var/www/html/rebuild.php 2>/dev/null || echo "Rebuild failed"

# Final verification
echo "Verifying permissions..."
docker exec espocrm ls -la /var/www/html/application/Espo/Modules/ViaCrm/ 2>/dev/null || echo "Backend verification failed"
docker exec espocrm ls -la /var/www/html/client/modules/viacrm/ 2>/dev/null || echo "Client verification failed"

echo "✅ Permissions fix completed!"
echo "If you still get permission errors, try restarting the Docker container:"
echo "docker restart espocrm"