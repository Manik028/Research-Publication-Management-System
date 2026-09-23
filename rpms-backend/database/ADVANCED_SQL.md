# RPMS — ADVANCED_SQL.md

Documents every query in `advanced_queries.sql` (25 queries, 7 categories,
all against the real RPMS schema).

| # | Technique | Problem solved | Tables |
|---|---|---|---|
| 1.1 | INNER + LEFT JOIN | Full author list + venue per publication | PUBLICATION, AUTHOR_PUBLICATION, USER, VENUE |
| 1.2 | LEFT JOIN | Every researcher's pub count, including zero | USER, AUTHOR_PUBLICATION |
| 1.3 | SELF JOIN | Most common co-author pairs | AUTHOR_PUBLICATION (x2), USER (x2) |
| 1.4 | FULL OUTER JOIN | Demonstrates unmatched rows on both sides | USER, PROJECT_MEMBER |
| 1.5 | Multi-table JOIN | Full project overview: manager, members, funding | PROJECT, USER, PROJECT_MEMBER, GRANT_FUNDING |
| 2.1 | GROUP BY + HAVING | Research areas with >1 publication | PUBLICATION_RESEARCH_AREA, RESEARCH_AREA |
| 2.2 | AVG/MIN/MAX | Review score spread per publication | PUBLICATION, REVIEW |
| 2.3 | SUM | Total funding per funding body | GRANT_FUNDING, FUNDING_BODY |
| 3.1 | Scalar subquery | Above-average-viewed publications | PUBLICATION |
| 3.2 | NOT EXISTS (correlated) | Researchers who never published | USER, AUTHOR_PUBLICATION |
| 3.3 | EXISTS (correlated) | Publications with ≥1 completed review | PUBLICATION, REVIEW |
| 3.4 | IN (nested) | Projects funded by a Government body | PROJECT, GRANT_FUNDING, FUNDING_BODY |
| 3.5 | NOT IN | Researchers on no project | USER, PROJECT_MEMBER |
| 3.6 | ALL | Publications where every review scored ≥7 | PUBLICATION, REVIEW |
| 4.1 | UNION | Everyone connected to a project (manager or member) | PROJECT, PROJECT_MEMBER |
| 4.2 | INTERSECT | Researchers who are both authors and reviewers | AUTHOR_PUBLICATION, REVIEW |
| 4.3 | MINUS | Authors who have never reviewed | AUTHOR_PUBLICATION, REVIEW |
| 5.1 | CASE | Engagement tiers by view count | PUBLICATION |
| 5.2 | NVL | Friendly placeholder for no venue | PUBLICATION, VENUE |
| 6.1 | CTE (WITH) | Pre-computed project funding, then filtered | PROJECT, GRANT_FUNDING |
| 7.1 | ROW_NUMBER + PARTITION BY | Top researcher per department | USER, AUTHOR_PUBLICATION |
| 7.2 | RANK | Publications ranked by views | PUBLICATION |
| 7.3 | LAG + PARTITION BY | Each grant vs the funding body's previous grant | GRANT_FUNDING, FUNDING_BODY |
| 7.4 | SUM() OVER | Running total funding per project over time | GRANT_FUNDING |

All results are empty until `seed_data.sql` runs — that's expected; the
file's purpose is to prove the SQL is syntactically and semantically
correct against the live schema, then become meaningful once real data
exists.
