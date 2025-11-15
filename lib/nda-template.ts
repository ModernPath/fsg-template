/**
 * NDA Template Generator
 * 
 * Generates customizable Non-Disclosure Agreement documents
 */

export interface NDAData {
  company_name: string;
  company_business_id?: string;
  company_address?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_company?: string;
  recipient_address?: string;
  effective_date: string;
  purpose: string;
  term_years?: number;
}

export function generateNDATemplate(data: NDAData): string {
  const termYears = data.term_years || 3;
  const currentDate = new Date().toLocaleDateString('fi-FI');

  return `
# SALASSAPITOSOPIMUS
## NON-DISCLOSURE AGREEMENT

**Päivämäärä / Date:** ${data.effective_date || currentDate}

---

## 1. OSAPUOLET / PARTIES

**Tietojen luovuttaja / Disclosing Party:**
${data.company_name}
${data.company_business_id ? `Y-tunnus / Business ID: ${data.company_business_id}` : ''}
${data.company_address || ''}

**Tietojen vastaanottaja / Receiving Party:**
${data.recipient_name}
${data.recipient_email}
${data.recipient_company ? `Yritys / Company: ${data.recipient_company}` : ''}
${data.recipient_address || ''}

---

## 2. TARKOITUS / PURPOSE

Tämä salassapitosopimus ("Sopimus") määrittelee ehdot, joilla Tietojen luovuttaja voi luovuttaa luottamuksellisia tietoja Tietojen vastaanottajalle seuraavaa tarkoitusta varten:

This Non-Disclosure Agreement ("Agreement") sets forth the terms under which the Disclosing Party may disclose confidential information to the Receiving Party for the following purpose:

**${data.purpose}**

---

## 3. LUOTTAMUKSELLISET TIEDOT / CONFIDENTIAL INFORMATION

### 3.1 Määritelmä / Definition

"Luottamuksellisilla tiedoilla" tarkoitetaan kaikkia tietoja, jotka:
- Liittyvät Tietojen luovuttajan liiketoimintaan, tuotteisiin, palveluihin tai suunnitelmiin
- On merkitty "Luottamuksellinen" tai vastaavasti
- Luonteensa puolesta tulisi ymmärtää luottamuksellisiksi

"Confidential Information" means all information that:
- Relates to the Disclosing Party's business, products, services, or plans
- Is marked as "Confidential" or similar
- Should reasonably be understood as confidential

### 3.2 Sisältö / Content

Luottamukselliset tiedot voivat sisältää, mutta eivät rajoitu:
- Taloudelliset tiedot ja luvut
- Liiketoimintasuunnitelmat ja strategiat
- Asiakastiedot ja sopimukset
- Tekniset tiedot ja dokumentaatio
- Hinnoittelu ja tarjoukset
- Immateriaalioikeudet

Confidential Information may include, but is not limited to:
- Financial information and figures
- Business plans and strategies
- Customer information and contracts
- Technical information and documentation
- Pricing and quotations
- Intellectual property

---

## 4. VELVOLLISUUDET / OBLIGATIONS

### 4.1 Salassapitovelvollisuus / Duty of Confidentiality

Tietojen vastaanottaja sitoutuu:
1. Pitämään Luottamukselliset tiedot ehdottoman salassa
2. Käyttämään tietoja ainoastaan sovittuun tarkoitukseen
3. Suojaamaan tiedot vähintään samalla huolellisuudella kuin omat luottamukselliset tietonsa
4. Rajoittamaan tietojen saatavuus vain niille henkilöille, joiden on välttämätöntä saada ne

The Receiving Party agrees to:
1. Keep all Confidential Information strictly confidential
2. Use the information solely for the agreed purpose
3. Protect the information with at least the same degree of care as its own confidential information
4. Limit access only to those who need to know

### 4.2 Rajoitukset / Restrictions

Tietojen vastaanottaja ei saa:
- Kopioida tai jäljentää Luottamuksellisia tietoja ilman lupaa
- Paljastaa tietoja kolmansille osapuolille
- Käyttää tietoja omaksi tai kolmannen osapuolen hyödyksi
- Käänteismallintaa tai purkaa teknisiä ratkaisuja

The Receiving Party shall not:
- Copy or reproduce Confidential Information without permission
- Disclose information to third parties
- Use information for its own or third party's benefit
- Reverse engineer or disassemble technical solutions

---

## 5. POIKKEUKSET / EXCEPTIONS

Salassapitovelvollisuus ei koske tietoja, jotka:
1. Olivat julkisesti saatavilla ennen luovutusta
2. Tulevat julkisiksi ilman Tietojen vastaanottajan syytä
3. Olivat Tietojen vastaanottajan hallussa ennen luovutusta
4. On saatu laillisesti kolmannelta osapuolelta
5. On kehitetty itsenäisesti ilman Luottamuksellisten tietojen käyttöä
6. On luovutettava lain tai viranomaisen määräyksen perusteella

The confidentiality obligation does not apply to information that:
1. Was publicly available before disclosure
2. Becomes public without fault of the Receiving Party
3. Was in possession of the Receiving Party before disclosure
4. Was lawfully obtained from a third party
5. Was independently developed without use of Confidential Information
6. Must be disclosed by law or regulatory requirement

---

## 6. TIETOJEN PALAUTUS / RETURN OF INFORMATION

Tietojen luovuttajan pyynnöstä tai Sopimuksen päättyessä, Tietojen vastaanottaja sitoutuu:
1. Palauttamaan tai tuhoamaan kaikki Luottamukselliset tiedot
2. Toimittamaan kirjallisen vahvistuksen tietojen tuhoamisesta
3. Poistamaan tiedot kaikista järjestelmistä ja varmuuskopioista

Upon request of the Disclosing Party or termination of this Agreement, the Receiving Party agrees to:
1. Return or destroy all Confidential Information
2. Provide written confirmation of destruction
3. Delete information from all systems and backups

---

## 7. SOPIMUKSEN KESTO / TERM

### 7.1 Voimassaolo / Validity

Tämä Sopimus on voimassa **${termYears} (${termYears === 1 ? 'yhden' : termYears === 2 ? 'kahden' : 'kolmen'}) vuoden ajan** allekirjoituspäivämäärästä.

This Agreement shall remain in effect for **${termYears} (${termYears === 1 ? 'one' : termYears === 2 ? 'two' : 'three'}) years** from the date of signature.

### 7.2 Jatkuva velvollisuus / Continuing Obligation

Salassapitovelvollisuus jatkuu Sopimuksen päättymisen jälkeen koskien kaikkia Sopimuksen voimassaoloaikana saatuja Luottamuksellisia tietoja.

The confidentiality obligation continues after termination of this Agreement for all Confidential Information received during its term.

---

## 8. SOPIMUSRIKKOMUS / BREACH

### 8.1 Vahingonkorvaus / Damages

Osapuolet tunnustavat, että Sopimuksen rikkominen voi aiheuttaa korjaamatonta vahinkoa. Tietojen luovuttajalla on oikeus:
- Vaatia välitöntä kieltotuomiota
- Vaatia täyttä korvausta kaikista vahingoista
- Vaatia kohtuulliset oikeudenkäyntikulut

The parties acknowledge that breach may cause irreparable harm. The Disclosing Party has the right to:
- Seek immediate injunctive relief
- Claim full compensation for all damages
- Claim reasonable legal costs

---

## 9. YLEISET EHDOT / GENERAL TERMS

### 9.1 Sovellettava laki / Governing Law

Tähän Sopimukseen sovelletaan Suomen lakia.
This Agreement shall be governed by the laws of Finland.

### 9.2 Riitojen ratkaisu / Dispute Resolution

Sopimusta koskevat erimielisyydet ratkaistaan ensisijaisesti neuvottelemalla. Jos neuvottelut eivät johda ratkaisuun 30 päivän kuluessa, riita ratkaistaan Helsingin käräjäoikeudessa.

Disputes shall be resolved primarily through negotiation. If negotiations do not lead to resolution within 30 days, disputes shall be settled in the District Court of Helsinki.

### 9.3 Muutokset / Amendments

Tähän Sopimukseen tehtävät muutokset on tehtävä kirjallisesti ja molempien osapuolten on hyväksyttävä ne.

Any amendments to this Agreement must be made in writing and approved by both parties.

### 9.4 Siirto / Assignment

Kumpikaan osapuoli ei saa siirtää tätä Sopimusta kolmannelle osapuolelle ilman toisen osapuolen kirjallista suostumusta.

Neither party may assign this Agreement to a third party without written consent of the other party.

---

## 10. ALLEKIRJOITUKSET / SIGNATURES

**Tietojen luovuttaja / Disclosing Party:**

${data.company_name}

_________________________________
Allekirjoitus / Signature

_________________________________
Nimen selvennys / Name

_________________________________
Päivämäärä / Date


**Tietojen vastaanottaja / Receiving Party:**

${data.recipient_name}
${data.recipient_company || ''}

_________________________________
Allekirjoitus / Signature

_________________________________
Päivämäärä / Date

---

**Tämä dokumentti on luotu BizExit-järjestelmällä**
**This document was created using BizExit platform**

`.trim();
}

export function generateNDAPDF(data: NDAData): string {
  // This would integrate with a PDF library like jsPDF or PDFKit
  // For now, return the markdown template
  return generateNDATemplate(data);
}

