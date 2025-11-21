# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

AutoCRM module for EspoCRM - enhanced functionality including view extensions, custom layouts, email templates, workflow automation.

## Architecture

### Backend (PHP)
- **Location**: `src/backend/`
- **Namespace**: `Espo\Modules\Autocrm\`
- **Key Directories**: Controllers, Services, Entities, Core, Classes, Resources, EntryPoints, Hooks, Api

### Frontend (TypeScript/JavaScript)
- **Location**: `src/client/src/`
- **Key Directories**: views, controllers, helpers, extensions, models, handlers, @types

### Easy Email Component
- **Location**: `src/easy-email/`
- **Stack**: React 18 + MJML + easy-email

## Key Entities

Alert, RecordTemplate, RecordRecurrence, XmlTemplate, XmlFeed, Holiday, CustomIcon, WorkQueue

## Development Patterns

### View Extensions System
- Extensions in `app.client.viewExtensions` metadata
- Uses `extend()` function - modify views without inheritance
- Examples: `src/client/src/extensions/`

### Layout Extensions
- Standard EspoCRM unifier with `__APPEND__` directives
- Related fields, related panels, editable list fields supported

### Console Commands
- Location: `Classes/ConsoleCommands/`
- Usage: `php command.php list`
- **Note**: Metadata uses camelCase (e.g., `lastJobRun`), CLI uses kebab-case (e.g., `last-job-run`)

### Handlebars Templates
- Location: `src/client/res/templates/`
- Field params accessible via `params` object (e.g., `params.hideCurrencyInEdit`)
- Use `{{#unless}}` instead of `{{#if}} {{else}}` for inverse conditions

## Known Issues & TODOs

### Bulk Email Handler - Performance & Scalability Issues

**File**: `src/client/src/handlers/mass-actions/bulk-email.ts:31`

**Problem**: Client-side fetching of all records for bulk email operations

**Current Implementation (BROKEN)**:
```typescript
// ❌ Fetches ALL records into browser when "Select All" checked
if (data.params.byWhere) {
    const collection = await this.view.getCollectionFactory().create(data.entityType);
    await collection.fetch(); // Downloads 10,000+ records → crashes browser
    mailList = collection.models.map(model => model.get('emailAddress'));
}
```

**Issues**:
1. **Memory exhaustion**: Downloads entire collection into browser (10k+ records)
2. **Slow performance**: Fetches full entities just to extract `emailAddress` field
3. **URL length limit**: `mailto:` URLs limited to ~2000 chars (external clients)
4. **Inefficient**: No pagination, no server-side filtering

**Required Solution**:
- Server-side API endpoint to fetch email list with SQL SELECT
- Client only receives array of emails, not full entities
- Server handles pagination and large datasets efficiently

**Status**: TODO - needs complete rewrite with backend endpoint

## CI/CD & GitLab

### Pipeline
- Tests: EspoCRM 9.0.8, 9.1.7 × MariaDB, PostgreSQL
- Config: `.gitlab-ci.yml` (centralized templates from `autocrm/espo-pipelines`)

### GitLab Workflow
- Tool: `glab` CLI
- MR requirements: `--squash-before-merge`, `--auto-merge --squash`

## Multi-Version Support

- EspoCRM versions: 9.0.8, 9.1.7
- PHPStan configs: `phpstan/` directory

## Documentation

- **Global rules**: See parent `~/CLAUDE.md`
- **CI/CD**: `docs/ci-cd/`
- **Development**: `docs/development/`
