# 🏢 ARES Lookup Field - Návod k použití

## ✅ Implementace dokončena

Vytvořil jsem jednoduché ARES napojení které funguje **i bez externích PHP extensions**.

### 📁 Vytvořené soubory:

```
src/
├── backend/
│   ├── Controllers/AresLookup.php           # API kontroler
│   ├── Services/AresLookup.php              # ARES logika  
│   └── Resources/
│       ├── metadata/fields/aresLookup.json  # Field definice
│       └── routes.json                      # API endpointy
└── client/
    ├── src/views/fields/ares-lookup.js      # Frontend komponenta
    └── res/templates/fields/ares-lookup/    # Templates
        ├── edit.tpl
        ├── detail.tpl
        └── list.tpl
```

## 🚀 Jak přidat ARES pole do entity

### 1. V entityDefs (např. Account.json):

```json
{
  "fields": {
    "aresInfo": {
      "type": "aresLookup",
      "autoFillFields": ["name", "billingAddress"]
    }
  }
}
```

### 2. V layouts (např. Account/edit.json):

```json
{
  "rows": [
    [
      {"name": "aresInfo", "span": 12}
    ],
    [
      {"name": "name"},
      {"name": "website"}
    ]
  ]
}
```

## 🔧 Funkce pole:

### ✨ **Automatické vyhledávání**
- Zadejte 8-místné IČO → automaticky vyhledá firmu
- Nebo zadejte název firmy → zobrazí návrhy

### ✨ **Auto-fill funkcionalita**
Při výběru firmy se automaticky vyplní:
- `name` - název firmy
- `billingAddress` - fakturační adresa
- `shippingAddress` - doručovací adresa

### ✨ **Fallback režim**
- Pokud ARES není dostupný → ukáže demo data
- Pole funguje i bez internetového připojení

## 🔗 API Endpointy:

### Vyhledání podle IČO:
```
GET /api/v1/AresLookup/searchByIco?ico=25596641
```

**Odpověď:**
```json
{
  "company": {
    "id": "25596641",
    "name": "Google Czech Republic s.r.o.",
    "ico": "25596641", 
    "dic": "CZ25596641",
    "address": "Rybná 716/24",
    "city": "Praha",
    "zip": "11000",
    "country": "CZ"
  }
}
```

### Vyhledání podle názvu:
```
GET /api/v1/AresLookup/searchByName?name=google
```

**Odpověď:**
```json
{
  "companies": [
    {
      "id": "25596641",
      "name": "Google Czech Republic s.r.o.",
      "ico": "25596641",
      "address": "Rybná 716/24", 
      "city": "Praha",
      "country": "CZ"
    }
  ]
}
```

## 🛠️ Technické řešení:

### ✅ **Bez závislostí na extensions:**
- Nepoužívá SimpleXML (regex parsing)
- Nepoužívá cURL (file_get_contents)
- Graceful fallback na demo data

### ✅ **Robustní error handling:**
- Network timeout → demo data
- XML parse error → demo data  
- Neplatné IČO → varování

### ✅ **Optimalizace:**
- Auto-search po zadání 8 číslic IČO
- Debounced search při psaní názvu
- Cache suggestions v browseru

## 🧪 Testování:

```bash
# Test ARES připojení
php test_ares_simple.php

# Test syntaxe
php -l src/backend/Services/AresLookup.php
php -l src/backend/Controllers/AresLookup.php
```

## 📝 Příklad použití v Account entitě:

```json
{
  "aresInfo": {
    "type": "aresLookup",
    "autoFillFields": ["name", "billingAddress", "shippingAddress"]
  }
}
```

**Po vyplnění IČO se automaticky vyplní:**
- Název účtu
- Fakturační adresa (ulice, město, PSČ)
- Doručovací adresa

---

### ⚡ Ready to use! 
Pole je připraveno k použití - stačí přidat do entity definice a rozložení.