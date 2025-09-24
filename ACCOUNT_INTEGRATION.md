# Account Integration - ARES/ORSR Company Lookup

## 🎯 **Implementované rozšírenie Account entity**

### ✅ **Nové polia v Account:**

1. **`companyLookup`** (aresLookup field)
   - Vyhledávací pole pro ARES/ORSR
   - Automatické vyplnění údajů
   - Support CZ + SK firiem

2. **`ico`** (varchar, 20 chars)
   - IČO firmy 
   - Automaticky vyplněno z lookup

3. **`dic`** (varchar, 20 chars)
   - DIČ firmy (jen české)
   - Automaticky vyplněno z lookup

### 📋 **Layout změny:**

#### **Detail View:**
```
┌─────────────────────────────────────────────┐
│ [Company Lookup Field - full width]        │
├─────────────────────────────────────────────┤
│ Name              │ Website                 │
│ IČO               │ DIČ                     │
│ Email             │ Phone                   │
│ Type              │ Industry                │
├─────────────────────────────────────────────┤
│ Billing Address   │ Shipping Address        │
├─────────────────────────────────────────────┤
│ Description [full width]                    │
└─────────────────────────────────────────────┘
```

### 🔧 **Auto-fill funkcionalita:**

Při vyhledání firmy se automaticky vyplní:
- **Name** → název firmy
- **IČO** → company ID
- **DIČ** → tax ID (jen české firmy)  
- **Billing Address** → fakturační adresa
- **Shipping Address** → dodací adresa

### 🌍 **Multi-country support:**

- **🇨🇿 České firmy**: ARES → kompletní data + DIČ
- **🇸🇰 Slovenské firmy**: ORSR → základní data bez DIČ
- **Automatická detekce země** pro adresy

## 📂 **Vytvořené soubory:**

### **Backend:**
```
src/backend/Resources/metadata/
├── entityDefs/Account.json          # Definice polí
├── clientDefs/Account.json          # Client konfigurace  
├── layouts/Account/
│   ├── detail.json                  # Detail layout
│   └── edit.json                    # Edit layout
└── i18n/
    ├── cs_CZ/Account.json           # České překlady
    └── en_US/Account.json           # Anglické překlady
```

### **Frontend:**
```
src/client/src/views/account/
└── account-dynamic-handler.js       # Dynamic handler
```

## 🚀 **Použití:**

1. **Otevřete Account detail/edit**
2. **V poli "Vyhledání firmy":**
   - Zadejte IČO nebo název firmy
   - Systém vyhledá v ARES/ORSR
   - Automaticky vyplní všechna pole
3. **Uložte Account**

## 🔗 **Workflow:**

```
User Input (IČO/název)
         ↓
   ARES API (CZ)
         ↓ (fallback)
   ORSR Scraping (SK)  
         ↓
   Auto-fill Account
         ↓
   Save with company data
```

---

**✅ HOTOVO: Account entity rozšířena o ARES/ORSR lookup**  
**🎯 Funkce: Automatické vyplnění firemních údajů jedním kliknutím**