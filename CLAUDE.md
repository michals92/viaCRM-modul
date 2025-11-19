# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview


## Architecture

### Backend (PHP)
- **Location**: `src/backend/`
- **Structure**: Standard EspoCRM module structure with PSR-4 autoloading (`Espo\Modules\Autocrm\`)
- **Key Components**:
  - `Controllers/` - API endpoints
  - `Services/` - Business logic
  - `Entities/` - ORM models
  - `Core/` - Framework extensions (AclManager, Workflow, Email, Layout extensions)
  - `Classes/` - Utilities and helpers (AppParams, FieldProcessing, Jobs, Utils)
  - `Resources/` - Metadata, layouts, translations (cs_CZ, de_DE, en_US, sk_SK)
  - `EntryPoints/` - Direct access points (Download, Pdf, Xml, PublicDownload)
  - `Hooks/` - Entity hooks for business logic
  - `Api/` - REST API action handlers

### Frontend (TypeScript/JavaScript)
- **Location**: `src/client/src/`
- **Structure**: EspoCRM client-side architecture
- **Key Components**:
  - `views/` - UI components (work-queue, record templates)
  - `controllers/` - Route handlers (admin, email-template, portal-user)
  - `helpers/` - Utility functions (aggregation, colorize, field-highlighter)
  - `extensions/` - View extensions system (controller.js, view-helper.js)
  - `models/` - Client-side models
  - `handlers/` - Dynamic handlers
  - `@types/` - TypeScript definitions (autocrm.d.ts, jsignature.d.ts)

### Easy Email Component
- **Location**: `src/easy-email/`
- **Technology**: React 18 + MJML + easy-email libraries
- **Purpose**: Advanced email template editor with drag-and-drop functionality



### Multi-Version Support
The module supports multiple EspoCRM versions (8.4.2, 9.0.8, 9.1.7) with corresponding PHPStan configurations in `phpstan/` directory.

## Key Development Patterns

### View Extensions System
The module provides a sophisticated view extension system that allows modifying any EspoCRM view without inheritance. Extensions are defined in `app.client.viewExtensions` metadata and implemented using the `extend()` function:

```javascript
extend('custom:extensions/view/detail', ['lib!new-dependency'], function (Dep, NewDependency) {
    return Dep.extend({
        // Your modifications
    });
});
```

### Layout Extensions
Standard EspoCRM unifier patterns are used for extending layouts with `__APPEND__` directives in JSON files.

### Related Fields & Panels
The module extends EspoCRM's layout manager to support:
- Related fields in list views (display fields from related entities)
- Related panels in detail views (show joined related records)
- Editable fields in list views (inline editing without opening records)


## Module-Specific Features

### Key Entities
- `Alert` - User notifications system
- `RecordTemplate` - Template system for creating records
- `RecordRecurrence` - Recurring records functionality
- `XmlTemplate` / `XmlFeed` - XML generation and feeds
- `Holiday` - Holiday management
- `CustomIcon` - Custom icon management
- `WorkQueue` - Queue processing system

### Important Services
- `Tools/Aggregation/Service` - Data aggregation functionality
- `Tools/ManualWorkflow/Service` - Manual workflow execution
- `Tools/EmailFolder/Service` - Email folder management
- `Tools/UserKanban/Service` - Kanban board functionality
- `Tools/Partition/PartitionService` - Data partitioning

### Console Commands (in Classes/ConsoleCommands/)
- `ConfigGet` - Retrieve configuration values
- `GetLayout` - Export layouts
- `ListLayouts` - List available layouts
- `Tinker` - Interactive PHP shell (PsySH)
- `Indexes` - Database index management
- `LastJobRun` - Get last execution time of a scheduled job

**Note**: Command names in metadata use camelCase (e.g., `lastJobRun`) but are invoked with kebab-case (e.g., `last-job-run`)


## GitLab CI/CD Pipeline Architecture

### Overview
The project uses a sophisticated GitLab CI/CD pipeline that leverages centralized, reusable templates from the `espo-pipelines` repository. This allows maintaining pipeline logic in one place while testing against multiple EspoCRM versions and database systems.

### Important: Pipeline Version Pinning
**Always reference espo-pipelines templates using a specific commit hash in the `ref` field**. This prevents breaking changes in espo-pipelines from affecting module builds. Example:
```yaml
include:
  - project: 'autocrm/espo-pipelines'
    file: 
      - 'templates/database-matrix.yml'
      - 'templates/espocrm-extension.yml'
    ref: '4687071172ddae0ab0b9c979551ddd6c2cef2902'  # Always use specific commit
```
Never use `main` or branch names as they can change and break pipelines unexpectedly.

### Key Design Principles

1. **Centralized Configuration**: All pipeline templates are stored in `espo-pipelines` repository
2. **Matrix Testing**: Two-dimensional matrix support (EspoCRM versions × databases)
3. **Template Inheritance**: Uses GitLab's `extends` keyword for job reusability
4. **Cross-Project References**: Leverages GitLab's `!reference` syntax for shared configurations

### Pipeline Structure

```yaml
# Main pipeline stages
stages:
  - validate   # Static analysis (PHPStan)
  - test       # Unit tests (PHPUnit)
  - build      # Build extension package
  - prepare    # Prepare for deployment
  - install    # Installation tests
  - upgrade    # Upgrade tests
```

### Matrix Configuration

The pipeline tests against:
- **EspoCRM Versions**: 8.4.2, 9.0.8, 9.1.7
- **Databases**: MariaDB, PostgreSQL

This creates:
- 3 PHPStan jobs (versions only)
- 6 PHPUnit jobs (versions × databases)
- 6 Install jobs (versions × databases)
- 6 Upgrade jobs (versions × databases)
- 1 Build job
- 1 Prepare job

### Template Files in espo-pipelines

1. **database-matrix.yml**: Defines the matrix dimensions
2. **espocrm-extension-dummy.yml**: Dummy jobs for testing
3. **espocrm-extension-real.yml**: Production-ready jobs (WIP)
4. **build-stages.yml**: Non-matrixed build and prepare stages

### Current Status & Pending Tasks

#### Completed
- ✅ Centralized matrix configuration using `!reference` syntax
- ✅ Two-dimensional matrix implementation
- ✅ Dummy pipeline with successful runs
- ✅ Version centralization (can update versions in one place)
- ✅ Template inheritance structure

#### In Progress
- 🔄 Converting dummy jobs to real commands
- 🔄 Fixing GitLab service configuration for databases

#### Known Issues
1. **Service Configuration Error**: GitLab throws "service command should be an array of strings" when using real database services
2. **Variable Interpolation**: Variables in service names (`${DATABASE}`) not being parsed correctly
3. **MR Status Caching**: GitLab MR view sometimes shows old pipeline status

#### Next Steps
1. Debug and fix the service configuration issue in real templates
2. Implement proper database connectivity for tests
3. Add artifact collection for installation tests
4. Configure cache properly for parallel jobs
5. Add production deployment stage

### Important GitLab CI Insights

1. **!reference Syntax**: More powerful than YAML anchors as it works across included files
   ```yaml
   parallel:
     matrix: !reference [.full_matrix, parallel, matrix]
   ```

2. **Service Limitations**: GitLab has strict requirements for service definitions
   - Cannot use variables in service image names
   - May need separate job definitions per database type

3. **Matrix Job Naming**: Jobs are automatically named with matrix variables
   - Example: `phpunit: [8.4.2, mariadb]`

4. **Dependency Management**: Use both `dependencies` and `needs` for proper artifact handling

5. **Cache Collision**: Parallel jobs need unique cache keys to avoid conflicts

### Development Workflow

1. Test changes with dummy jobs first
2. Create new MR for each major change (avoids caching issues)
3. Use `glab ci view` to monitor pipeline status
4. Check both pipeline and job logs for errors

## Best Practices

1. **Always test with dummy jobs first** before implementing real commands
2. **Use centralized templates** to avoid duplication across projects
3. **Keep matrix definitions simple** - complex conditions make debugging harder
4. **Document pipeline changes** in commit messages and MR descriptions
5. **Version your pipeline templates** using Git tags/branches


## Template Development (Handlebars)

EspoCRM uses Handlebars templates (.tpl files) for frontend rendering:

1. **Templates location**: `src/client/res/templates/`
2. **Field parameters** are accessible directly via `params` object (e.g., `params.hideCurrencyInEdit`)
3. **Handlebars helpers**:
   - Use `{{#unless}}` as the inverse of `{{#if}}` - cleaner than `{{#if}} {{else}}`
   - Example: `{{#unless params.hideCurrencyInEdit}}...{{/unless}}`
4. **Common patterns**:
   - Conditional attributes: `{{#if params.maxLength}} maxlength="{{params.maxLength}}"{{/if}}`
   - Options helper: `{{{options currencyList currencyValue}}}`
   - Direct param access: `params.compact`, `params.readOnly`, etc.

## Common GitLab CI Issues and Solutions

### "before_script config should be a string or a nested array of strings"

**Problem**: GitLab CI throws this error when the before_script (or script, after_script) section contains complex multi-line commands, comments, or certain shell operators.

**Solution**: Convert the entire before_script to a single string with semicolons separating commands:

```yaml
# BAD - Will cause error
before_script:
  - echo "Starting"
  - if [ "$VAR" = "value" ]; then export FOO="bar"; fi
  - echo "Done"

# GOOD - Single string with semicolons
before_script:
  - 'echo "Starting"; if [ "$VAR" = "value" ]; then export FOO="bar"; fi; echo "Done"'
```

**Key points**:
- No comments inside script arrays
- Use semicolons to separate commands
- Wrap the entire command in single quotes
- Avoid multi-line YAML blocks (|) in script sections

## Console Command Error Handling

When implementing console commands in the AutoCRM module, follow this error handling pattern:

```php
if (!$someCondition) {
    $io->writeLine('Error: Description of the error');
    $io->writeLine('Additional helpful information if needed');
    $io->setExitStatus(1);
    
    return;
}
```

**Important notes:**
- The `IO` interface does NOT have a `writeError()` method - use `writeLine()` for all output
- Always call `$io->setExitStatus(1)` before returning on error conditions




- This ensures proper exit codes for CLI usage and CI/CD pipelines


## GitLab CLI (glab) Usage

### Creating Merge Requests

The correct flags for creating merge requests with `glab`:

```bash
glab mr create --title "Title" --description "Description" --squash-before-merge
```

**Important notes**:
- Use `--description` (not `--body`) for the MR description
- The `--squash-before-merge` flag ensures the MR will be squashed when merged
- For multi-line descriptions, use a heredoc:
  ```bash
  glab mr create --title "Title" --description "$(cat <<'EOF'
  ## Summary
  - Change 1
  - Change 2
  
  ## Test plan
  - [ ] Tests pass
  EOF
  )" --squash-before-merge
  ```

### Enabling Auto-merge

To enable auto-merge on a merge request (so it merges automatically when the pipeline succeeds):

```bash
glab mr merge <MR_NUMBER> --auto-merge --squash
```

**Notes**:
- The `--when-pipeline-succeeds` flag is deprecated; use `--auto-merge` instead
- The `--squash` flag is required as the project is configured to require squashing commits on merge


### Completed Transitions from Dummy to Real Commands

1. **PHPStan** ✅
   - Uses real Docker images: `${CI_REGISTRY_IMAGE}/espocrm-ci:${ESPO_VERSION}`
   - Runs actual static analysis with composer and phpstan
   - Matrix: 3 versions (8.4.2, 9.0.8, 9.1.1)

2. **PHPUnit** ✅
   - Runs real unit tests with `vendor/bin/phpunit --testdox`
   - Full matrix: 3 versions × 2 databases (MariaDB, PostgreSQL)
   - Composer setup included

3. **Build** ✅
   - Uses `apertia/autocrm-dev` image
   - Real npm install and build commands
   - Already had real commands in template

4. **Check Translations** ✅
   - Runs as first stage in pipeline
   - Matrix for 3 locales: cs_CZ, sk_SK, de_DE
   - Currently fails on purpose (dummy implementation)
   - Configured with `allow_failure: true`

5. **Install and Upgrade** ✅ (Combined into single job)
   - Installs extension using: `php command.php extension --file="..."`
   - Checks version with: `php command.php version`
   - Upgrades sequentially through versions (e.g., 8.4.2 → 9.0.8 → 9.1.1)
   - Upgrade command: `php command.php upgrade --y`
   - Full matrix: 3 versions × 2 databases

### Current Pipeline Structure

```yaml
stages:
  - check_translations  # First, checks all language files
  - validate           # PHPStan static analysis
  - test              # PHPUnit tests
  - build             # Build extension package
  - prepare           # Prepare version variables (only on main)
  - install           # Install extension and test upgrades
```

### Key Technical Solutions

1. **Version Matrix**: Changed from 9.1.5 to 9.1.1 to match existing Docker images
2. **Database Configuration**: Uses case statement to set platform dynamically
3. **Script Simplification**: All complex scripts converted to single-line strings
4. **Upgrade Logic**: Tests sequential upgrades through all higher versions

### Known Issues and TODOs

1. **Check Translations**: Still using dummy implementation - needs real translation validation
2. **Upgrade Process**: Needs verification if upgrade packages are required or if Docker containers handle it
3. **Database Services**: PostgreSQL and MariaDB environment variables are both included for compatibility

### Next Steps

1. Implement real translation checking logic
2. Verify upgrade process works in Docker containers
3. Add advanced-pack installation tests (already in main branch)
4. Configure proper artifact handling for upgrade tests
5. Add deployment stage for successful builds on main branch