# RPMS — database/README.md

## Master installation order

Run these against your Oracle PDB, in this exact order, connected as `RPMS_APP`
(except step 0, which needs a DBA account):

```
0.  (as SYSDBA/SYSTEM, once only) grant_privileges.sql
1.  schema.sql
2.  seed.sql
3.  constraints_indexes.sql          (Block 2)
4.  research_areas_institution.sql   (Block 4)
5.  project_member.sql               (Block 5)
6.  publication_workflow.sql         (Block 6)
7.  funding_dates.sql                (Block 7)
8.  advanced_queries.sql             (Block 8 — read-only, safe anytime after step 7)
9.  views.sql                        (Block 9)
10. procedures_functions.sql         (Block 10)
11. triggers.sql                     (Block 11)
12. transactions.sql                 (Block 12)
13. audit_log.sql                    (Block 13)
14. seed_data.sql                    (Block 14 — rich demo data)
15. demo_queries.sql                 (for live demonstration)
```

`reset.sql` drops everything so you can start over from step 1 — run it
first if you ever need a completely clean slate.

## Documentation index

- `NORMALIZATION.md` — Block 3 functional-dependency audit
- `DATABASE_DESIGN.md` — entities, keys, constraints, indexing, design decisions
- `ADVANCED_SQL.md` — every query in advanced_queries.sql explained
- `PLSQL.md` — every procedure, function, trigger, and how transactions/exceptions are handled
