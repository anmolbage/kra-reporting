# Later — ideas that arrived mid-build

Anything that occurs to you while building goes here, not into the current slice. Revisit when
the appetite for this app is spent and it has survived its two-week check.

Carried over from the planning conversation, already decided as out of v1:

- Per-staff KRA targets and per-staff MTD
- Staff comparison / ranking
- "Who hasn't entered today" reminder
- Monthly export for the RO
- Multi-branch rollup (Mishrol 319 alongside Ramgarh Cantt 443)
- Weekly tab for pendency-type parameters
- The 10 additional parameters: CASA closing balance, total deposit closing balance, fresh TD
  mobilised, advance outstanding, Xpress Credit, fresh slippage to NPA, credit cards sourced,
  YONO registrations, complaints pending, KYC/RE-KYC overdue
- Balance-type parameters that display a level and month-start change rather than a running sum
- Whether NPS belongs under CVE or FI

---

Arrived during the build (20 Nov 2026):

- Anyone can lock a name for 10 minutes by typing 5 wrong PINs. Fine for one branch; revisit if it
  ever happens.
- The "also entered by … — branch total" hint under a line does not update while you type; it
  refreshes on the next redraw.
- Manager-added parameters can be added but not renamed or removed from the app (edit the
  `CUSTOM` script property by hand for now).
