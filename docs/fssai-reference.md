# FSSAI & FDA Maharashtra — Reference Notes

Quick reference for SafeBite development decisions. Verified against FSSAI publications (June 2026); exact statutory text should always be checked on fssai.gov.in before claiming compliance.

## Legal framework

- **Food Safety and Standards Act, 2006 (FSS Act)** — the umbrella statute. Administered by FSSAI (Food Safety and Standards Authority of India), a statutory body under the Ministry of Health & Family Welfare.
- **Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011** — the core licensing regulation; amended March 2026 (see below).
- Other key regulations: Packaging & Labelling (2011), Food Products Standards & Food Additives (2011), Contaminants, Toxins & Residues (2011), Prohibition and Restrictions on Sales (2011), Import (2017), Food Safety & Standards (Recovery and Distribution of Surrendered Food) Regulations, 2022.
- **FSS Act S.31** — every Food Business Operator (FBO) must be licensed/registered. S.32 — improvement notices & suspension/cancellation. S.33 — penalty for conducting business without license. S.36 Designated Officer, S.37 Food Safety Officer, S.38 FSO powers (entry, sampling, seizure).

## Licensing tiers (FSS (Licensing…) Regs 2011, as amended 10.03.2026, effective 01.04.2026)

| Category | Annual turnover threshold (from 01.04.2026) | Issuing authority |
|---|---|---|
| Registration | Up to ₹1.5 crore | Registering Authority (local) |
| State License | Above ₹1.5 crore, up to ₹50 crore | State Licensing Authority (FDA Maharashtra) |
| Central License | Above ₹50 crore + Schedule 1 activities (import/export, big manufacturers) | Central Licensing Authority (FSSAI) |

- License/registration valid **perpetually** (since the 2026 amendment) — no renewal, unless suspended/cancelled/surrendered. (Pre-2026: 1–5 years validity.)
- Street food vendors registered under the Street Vendors (Protection of Livelihood…) Act, 2014 are **deemed registered** under FSS Act (2026 amendment).
- Registration certificate within **7 days**; license within **60 days** of application ID; license must be displayed prominently at premises (Reg 2.1.4(6)).
- Annual returns due **31 May**; late fee ₹100/day.
- FSSAI license/registration number is **14 digits**: digit 1 = `1` (license) or `2` (registration); next 2 digits = state code (`27` = Maharashtra, `00` = Central); next 2 = year; next 3 = designated officer code; last 6 = serial. FSSAI number must appear on cash memos/invoices/bills.
- FBOs must display FSSAI logo + license number on packaging/label (Packaging & Labelling Regs 2011, reg 2.4.4).

## Penalties & offences (FSS Act, Chapter IX)

- S.50 selling food not of nature/substance demanded — up to ₹2 lakh.
- S.51 sub-standard food — up to ₹5 lakh.
- S.52 misbranded — up to ₹3 lakh.
- S.53 misleading advertisement — up to ₹10 lakh.
- S.56 unhygienic processing/manufacture — up to ₹1 lakh.
- S.57 storing/possessing adulterant — fine up to ₹2 lakh + imprisonment up to 6 months.
- S.58 contravention not covered — up to ₹2 lakh.
- S.59 unsafe food: injury → up to 3 yrs + ₹5 lakh; grievous hurt → min 6 yrs + ₹10 lakh; death → min 7 yrs + ₹10 lakh, up to life imprisonment.
- S.60 adulteration, S.61, S.62, S.63 — imprisonment-class offences with escalating fines.

## Enforcement machinery (state level — FDA Maharashtra)

- **Commissioner of Food Safety** (state) heads the FDA; appeal against licensing authority decisions goes to the Commissioner within **15 days** (S.32(4)-(5)).
- **Designated Officer** (S.36): receives licence/registration applications, oversees inspections.
- **Food Safety Officer** (S.37): appointed per local area; powers under S.38 — enter & inspect premises, take samples (compensation for samples), seize articles, search records.
- Improvement Notice (S.32(2)): 15 days to comply; non-compliance → suspension; continued failure → cancellation after show-cause hearing.

## Complaints / citizen flow (as mirrored in SafeBite)

- FSSAI Consumer Grievance / complaint module (FoSCoS portal, foscos.fssai.gov.in) — consumer reports are routed to the FBO to respond; unresolved complaints escalate to enforcement.
- FSSAI toll-free help/consumer numbers commonly cited: **1800-11-2100** (FSSAI helpline) and **1800-222-365** (food safety helpline — the one SafeBite shows).
- Real-world path: citizen complaint → Designated Officer → Food Safety Officer inspection → report/violations → penalties/adjudication.
- Lab samples go through FSSAI-notified labs; adulteration matters can go to adjudicating officers (S.68) / special courts for imprisonment offences (S.74).

## SafeBite alignment notes (current demo)

- License numbers generated as `12724002XXXXXX` (14-digit, Maharashtra code 27, license = starts with 1).
- Officer roles/`district` fields model Food Safety Officers under a state Commissioner; complaint auto-assignment matches officer jurisdiction to the pinned location's district, else round-robin — an approximation of the Designated-Officer routing.
- Risk model (tier A–D) mirrors FSSAI's **risk-based inspection framework** introduced in the 2026 amendment.