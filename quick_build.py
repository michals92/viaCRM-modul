#!/usr/bin/env python3
import zipfile
import os
import json
from datetime import datetime

# Read package.json for version info
with open('/home/martin/espocrm/viaCRM-modul/package.json', 'r') as f:
    package_json = json.load(f)

version = "2.1.2"
zip_name = f"ViaCrm-v{version}-fixed-views.zip"
zip_path = f"/home/martin/espocrm/viaCRM-modul/{zip_name}"

# Create manifest
manifest = {
    "name": package_json["espocrm"]["extensionName"],
    "version": version,
    "acceptableVersions": [">=8.0.0"],
    "php": [">=8.0.0"],
    "releaseDate": datetime.now().strftime('%Y-%m-%d'),
    "author": package_json["author"],
    "description": package_json["description"]
}

# Create the zip
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Add manifest
    zipf.writestr('manifest.json', json.dumps(manifest, indent=2))
    
    # Add backend files
    backend_src = '/home/martin/espocrm/viaCRM-modul/src/backend'
    for root, dirs, files in os.walk(backend_src):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = file_path.replace(backend_src, 'files/application/Espo/Modules/ViaCrm').replace('\\', '/')
            zipf.write(file_path, arcname)
    
    # Add client files
    client_src = '/home/martin/espocrm/viaCRM-modul/src/client'
    for root, dirs, files in os.walk(client_src):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = file_path.replace(client_src, 'files/client/modules/viacrm').replace('\\', '/')
            zipf.write(file_path, arcname)

print(f"Created {zip_name}")
print(f"Version: {version}")