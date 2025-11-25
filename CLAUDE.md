# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

ViaCRM module for EspoCRM - enhanced functionality including view extensions, custom layouts, email templates, workflow automation.

## Architecture

### Backend (PHP)
- **Location**: `src/backend/`
- **Namespace**: `Espo\Modules\Viacrm\`
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

### 1. Bulk Email Handler - Performance & Scalability Issues

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

---

### 2. Email PDF Provider - Naive Email Recipient Selection

**File**: `src/backend/Classes/EmailPdf/DefaultAttributeProvider.php:81`

**Problem**: Hardcoded assumption that every entity has `account` relation with `emailAddress` field

**Current Implementation (BROKEN)**:
```php
// TODO: implement some logic for selecting where to get the 'to' email address from
try {
    $account = $this->entityManager->getRelation($entity, 'account')->findOne();
    $attributes['to'] = $account?->get('emailAddress');
} catch (Exception) {
    // Silent fail - email sent without recipient
}
```

**Issues**:
1. **Only works for entities with `account` relation** (Invoice, Quote, SalesOrder)
2. **Ignores direct email fields** on entity (Contact.emailAddress, Lead.emailAddress)
3. **Ignores other relations** (contact, assignedUser, parent)
4. **Not configurable** per entity type
5. **Silent failure** - if exception, email goes without recipient

**Examples of broken entities**:
- `Contact` → has own `emailAddress` field, no `account` relation
- `Lead` → has own `emailAddress` field, no `account` relation
- `Case` → has `contact` relation, not `account`
- `Meeting` → has `users`, `contacts`, `leads` collections

**Required Solution**:
```php
private function getToEmailAddress(Entity $entity): ?string
{
    // 1. Try direct emailAddress field on entity
    if ($entity->hasAttribute('emailAddress') && $entity->get('emailAddress')) {
        return $entity->get('emailAddress');
    }

    // 2. Try common relations (contact, account, parent, assignedUser)
    $relationChecks = ['contact', 'account', 'parent', 'assignedUser'];
    foreach ($relationChecks as $relation) {
        try {
            $related = $this->entityManager->getRelation($entity, $relation)->findOne();
            if ($related?->get('emailAddress')) {
                return $related->get('emailAddress');
            }
        } catch (Exception) {
            continue;
        }
    }

    // 3. Check metadata configuration (per-entity customization)
    $emailSourceConfig = $this->metadata->get(
        ['entityDefs', $entity->getEntityType(), 'emailPdfToSource']
    );

    return null; // No email found - throw exception instead of silent fail
}
```

**Status**: TODO - needs flexible lookup logic with metadata configuration

---

### 3. Email Health SMTP Test - Only Configuration Check, No Real Test

**Files**: `src/backend/Classes/ConsoleCommands/EmailHealth.php:229,360`

**Problem**: Command only checks if SMTP configuration exists, doesn't test actual connection

**Current Implementation (INCOMPLETE)**:
```php
// For now, just check if configuration exists
// TODO: Implement actual SMTP test without sending email
$result['smtp'] = 'CONFIGURED';
```

**Issues**:
1. **False positives**: Reports 'CONFIGURED' even when credentials are invalid
2. **No connection test**: Doesn't verify SMTP server is reachable
3. **No authentication test**: Doesn't verify username/password are correct
4. **No error detection**: Can't detect expired OAuth tokens, IP bans, blocked ports

**Examples of undetected failures**:
- Invalid password → stored in DB but authentication fails
- Firewall blocks port 587/465
- SMTP server hostname changed/unavailable
- OAuth token expired (stored but invalid)
- Server blocked IP address

**Required Solution**:
```php
try {
    // Use Symfony Mailer Transport (already in EspoCRM)
    $transport = Transport::fromDsn(
        "smtp://{$username}:{$password}@{$host}:{$port}"
    );

    // Open connection and perform handshake (HELO/EHLO)
    $transport->start();

    // Verify connection is alive + test authentication
    $transport->ping();

    // Close connection
    $transport->stop();

    $result['smtp'] = 'OK';  // ✅ Actually tested and works!

} catch (TransportException $e) {
    $result['smtp'] = 'FAILED';
    $result['errors'][] = 'SMTP: ' . $e->getMessage();
}
```

**Test performs**:
1. TCP connection to SMTP server
2. SMTP handshake (HELO/EHLO)
3. Authentication (AUTH LOGIN/PLAIN/CRAM-MD5/XOAUTH2)
4. Connection close
5. **NO EMAIL SENT** - just connection test

**Benefits**:
- Proactive detection of credential expiration
- Monitoring can alert before users report issues
- Validates configuration is actually functional, not just present

**Status**: TODO - implement real SMTP connection test using Symfony Mailer Transport

---

### 4. History Tabs - Replace Manual Promise with whenReady()

**File**: `src/client/src/views/site/history-tabs.ts:175`

**Problem**: Manual Promise creation for waiting on view readiness - verbose and outdated pattern

**Current Implementation (BC/LEGACY)**:
```typescript
// TODO: BC, use `whenReady` later
await new Promise<void>(resolve => {
    if (this.isReady) {
        return resolve();
    } else {
        this.once('ready', () => resolve());
    }
});
```

**Issues**:
1. **Verbose**: 7 lines for simple readiness check
2. **Outdated**: Written for backwards compatibility with older EspoCRM
3. **Not DRY**: Pattern duplicated in other views
4. **Less maintainable**: Manual event handling prone to errors

**Required Solution**:
```typescript
await this.whenReady(); // ✅ Modern EspoCRM helper method
```

**Benefits**:
- Single line instead of 7
- Uses built-in EspoCRM helper
- Consistent with other modern views
- Better error handling in helper method

**Status**: TODO - refactor to `whenReady()` after confirming minimum EspoCRM version

---

### 5. Layout Builder Bottom Panels - Conceptual Mismatch

**File**: `src/backend/Tools/Layout/LayoutBuilder.php:278`

**Problem**: Method `hasFieldInBottomsPanelLayout()` is conceptually wrong - bottom panels don't have fields, they have relationship panels

**Current Implementation (CONCEPTUALLY WRONG)**:
```php
/**
 * Checks if bottomsPanel layout contains a field with given name
 */
