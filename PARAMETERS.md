# Parameter master — 41 parameters, 7 groups

Source of truth for the app's fixed parameter list. Build the `GROUPS` constant from this
table exactly: same ids, same display names, same order, same mode.

**Mode** controls which input boxes appear:

- `both` — A/C count **and** Amount
- `count` — A/C count only (no amount box in the app, shaded box on the printed form)
- `amount` — Amount only

Ids are permanent. Once data exists in the Sheet against an id, renaming it orphans that data —
change the display name instead, never the id.

---

## 1. Advance — group id `adv`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 1 | `adv_total` | Total Disbursement | both |
| 2 | `adv_hbtl` | HBTL | both |
| 3 | `adv_ptl` | PTL | both |
| 4 | `adv_car` | CAR | both |
| 5 | `adv_srto` | SRTO | both |
| 6 | `adv_sme` | SME | both |
| 7 | `adv_gold` | Gold / LATDR | both |

## 2. NPA — group id `npa`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 8 | `npa_pnpa` | PNPA (IRC 3) Reduction | both |
| 9 | `npa_red` | NPA Reduction | both |
| 10 | `npa_auca` | AUCA Recovery | both |

## 3. CVE — group id `cve`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 11 | `cve_life` | SBI Life | both |
| 12 | `cve_pai` | SBI Gen - PAI | both |
| 13 | `cve_arogya` | SBI Gen - Arogya | both |
| 14 | `cve_other` | SBI Gen - Other | both |
| 15 | `cve_sip` | SIP | both |
| 16 | `cve_lump` | Lumpsum | both |
| 17 | `cve_nps` | NPS | both |

## 4. FI — group id `fi`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 18 | `cve_apy` | APY | count |
| 19 | `cve_jjby` | PMJJBY | count |
| 20 | `cve_sby` | PMSBY | count |

> The `cve_` prefix on these three is deliberate — they were in the CVE group before CVE and FI
> were split, and the ids were kept so existing rows did not orphan. The group is `fi`.

## 5. Deposit — group id `dep`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 21 | `dep_funded` | Funded SB | both |
| 22 | `dep_hvsb` | High Value SB (>5K) | both |
| 23 | `dep_ca` | Current Account | both |

## 6. Digital Channel — group id `dig`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 24 | `dig_atm` | ATM | count |
| 25 | `dig_mb` | Mobile Banking | count |
| 26 | `dig_ib` | Internet Banking | count |
| 27 | `dig_vkyc` | V-KYC | count |
| 28 | `dig_img` | Image Uploaded | count |
| 29 | `dig_wa` | WhatsApp Banking | count |
| 30 | `dig_fdmb` | FD / RD - MB | count |
| 31 | `dig_fdib` | FD / RD - IB | count |

## 7. Audit & Compliance — group id `cmp`

| # | ParamID | Parameter | Mode |
|---|---|---|---|
| 32 | `cmp_aadhaar` | Aadhaar - Dedup | count |
| 33 | `cmp_pan` | PAN Dedup | count |
| 34 | `cmp_nom` | Nomination | count |
| 35 | `cmp_kyc` | KYC | count |
| 36 | `cmp_rekyc` | RE-KYC | count |
| 37 | `cmp_ckyc` | C-KYC | count |
| 38 | `cmp_scan` | Image Scanning | count |
| 39 | `cmp_nonkyc` | NON-KYC | count |
| 40 | `cmp_inop` | Inoperative to Operative | count |
| 41 | `cmp_deaf` | DEAF Retrieval | count |

---

## Report output format

The daily WhatsApp message must come out in this shape — group headings uppercase, numbering
restarting within each group, groups with no figures omitted:

```
Ramgarh Cantt (443)
📅 Date: 20-11-2026

ADVANCE
1) Total Disbursement- 3 A/C / 4,50,000
2) SME- 1 A/C / 2,00,000

CVE
1) SIP- 3 A/C / 15,000

FI
1) APY- 4

AUDIT & COMPLIANCE
1) Nomination- 26
2) Inoperative to Operative- 7
```

Value formatting rules:

- Count **and** amount present → `3 A/C / 4,50,000`
- Count only → `4`
- Amount only → `2,00,000`
- Amounts use Indian digit grouping (`toLocaleString('en-IN')`)
- Figures are the **branch total** — every person's entry for that parameter, summed

A "Full format" toggle prints every parameter including blanks, for when the controller wants
the whole list.
