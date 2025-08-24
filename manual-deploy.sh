#!/bin/bash

echo "Manual Deploy Script for ViaCRM"
echo "================================"

# Copy the ZIP to a temporary location accessible by Docker
cp /home/martin/espocrm/viaCRM-modul/dist/ViaCrm-2.1.4.zip /tmp/ViaCrm-2.1.4.zip

# Create extensions directory in container
docker exec espocrm-espo-1 mkdir -p /var/www/html/data/upload/extensions

# Copy from temp location to Docker
docker cp /tmp/ViaCrm-2.1.4.zip espocrm-espo-1:/var/www/html/data/upload/extensions/

echo "✅ Deploy complete!"
echo "Go to http://localhost:8080/#Admin/extensions to install"