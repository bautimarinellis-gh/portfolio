---
title: Cine Manager
order: 3
status: Trabajo de diploma
problem: >-
  Un videoclub gestiona inventario, proveedores, ventas y alquileres de forma manual, sin
  trazabilidad de quién hizo qué cambio sobre los datos.
stack: [C#, .NET, Windows Forms, SQL Server, Entity Framework]
links:
  - { label: Repositorio, href: "https://github.com/bautimarinellis-gh/cinemanager-diploma" }
---

## Decisión técnica

Arquitectura en 3 capas (UI · BLL · DAL) en C# con Entity Framework sobre SQL Server,
aplicando los patrones State (para los estados de una orden de compra: pendiente,
parcialmente completada, completada, cancelada), Singleton y Composite. Módulo de
auditoría a medida (clases `Auditoria` y `AuditoriaSesion`) en vez
de un framework de terceros, para trazabilidad de altas/bajas/modificaciones sobre
entidades críticas y de sesiones de login. Testing formal con pruebas de caja blanca
(análisis de complejidad ciclomática) y de caja negra (tabla de casos).

## Alcance

Trabajo final de Ingeniería de Software — examen final individual (cátedra Ing. Pablo
Audoglio, 3er año). 5 módulos (Compras, Ventas, Seguridad/RBAC, Inventario, Mi Perfil)
y 43 casos de uso documentados.
