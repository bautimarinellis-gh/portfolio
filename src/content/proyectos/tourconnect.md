---
title: TourConnect
order: 1
status: En desarrollo · Trabajo Final de Ingeniería
active: true
problem: >-
  Los mayoristas turísticos gestionan precios por WhatsApp, reservas por email y márgenes
  en Excel: sin trazabilidad y sin control de acceso diferenciado frente a sus agencias minoristas.
stack: [Node.js, Express, React, MongoDB, JWT, Multitenant]
links:
  - { label: Repositorio, href: "https://github.com/bautimarinellis-gh/tourconnect-tfi" }
---

## Decisión técnica

Arquitectura multitenant (MERN) con RBAC validado vía middleware y JWT para separar
permisos entre mayorista y agencia. Asistente RAG propio (Intent Classifier + Query
Executor) que consulta MongoDB directamente en lugar de una vector DB, priorizando
simplicidad y costo dado un dominio de consultas acotado. Módulo de Audit Trail para
trazabilidad de cambios sobre cotizaciones y reservas.

## Alcance

Trabajo Final de Ingeniería. API REST con 7 módulos funcionales (autenticación, catálogo,
cotizaciones, reservas y pagos), documentación funcional con UML y testing de endpoints
con Postman.
