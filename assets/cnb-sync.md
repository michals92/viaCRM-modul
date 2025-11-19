# Synchronizace měnových kurzů s CNB

## Nastavení naplánované činnosti

Pro automatickou synchronizaci měnových kurzů z České národní banky je potřeba vytvořit naplánovanou činnost (Scheduled Job).

### Postup

1. Přejděte do **Administrace** → **Naplánované činnosti**
2. Klikněte na **Vytvořit**
3. Vyplňte:
   - **Činnost**: Synchronizace měnových kurzů s CNB
   - **Status**: Active
   - **Jméno**: Synchronizace měnových kurzů s CNB (nebo vlastní název)
   - **Plánování**: `0 */12 * * *` (každých 12 hodin)
4. Uložte

### Příklady plánování

| Cron výraz | Popis |
|------------|-------|
| `0 */12 * * *` | Každých 12 hodin |
| `0 8 * * *` | Denně v 8:00 |
| `0 8 * * 1-5` | Pracovní dny v 8:00 |
