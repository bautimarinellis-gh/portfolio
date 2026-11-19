---
title: Cine Manager
order: 3
status: Diploma project
problem: >-
  A video rental store manages inventory, suppliers, sales and rentals by hand, with no record of who
  changed what in the data.
stack: [C#, .NET, Windows Forms, SQL Server, Entity Framework]
links:
  - { label: Repository, href: "https://github.com/bautimarinellis-gh/cinemanager-diploma" }
---

## Technical decisions

Three-layer architecture (UI · BLL · DAL) in C# with Entity Framework on SQL Server, applying the
State pattern (for purchase order states: pending, partially completed, completed, cancelled),
Singleton and Composite. A custom audit module (`Auditoria` and `AuditoriaSesion` classes) instead of
a third-party framework, to trace inserts, deletes and updates on critical entities and login
sessions. Formal testing with white-box tests (cyclomatic complexity analysis) and black-box tests
(test case tables).

## Scope

Final project for Software Engineering — individual final exam (3rd year). 5 modules (Purchasing,
Sales, Security/RBAC, Inventory, My Profile) and 43 documented use cases.
