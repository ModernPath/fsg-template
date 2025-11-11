# 🚨 GIT SAFETY RULES - PAKOLLINEN LUKEA!

**Version:** 1.0.0  
**Branch:** AiAgent_TF  
**Luotu:** 2025-01-10

---

## ⚠️ KRIITTISIN SÄÄNTÖ

# ❌ NEVER MERGE TO MAIN AUTOMATICALLY ❌

**Toista:** EI KOSKAAN automaattisesti merge to main!

---

## 📋 GIT RULES

### ❌ KIELLETTY (NEVER):

1. **Automaattinen merge mainiin**
   ```bash
   git checkout main
   git merge feature-branch  # ❌ EI KOSKAAN automaattisesti!
   ```

2. **Push suoraan mainiin**
   ```bash
   git push origin main  # ❌ EI KOSKAAN automaattisesti!
   ```

3. **Työskentely suoraan mainissa**
   ```bash
   git checkout main
   # ... muokkaa tiedostoja ...  # ❌ EI KOSKAAN!
   ```

4. **Force push mainiin**
   ```bash
   git push --force origin main  # ❌ EI IKINÄ!
   ```

---

### ✅ SALLITTU (OK):

1. **Työskentele dev/feature brancheissa**
   ```bash
   git checkout -b feature/new-feature
   # ... työskentele ...
   git commit -m "feat: new feature"
   git push origin feature/new-feature  # ✅ OK!
   ```

2. **Luo Pull Request mainiin**
   ```bash
   # GitHub/GitLab/Bitbucket UI:ssa
   # Create PR: feature/new-feature → main
   # ✅ OK!
   ```

3. **Dev branch voidaan julkaista**
   ```bash
   git checkout dev
   git push origin dev  # ✅ OK!
   # Voidaan deployta dev-ympäristöön
   ```

4. **Manuaalinen merge (pyydettäessä)**
   ```bash
   # Kun ERIKSEEN pyydetty JA code review tehty
   git checkout main
   git merge feature-branch  # ✅ OK (kun manuaalisesti pyydetty)
   git push origin main
   ```

---

## 🔄 WORKFLOW

### Oikea tapa:

```
1. ✅ Luo feature branch
   git checkout -b feature/sorting

2. ✅ Työskentele branchissa
   # ... develop ...
   git commit -m "feat: add sorting"
   
3. ✅ Push feature branchiin
   git push origin feature/sorting

4. ✅ Testaa feature branch
   npm run test
   npm run lint

5. ✅ Luo Pull Request (jos haluat mainiin)
   # GitHub UI: feature/sorting → main
   
6. ⏸️ ODOTA manuaalista hyväksyntää
   # Code review
   # Approval
   
7. ✅ Merge (manuaalisesti tai pyynnöstä)
   # Kun hyväksytty, merge manually
```

---

## 🚀 DEPLOYMENT WORKFLOW

### Dev Branch:
```bash
# ✅ OK: Push dev branchiin
git checkout dev
git merge feature/sorting
git push origin dev

# ✅ OK: Deploy dev branch
# Vercel/production voi deployta dev-branchia
```

### Main Branch:
```bash
# ❌ NEVER: Automaattinen merge
# ✅ MANUAL: Vain manuaalinen merge tai pyynnöstä

# 1. Luo PR
# 2. Code review
# 3. Approval
# 4. Manual merge TAI explicit request
git checkout main
git merge dev  # ✅ OK (kun manuaalinen)
git push origin main
```

---

## 🤖 AI AGENT RULES

### Agent EI SAA:
- ❌ Mergetä mainiin automaattisesti
- ❌ Pushata mainiin automaattisesti
- ❌ Työskennellä suoraan mainissa
- ❌ Luoda merge committeja mainiin
- ❌ Force pushata mitään

### Agent SAA:
- ✅ Työskennellä feature/dev brancheissa
- ✅ Commitoida feature/dev brancheihin
- ✅ Pushata feature/dev brancheihin
- ✅ Luoda PR:n (mutta ei mergetä)
- ✅ Pyytää manuaalista review:ta

---

## 🛡️ TURVATARKISTUKSET

### Helper Script Tarkistaa:

