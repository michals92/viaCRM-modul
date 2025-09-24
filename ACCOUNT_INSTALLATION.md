# Account Entity Extension - Installation Guide

## 🎯 **Čo sa pridalo do Account entity**

### ✅ **Nové polia:**
- **`companyLookup`** - ARES/ORSR vyhľadávacie pole
- **`ico`** - IČO firmy (8-miestne číslo)
- **`dic`** - DIČ firmy (pre české firmy)

### 📋 **Upravený layout:**
- Vyhľadávacie pole na vrchu
- IČO a DIČ polia pod názvom firmy
- Auto-fill pre všetky firemné údaje

## 📦 **Inštalácia**

### **1. Nainštalovanie extension balíčka:**
- Súbor: `/mnt/d/espoCRM/viaCRM-modul/dist/ViaCrm-2.6.0.zip`
- Veľkosť: **295.7 KB**

### **2. Kroky inštalácie:**
1. Prihláste sa do EspoCRM ako Administrator
2. Prejdite na **Administration > Extensions**
3. Kliknite na **Install Extension**
4. Nahrajte súbor `ViaCrm-2.6.0.zip`
5. Po nahraní kliknite na **Install**
6. Po inštalácii kliknite na **Rebuild** (dôležité!)

### **3. Overenie inštalácie:**
1. Prejdite na **Account** entitu
2. Otvorte existujúci Account alebo vytvorte nový
3. Na vrchole formulára by ste mali vidieť pole **"Company Lookup"**
4. Pod názvom by mali byť polia **"IČO"** a **"DIČ"**

## 🚀 **Použitie**

### **1. Vyhľadanie firmy:**
1. Otvorte Account v edit režime
2. Do poľa "Company Lookup" zadajte:
   - **IČO**: napr. `45274649` (ČEZ)
   - **Názov**: napr. `ČEZ` alebo `ESET`
3. Vyberte firmu z dropdown menu
4. **Všetky údaje sa automaticky vyplnia!**

### **2. Auto-fill funkcie:**
Po výbere firmy sa automaticky vyplnia:
- ✅ **Name** - názov firmy
- ✅ **IČO** - identifikačné číslo
- ✅ **DIČ** - daňové číslo (len české firmy)
- ✅ **Billing Address** - fakturačná adresa
- ✅ **Shipping Address** - dodacia adresa

### **3. Podporované krajiny:**
- **🇨🇿 Česká republika**: Kompletné údaje vrátane DIČ
- **🇸🇰 Slovensko**: Základné údaje bez DIČ

## 🔧 **Riešenie problémov**

### **Layout sa nezmenil:**
1. Po inštalácii extension **vždy** spustite **Rebuild**
2. Vyčistite browser cache (Ctrl+F5)
3. Skontrolujte či je extension aktívne v Administration > Extensions

### **Pole nie je viditeľné:**
1. Prejdite na **Administration > Layout Manager**
2. Vyberte **Account > Detail**
3. Skontrolujte či je pole `companyLookup` pridané do layoutu
4. Ak nie, pridajte ho manuálne a kliknite Save

### **API nefunguje:**
1. Skontrolujte server logy
2. Overte či sú routes správne nakonfigurované
3. Testujte API priamo: `/api/v1/AresLookup/searchByIco?ico=45274649`

## 📊 **Testovanie**

### **Testovacie IČO:**
- **🇨🇿 ČEZ**: `45274649`
- **🇨🇿 Alza**: `27082440`  
- **🇸🇰 ESET**: `31333532`
- **🇸🇰 U.S. Steel**: `36199222`

### **Očakávané výsledky:**
- České firmy: Všetky údaje vrátane DIČ
- Slovenské firmy: Názov, IČO, adresa (bez DIČ)
- Auto-fill funguje pre všetky typy firiem

---

**🏆 Account entity je teraz rozšírená o ARES/ORSR integráciu!**  
**⚡ Automatické vyplnenie firemných údajov jedným kliknutím**