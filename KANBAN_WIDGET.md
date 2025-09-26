# Kanban Widget pro EspoCRM

Tento widget přidává Kanban zobrazení na domovskou stránku EspoCRM pro entity, které obsahují status pole.

## Funkce

- **Kanban zobrazení** - Zobrazuje záznamy v sloupcích podle jejich statusu
- **Drag & Drop** - Přetažením karty mezi sloupci změníte status záznamu
- **Konfigurace** - Nastavitelný typ entity, pole pro status, automatické obnovování
- **Více entit** - Podporuje Task, Order, Offer, Absence, Hr, Attendance, Report
- **Responsive design** - Přizpůsobuje se velikosti dashboardu
- **Lokalizace** - Podporuje češtinu i angličtinu

## Instalace

### 1. Soubory
Všechny potřebné soubory byly vytvořeny v následující struktuře:

```
src/custom/Espo/Custom/Resources/
├── metadata/dashlets/KanbanView.json        # Konfigurace dashletu
├── i18n/
│   ├── cs_CZ/Global.json                    # České překlady
│   └── en_US/Global.json                    # Anglické překlady

client/custom/
├── src/views/dashlets/kanban-view.js        # JavaScript implementace
└── res/css/kanban-dashlet.css               # Styly
```

### 2. Aktivace
Po nahrání souborů na server:

1. Smažte cache: `Administration → Clear Cache`
2. Rebuild aplikace: `Administration → Rebuild`
3. Přejděte na Dashboard
4. Klikněte na "+" pro přidání nového dashletu
5. Vyberte "Kanban Board"

## Konfigurace

### Dostupné možnosti:
- **Název** - Název dashletu na dashboardu
- **Typ entity** - Jaké entity zobrazit (Task, Order, Offer, atd.)
- **Pole pro status** - Pole použité pro sloupce (ponechte prázdné pro autodetekci)
- **Automatické obnovování** - Jak často aktualizovat data (0 = vypnuto)
- **Maximální počet záznamů** - Kolik záznamů načíst (10-500)

### Podporované entity:
- **Task** - úkoly (status: Not Started, Started, Completed, Canceled, Deferred)
- **Order** - objednávky (status: Draft, Confirmed, Shipped, Delivered, Canceled)
- **Offer** - nabídky (status: Draft, Sent, Accepted, Rejected, Expired)
- **Absence** - dovolené (status: pending, approved, rejected, cancelled)
- **Hr** - zaměstnanci (status: Active, Inactive, Terminated, On Leave)
- **Attendance** - docházka (status: Present, Absent, Late, Left Early)
- **Report** - reporty (status: Active, Inactive)

## Použití

### Základní funkce:
1. **Zobrazení** - Záznamy jsou zobrazené v sloupcích podle statusu
2. **Přetažení** - Uchopte kartu a přetáhněte ji do jiného sloupce
3. **Zobrazení detailu** - Kliknutím na "👁" ikonu otevřete záznam
4. **Obnovení** - Použijte tlačítko refresh v hlavičce dashletu

### Barevné kódování karet:
- **Zelená** - Dokončené stavy (Completed, approved, Delivered)
- **Žlutá** - V procesu (Started, pending, Confirmed)
- **Červená** - Zrušené/odmítnuté (Canceled, rejected)
- **Šedá** - Návrhy (Draft)

## Technické detaily

### Závislosti:
- EspoCRM 7.0+
- jQuery (součást EspoCRM)
- Správná ACL oprávnění pro entity

### API volání:
Widget používá standardní EspoCRM REST API:
- `GET api/v1/{EntityType}` - načítání dat
- `PUT api/v1/{EntityType}/{id}` - aktualizace statusu

### Cachování:
- Metadata jsou cachovaná přes EspoCRM systém
- Automatické obnovování lze nastavit 30s-10min

## Řešení problémů

### Widget se nezobrazuje:
1. Zkontrolujte, že jsou všechny soubory nahráné
2. Smažte cache a proveďte rebuild
3. Zkontrolujte JavaScript konzoli pro chyby

### Nelze přetahovat karty:
1. Zkontrolujte oprávnění pro editaci entity
2. Ověřte, že entita má správné status pole
3. Zkontrolujte network tab pro API chyby

### Status pole není rozpoznáno:
1. Zadejte název pole ručně v konfiguraci
2. Zkontrolujte entityDefs pro správný název pole

### Karty se nezobrazují:
1. Zkontrolujte ACL oprávnění pro čtení entity
2. Ověřte, že entity existují v systému
3. Zkontrolujte maxRecords limit

## Rozšíření

### Přidání nové entity:
1. Upravte `entityType` options v `KanbanView.json`
2. Přidejte default status pole v `getDefaultStatusField()`
3. Přidejte status možnosti v `getStatusOptions()`

### Přidání nových polí na karty:
Upravte `renderKanbanCard()` funkci pro zobrazení dalších informací.

### Vlastní styly:
Upravte `kanban-dashlet.css` pro změnu vzhledu.

## Verze
- **1.0** - Základní Kanban funkcionalita
- Datum vytvoření: 2025-09-25
- Kompatibilní s: EspoCRM 7.0+