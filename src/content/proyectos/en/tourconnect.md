---
title: TourConnect
order: 1
status: Completed · Engineering thesis
problem: >-
  Tour wholesalers manage prices over WhatsApp, bookings over email and margins in spreadsheets:
  no traceability and no differentiated access control for the retail agencies they sell to.
stack: [Node.js, Express, React, MongoDB, JWT, Multitenant]
links:
  - { label: Repository, href: "https://github.com/bautimarinellis-gh/tourconnect-tfi" }
---

## Technical decisions

Multitenant MERN architecture with role-based access control enforced by middleware and JWT, to
separate what a wholesaler and an agency can do. A custom RAG-style assistant (intent classifier +
query executor) that queries MongoDB directly instead of a vector database, favouring simplicity and
cost given a bounded set of questions. An audit trail module to trace every change to quotes and
bookings.

## Scope

Final engineering project. REST API with more than 10 modules (authentication, catalog, quotes,
bookings and payments), functional documentation with UML and endpoint testing with Postman.
