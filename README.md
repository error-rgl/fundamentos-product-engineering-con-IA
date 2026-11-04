# Banco de Alimentos Comunitario

**Sistema de gestión de donaciones, inventario y distribución equitativa de alimentos.**

## Descripción del proyecto

Este proyecto busca resolver los problemas de gestión de un banco de alimentos comunitario coordinado por Jorge.

Las donaciones llegan de manera impredecible, algunos alimentos caducan por falta de control de vencimientos y no existe un registro confiable de las entregas realizadas a las familias beneficiarias.

Para solucionar estos problemas, desarrollé una aplicación web sencilla y accesible que permite organizar las donaciones, controlar el inventario y mejorar la distribución de los alimentos.

## Objetivos

- Reducir el desperdicio de alimentos.
- Mantener un inventario actualizado.
- Controlar las fechas de vencimiento.
- Registrar las entregas realizadas a las familias.
- Mejorar la distribución equitativa de los alimentos.
- Facilitar el trabajo de los voluntarios.

## Funcionalidades del producto

| Módulo | Descripción |
|---|---|
| Inicio | Resumen de la actividad y alertas prioritarias. |
| Donaciones | Registro y seguimiento de donaciones recibidas. |
| Inventario | Control de productos, cantidades y lotes. |
| Familias | Registro y consulta de familias beneficiarias. |
| Entregas | Registro e historial de distribución. |
| Reparto justo | Apoyo a la priorización de familias. |
| Necesidades | Identificación de productos escasos. |
| Indicadores | Seguimiento de resultados del banco de alimentos. |
| Ajustes | Configuración y gestión de datos. |

## Etapas del proyecto

### Etapa 1. Definición del problema y propuesta de solución

Se identificó el problema del banco de alimentos comunitario y se definió una propuesta de solución digital orientada a reducir el desperdicio y mejorar la distribución de los recursos.

### Etapa 2. Spec Driven Development

Se aplicó el enfoque Spec Driven Development (SDD) para orientar el desarrollo de funcionalidades mediante contexto persistente, especificaciones y skills.

**Feature seleccionado: Control de inventario y vencimientos mediante FEFO.**

Se prepararon los siguientes documentos:

| Archivo | Propósito |
|---|---|
| `AGENTS.md` | Contexto persistente e instrucciones generales para el agente. |
| `specs/inventario-fefo.md` | Especificación funcional y criterios de aceptación. |
| `skills/brand-design/SKILL.md` | Directrices de identidad visual y diseño. |

### Etapa 3. Lanzamiento a producción

En esta etapa se amplía la solución mediante una nueva funcionalidad enfocada en mejorar la distribución equitativa de los alimentos.

**ICP (Ideal Customer Profile)**

Organizaciones comunitarias, bancos de alimentos y comedores populares pequeños que trabajan con voluntarios, cuentan con presupuestos limitados y necesitan organizar sus donaciones e inventarios.

**User Persona**

Jorge Ramírez, coordinador de un banco de alimentos comunitario de Lima, Perú. Tiene 52 años, experiencia tecnológica básica y coordina un equipo de voluntarios que cambia semanalmente.

Su principal necesidad es conocer qué alimentos tiene disponibles y garantizar que las familias reciban ayuda de manera organizada y transparente.

**Nuevo feature: Priorización equitativa de familias.**

Se propone un módulo que permita:

- Consultar las familias beneficiarias.
- Identificar cuánto tiempo llevan sin recibir ayuda.
- Considerar el número de integrantes.
- Generar propuestas de priorización.
- Explicar los criterios utilizados.
- Mantener la aprobación final bajo responsabilidad de Jorge.

**Nueva especificación:**

`specs/priorizacion-familias.md`

Esta especificación incluye criterios de aceptación y métricas de éxito para evaluar el funcionamiento de la nueva característica.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Next.js 16 | Framework de aplicación web. |
| React 19 | Construcción de interfaces. |
| TypeScript | Tipado y mantenibilidad del código. |
| Tailwind CSS 4 | Estilos y diseño visual. |
| Base UI | Componentes de interfaz. |
| Lucide React | Iconografía. |
| pnpm | Gestión de dependencias. |
| Vercel | Despliegue de la aplicación. |

## Estructura del proyecto

```text
fundamentos-product-engineering-con-IA/
├── AGENTS.md
├── specs/
│   ├── inventario-fefo.md
│   └── priorizacion-familias.md
├── skills/
│   └── brand-design/
│       └── SKILL.md
├── app/
├── components/
├── lib/
├── public/
├── tests/
├── package.json
└── README.md

## Instalación y ejecución

### Requisitos previos

- Node.js
- pnpm

### Clonar el repositorio

```bash
git clone https://github.com/error-rgl/fundamentos-product-engineering-con-IA.git
```

### Instalar dependencias

```bash
cd fundamentos-product-engineering-con-IA
pnpm install
```

### Ejecutar el proyecto

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Enlaces del proyecto

- **Publicado en:** https://gestion-banco-alimentos.vercel.app/