private function hasFieldInBottomsPanelLayout(string $fieldName): bool {
    // TODO: Implement if needed for bottomsPanel layouts
    return false;
}
```

**Why it's wrong**:

**Bottom Panels structure** (relationship panels, NOT fields):
```json
{
    "bankTransactions": {      // ← Panel name (relation)
        "index": 4,
        "disabled": false
    },
    "payments": {              // ← Panel name (relation)
        "index": 0
    },
    "creditNotes.summaryVatRates": {  // ← Nested panel
        "disabled": true
    }
}
```

**Detail Layout structure** (has actual fields):
```json
[
    {
        "rows": [
            [
                {"name": "name"},      // ← Field!
                {"name": "status"}     // ← Field!
            ]
        ]
    }
]
```

**Issues**:
1. **Wrong abstraction**: Bottom panels are key-value map, not array of fields
2. **Wrong concept**: Looking for "fields" in relationship panels doesn't make sense
3. **Dead code**: `addField()` method throws for `bottomsPanel` type, so `hasField()` never called
4. **Misleading TODO**: Suggests implementation needed, but concept is wrong

**Code context**:
```php
// LayoutBuilder.php:289-296
public function addField(array $field): self {
    if ($this->type !== Layout\LikeType::list) {
        throw new \LogicException('Cannot add field to non-list layout');
        // ↑ Throws for bottomsPanel! So hasField() never used.
    }
}
```

**Required Solution**:

Bottom panels need **different methods** for panel management:

```php
/**
 * Checks if bottomPanels layout contains a panel with given name
 */
private function hasPanelInBottomsPanelLayout(string $panelName): bool {
    // Bottom panels are object: { "panelName": { "index": 0 } }
    return isset($this->layout[$panelName]);
}

/**
 * Add or update a panel in bottomPanels layout
 */
public function addPanel(string $panelName, array $config): self {
    if ($this->type !== Layout\LikeType::bottomsPanel) {
        throw new \LogicException('Cannot add panel to non-bottomPanel layout');
    }

    $this->layout[$panelName] = $config;
    return $this;
}

/**
 * Remove a panel from bottomPanels layout
 */
public function removePanel(string $panelName): self {
    if ($this->type !== Layout\LikeType::bottomsPanel) {
        throw new \LogicException('Cannot remove panel from non-bottomPanel layout');
    }

    unset($this->layout[$panelName]);
    return $this;
}
```

**Refactoring needed**:
1. Remove `hasFieldInBottomsPanelLayout()` - conceptually wrong
2. Add `hasPanelInBottomsPanelLayout()` - check if panel exists
3. Add `addPanel()`, `removePanel()`, `updatePanel()` methods
4. Update `hasField()` to not call bottomPanel check (or remove case)

**Status**: TODO - refactor from field-based to panel-based API for bottomPanels

## CI/CD & GitLab

### Pipeline
- Tests: EspoCRM 9.0.8, 9.1.7 × MariaDB, PostgreSQL
- Config: `.gitlab-ci.yml` (centralized templates from `viacrm/espo-pipelines`)

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
