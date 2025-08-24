#!/bin/bash

echo "🚀 Auto-Deploy ViaCRM Module"
echo "============================"

# Build the module
echo "📦 Building module..."
python3 /home/martin/espocrm/viaCRM-modul/build.py

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Find the latest ZIP file
    LATEST_ZIP=$(ls -t /home/martin/espocrm/viaCRM-modul/ViaCrm-*.zip 2>/dev/null | head -1)
    
    if [ -f "$LATEST_ZIP" ]; then
        echo "📤 Deploying: $(basename $LATEST_ZIP)"
        
        # Copy to Docker container
        docker cp "$LATEST_ZIP" espocrm-espo-1:/var/www/html/data/upload/extensions/
        
        if [ $? -eq 0 ]; then
            echo "✅ Module deployed successfully!"
            echo ""
            echo "Next steps:"
            echo "1. Go to http://localhost:8080/#Admin/extensions"
            echo "2. Install the module"
            echo "3. Clear cache & rebuild"
        else
            echo "❌ Failed to copy to Docker container"
        fi
    else
        echo "❌ No ZIP file found"
    fi
else
    echo "❌ Build failed"
fi