#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entityName = process.argv[2];

if (!entityName) {
    console.error('Usage: node newEntity.js <EntityName>');
    console.error('Example: node newEntity.js Product');
    process.exit(1);
}

if (!/^[A-Z][a-zA-Z0-9]*$/.test(entityName)) {
    console.error('Entity name must start with uppercase letter and contain only letters and numbers');
    process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
let moduleName = '';

try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.espocrm && packageJson.espocrm.extensionName) {
        moduleName = packageJson.espocrm.extensionName;
    }
    console.log(`Using module name from package.json: ${moduleName}`);
} catch (error) {
    console.warn(`Warning: Could not read package.json, exiting.`);
    process.exit(1);
}

const basePath = path.join(__dirname, '..', 'src', 'backend');

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

function writeJsonFile(filePath, content) {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(content, null, 4));
    console.log(`Created: ${filePath}`);
}

function writePhpFile(filePath, content) {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
    console.log(`Created: ${filePath}`);
}

console.log(`\nCreating new entity: ${entityName}`);
console.log('================================\n');

// 1. Create entityDefs
const entityDefsPath = path.join(basePath, 'Resources', 'metadata', 'entityDefs', `${entityName}.json`);
const entityDefs = {
    "table": entityName.toLowerCase(),
    "languageCategory": entityName,
    "fields": {
        "name": {
            "type": "varchar",
            "required": true,
            "trim": true
        },
        "status": {
            "type": "enum",
            "options": ["Active", "Inactive"],
            "default": "Active"
        },
        "description": {
            "type": "text"
        },
        "createdAt": {
            "type": "datetime",
            "readOnly": true
        },
        "modifiedAt": {
            "type": "datetime",
            "readOnly": true
        },
        "createdBy": {
            "type": "link",
            "readOnly": true,
            "view": "views/fields/user"
        },
        "modifiedBy": {
            "type": "link",
            "readOnly": true,
            "view": "views/fields/user"
        },
        "assignedUser": {
            "type": "link",
            "required": false,
            "view": "views/fields/assigned-user"
        },
        "teams": {
            "type": "linkMultiple",
            "view": "views/fields/teams"
        }
    },
    "links": {
        "createdBy": {
            "type": "belongsTo",
            "entity": "User"
        },
        "modifiedBy": {
            "type": "belongsTo",
            "entity": "User"
        },
        "assignedUser": {
            "type": "belongsTo",
            "entity": "User"
        },
        "teams": {
            "type": "hasMany",
            "entity": "Team",
            "relationName": "entityTeam",
            "layoutRelationshipsDisabled": true
        }
    },
    "collection": {
        "orderBy": "createdAt",
        "order": "desc"
    },
    "indexes": {
        "name": {
            "columns": ["name", "deleted"]
        },
        "assignedUser": {
            "columns": ["assignedUserId", "deleted"]
        },
        "createdAt": {
            "columns": ["createdAt", "deleted"]
        }
    }
};
writeJsonFile(entityDefsPath, entityDefs);

// 2. Create scopes
const scopesPath = path.join(basePath, 'Resources', 'metadata', 'scopes', `${entityName}.json`);
const scopes = {
    "entity": true,
    "tab": true,
    "layouts": true,
    "acl": true,
    "customizable": true,
    "importable": true,
    "stream": false,
    "disabled": false,
    "type": "Base",
    "module": moduleName,
    "object": true
};
writeJsonFile(scopesPath, scopes);

// 3. Create clientDefs
const clientDefsPath = path.join(basePath, 'Resources', 'metadata', 'clientDefs', `${entityName}.json`);
const clientDefs = {
    "controller": "controllers/record",
    "iconClass": "fas fa-cube",
    "color": "#3498db"
};
writeJsonFile(clientDefsPath, clientDefs);

// 4. Create list layout
const listLayoutPath = path.join(basePath, 'Resources', 'layouts', entityName, 'list.json');
const listLayout = [
    {
        "name": "name",
        "link": true
    },
    {
        "name": "status",
        "width": 30
    },
    {
        "name": "assignedUser",
        "width": 25
    },
    {
        "name": "createdAt",
        "width": 20
    }
];
writeJsonFile(listLayoutPath, listLayout);

// 5. Create detail layout
const detailLayoutPath = path.join(basePath, 'Resources', 'layouts', entityName, 'detail.json');
const detailLayout = [
    {
        "rows": [
            [
                {
                    "name": "name"
                },
                {
                    "name": "status"
                }
            ],
            [
                {
                    "name": "assignedUser"
                },
                false
            ],
            [
                {
                    "name": "description",
                    "fullWidth": true
                }
            ]
        ]
    }
];
writeJsonFile(detailLayoutPath, detailLayout);

