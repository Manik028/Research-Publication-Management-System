# RPMS — database/README.md

## Master installation order

Run these against your Oracle PDB, in this exact order, connected as `RPMS_APP`
(except step 0, which needs a DBA account):

```
0.  (as SYSDBA/SYSTEM, once only) grant_privileges.sql
1.  schema.sql
2.  seed.sql
3.  constraints_indexes.sql         
4.  research_areas_institution.sql   
5.  project_member.sql               
6.  publication_workflow.sql       
7.  funding_dates.sql               
8.  advanced_queries.sql             
9.  views.sql                       
10. procedures_functions.sql         
11. triggers.sql                 
12. transactions.sql              
13. audit_log.sql               
14. seed_data.sql                   
15. demo_queries.sql                 
```

`reset.sql` drops everything so you can start over from step 1 — run it
first if you ever need a completely clean slate.

## Documentation index

- `NORMALIZATION.md` — Block 3 functional-dependency audit
- `DATABASE_DESIGN.md` — entities, keys, constraints, indexing, design decisions
- `ADVANCED_SQL.md` — every query in advanced_queries.sql explained
- `PLSQL.md` — every procedure, function, trigger, and how transactions/exceptions are handled