```bash
./scripts/agent/agent-helper.sh checkpoint "test"
```

**Tarkistaa:**
1. Onko main/master branchissa? → ❌ ERROR
2. Yrittääkö mergetä mainiin? → ❌ PREVENT
3. Feature/dev branchissa? → ✅ OK

---

## 📊 ESIMERKKEJÄ

### Esimerkki 1: Feature kehitys (✅ OIKEIN)
```bash
# 1. Luo feature branch
git checkout -b feature/csv-export

# 2. Kehitä
# ... koodaa ...
git add .
git commit -m "feat: add CSV export"

# 3. Push feature branchiin
git push origin feature/csv-export

# 4. Luo PR mainiin (UI:ssa)
# feature/csv-export → main

# 5. Odota review + approval

# 6. Merge manuaalisesti (kun hyväksytty)
```

---

### Esimerkki 2: Dev branch deployment (✅ OIKEIN)
```bash
# 1. Merge feature deviin
git checkout dev
git merge feature/csv-export
git push origin dev

# 2. Deploy dev branch
# Vercel deploys dev branch automatically ✅ OK

# 3. Test dev environment
# https://dev.yourapp.com

# 4. Kun valmis tuotantoon: Luo PR dev → main
# 5. Odota approval
# 6. Merge manuaalisesti
```

---

### Esimerkki 3: Väärä tapa (❌ VÄÄRIN)
```bash
# ❌ VÄÄRIN: Suora työskentely mainissa
git checkout main
git add .
git commit -m "quick fix"
git push origin main  # ❌ EI KOSKAAN!

# ❌ VÄÄRIN: Automaattinen merge mainiin
git checkout main
git merge feature/something  # ❌ EI automaattisesti!
git push origin main
```

---

## 🔧 JOS VAHINGOSSA MAIN BRANCHISSA

```bash
# 1. ÄLÄ PANIIKOI

# 2. Luo uusi branch nykyisestä tilasta
git checkout -b feature/saved-work

# 3. Takaisin mainiin
git checkout main

# 4. Reset main (jos et ole pushannut)
git reset --hard origin/main

# 5. Jatka feature branchissa
git checkout feature/saved-work
```

---

## 📱 QUICK REFERENCE

### Muista:
- 🔴 **NEVER** auto-merge to main
- 🟡 **ALWAYS** create PR for main
- 🟢 **OK** to push dev/feature branches
- 🟢 **OK** to deploy dev branch
- 🔴 **MANUAL** approval required for main

---

## 🆘 HÄTÄTILANNE

### Jos teit jo merge mainiin:

```bash
# 1. HETI: Revert merge
git revert -m 1 HEAD
git push origin main

# 2. Luo feature branch
git checkout -b feature/fix-merge
git cherry-pick <commit-hash>
git push origin feature/fix-merge

# 3. Luo PR
# 4. Code review
# 5. Manual merge
```

---

## 📞 KYSYMYKSIÄ?

**Q: Voinko pushata dev branchiin automaattisesti?**  
A: ✅ KYLLÄ! Dev branch on OK.

**Q: Voinko deployta dev branchin?**  
A: ✅ KYLLÄ! Dev branch voidaan deployta.

**Q: Voinko mergetä mainiin automaattisesti?**  
A: ❌ EI KOSKAAN! Vain manuaalisesti tai pyynnöstä.

**Q: Mitä jos teen vahingon?**  
A: Katso "HÄTÄTILANNE" -osio. Revert ja luo PR.

**Q: Kuka voi mergetä mainiin?**  
A: Vain manuaalinen merge code review:n jälkeen.

---

## ✅ CHECKLIST ENNEN MAIN MERGEA

- [ ] Code review tehty
- [ ] Kaikki testit menee läpi
- [ ] Dokumentaatio päivitetty
- [ ] PR luotu
- [ ] Approval saatu
- [ ] **Manuaalinen merge** (ei automaattinen)
- [ ] Backup otettu (jos migration)
- [ ] Rollback-suunnitelma valmis

---

**Muista:** Main branch on tuotanto. Pidä se turvassa! 🛡️

**Last Updated:** 2025-01-10  
**Next Review:** Päivitä kun prosessi muuttuu