// 6. Create listSmall layout
const listSmallLayoutPath = path.join(basePath, 'Resources', 'layouts', entityName, 'listSmall.json');
const listSmallLayout = [
    {
        "name": "name",
        "link": true
    },
    {
        "name": "status"
    }
];
writeJsonFile(listSmallLayoutPath, listSmallLayout);

// 7. Create detailSmall layout
const detailSmallLayoutPath = path.join(basePath, 'Resources', 'layouts', entityName, 'detailSmall.json');
const detailSmallLayout = [
    {
        "rows": [
            [
                {
                    "name": "name"
                }
            ],
            [
                {
                    "name": "status"
                }
            ],
            [
                {
                    "name": "teams"
                }
            ]
        ]
    }
];
writeJsonFile(detailSmallLayoutPath, detailSmallLayout);

// 8. Create search filters layout
const filtersLayoutPath = path.join(basePath, 'Resources', 'layouts', entityName, 'filters.json');
const filtersLayout = [
    "status",
    "assignedUser",
    "teams"
];
writeJsonFile(filtersLayoutPath, filtersLayout);

// 9. Create mass update layout
const massUpdateLayoutPath = path.join(basePath, 'Resources', 'layouts', entityName, 'massUpdate.json');
const massUpdateLayout = [
    "status",
    "assignedUser",
    "teams"
];
writeJsonFile(massUpdateLayoutPath, massUpdateLayout);

// 10. Create Entity PHP class
const entityPhpPath = path.join(basePath, 'Entities', `${entityName}.php`);
const entityPhpContent = `<?php

namespace Espo\\Modules\\${moduleName}\\Entities;

use Espo\\Core\\Templates\\Entities\\Base;

class ${entityName} extends Base
{
    public const ENTITY_TYPE = '${entityName}';
    
}
`;
writePhpFile(entityPhpPath, entityPhpContent);

// 11. Skip Repository - not needed for Base entities

// 12. Create Controller PHP class
const controllerPhpPath = path.join(basePath, 'Controllers', `${entityName}.php`);
const controllerPhpContent = `<?php

namespace Espo\\Modules\\${moduleName}\\Controllers;

use Espo\\Core\\Controllers\\Record;

class ${entityName} extends Record
{
}
`;
writePhpFile(controllerPhpPath, controllerPhpContent);

// 13. Create Service PHP class
const servicePhpPath = path.join(basePath, 'Services', `${entityName}.php`);
const servicePhpContent = `<?php

namespace Espo\\Modules\\${moduleName}\\Services;

use Espo\\Services\\Record;

class ${entityName} extends Record
{
}
`;
writePhpFile(servicePhpPath, servicePhpContent);

// 14. Create language files
const i18nEnPath = path.join(basePath, 'Resources', 'i18n', 'en_US', `${entityName}.json`);
const i18nEn = {
    "fields": {
        "name": "Name",
        "status": "Status",
        "description": "Description",
        "assignedUser": "Assigned User",
        "teams": "Teams",
        "createdAt": "Created At",
        "modifiedAt": "Modified At",
        "createdBy": "Created By",
        "modifiedBy": "Modified By"
    },
    "options": {
        "status": {
            "Active": "Active",
            "Inactive": "Inactive"
        }
    },
    "links": {
        "assignedUser": "Assigned User",
        "teams": "Teams",
        "createdBy": "Created By",
        "modifiedBy": "Modified By"
    },
    "labels": {
        "Create": `Create ${entityName}`,
        "View List": `View ${entityName} List`
    }
};
writeJsonFile(i18nEnPath, i18nEn);

// 15. Add entity to global language
const globalI18nPath = path.join(basePath, 'Resources', 'i18n', 'en_US', 'Global.json');
let globalI18n = {};
if (fs.existsSync(globalI18nPath)) {
    const content = fs.readFileSync(globalI18nPath, 'utf8');
    globalI18n = JSON.parse(content);
}
if (!globalI18n.scopeNames) {
    globalI18n.scopeNames = {};
}
if (!globalI18n.scopeNamesPlural) {
    globalI18n.scopeNamesPlural = {};
}
globalI18n.scopeNames[entityName] = entityName;
globalI18n.scopeNamesPlural[entityName] = entityName;
writeJsonFile(globalI18nPath, globalI18n);

console.log('\n================================');
console.log(`✅ Entity "${entityName}" created successfully!`);
console.log('\nNext steps:');
console.log('1. Run "npm run build" to compile the module');
console.log('2. Clear cache in EspoCRM Administration');
console.log('3. Rebuild in EspoCRM Administration');
console.log(`4. The entity "${entityName}" should now appear in the menu`);
console.log('\nGenerated files can be found in:');
console.log(`  ${basePath}`);