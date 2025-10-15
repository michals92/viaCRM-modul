# Implementace filtrování podle data vytvoření v reportech

Tato dokumentace popisuje implementaci funkcionality pro filtrování záznamů v reportech podle data vytvoření.

## Přehled implementace

### 1. Backend změny

#### Metadata (entityDefs)
- Přidána pole `dateFrom` a `dateTo` do `Report.json`
- Oba pole jsou typu `date` s volitelnou validací

#### Service layer
- Upravena `Report.php` service pro podporu filtrování:
  - `executeListQuery()` - přidána logika WHERE podmínek pro datum
  - `executeChartQuery()` - přidána logika WHERE podmínek pro grafy
  - `runListReport()`, `runGridReport()`, `runChartReport()` - předání datových parametrů
  - `runReportPreview()` - podpora preview s filtrováním

#### Překlady
- Přidány české a anglické překlady pro nová pole

### 2. Frontend změny

#### Layouty
- `edit.json` - pole přidána do sekce "Configuration"
- `detail.json` - pole přidána pro zobrazení v detailu

#### JavaScript
- Upraven `report/record/edit.js`:
  - Přidána data z nových polí do preview
  - Implementována validace data (dateFrom ≤ dateTo)
  - Použity překlady pro chybové hlášky

#### Validace
- Kontrola, že `dateTo` není dříve než `dateFrom`
- Automatické vyčištění `dateTo` při neplatném rozsahu

## Použití

### Vytvoření reportu s filtrováním

1. Vytvořte nový report
2. Vyberte cílovou entitu
3. V sekci "Configuration" nastavte:
   - **Vytvořeno od** (dateFrom) - počáteční datum
   - **Vytvořeno do** (dateTo) - konečné datum
4. Nakonfigurujte ostatní parametry (sloupce, seskupení, řazení)
5. Použijte "Preview" pro ověření výsledků
6. Uložte a spusťte report

### Filtrování funguje pro:
- List reporty
- Grid reporty
- Chart reporty
- Export (CSV, Excel, PDF)

## Technické detaily

### SQL podmínky
```sql
WHERE created_at >= '2024-01-01'
  AND created_at <= '2024-12-31 23:59:59'
```

### Formát dat
- `dateFrom`: YYYY-MM-DD (např. 2024-01-01)
- `dateTo`: YYYY-MM-DD (např. 2024-12-31)
- Backend automaticky přidává čas 23:59:59 pro `dateTo`

### Backend API
```php
$params = [
    'dateFrom' => '2024-01-01',
    'dateTo' => '2024-12-31',
    'maxSize' => 100,
    'where' => [
        ['type' => 'greaterThanOrEquals', 'field' => 'createdAt', 'value' => '2024-01-01'],
        ['type' => 'lessThanOrEquals', 'field' => 'createdAt', 'value' => '2024-12-31 23:59:59']
    ]
];
```

## Testování

### Manuální test
1. Vytvořte report pro entitu s dostatečnými záznamy (např. User)
2. Nastavte rozumné datumové rozmezí
3. Ověřte výsledky v preview
4. Spusťte report a zkontrolujte data

### Automatický test
Spusťte `test_date_filtering.php` pro ověření základní funkčnosti.

## Soubory změněny

### Backend
- `src/backend/Resources/metadata/entityDefs/Report.json`
- `src/backend/Resources/i18n/cs_CZ/Report.json`
- `src/backend/Resources/i18n/en_US/Report.json`
- `src/backend/Resources/layouts/Report/edit.json`
- `src/backend/Resources/layouts/Report/detail.json`
- `src/backend/Services/Report.php`

### Frontend
- `src/client/src/views/report/record/edit.js`

### Test
- `test_date_filtering.php`

## Bezpečnost a výkon

- Používá EspoCRM nativní query builder
- Parametry jsou escapované pro prevenci SQL injection
- Výchozí limit výsledků (100/200 záznamů) je zachován
- Index na `createdAt` poli je využíván pro efektivní filtrování

## Budoucí vylepšení

Možné rozšíření:
- Filtrování podle `modifiedAt`
- Relativní datumové filtry (posledních 30 dní, tento měsíc atd.)
- Více časových rozsahů pro stejný report
- Ukládání často používaných datumových filtrů jako šablony