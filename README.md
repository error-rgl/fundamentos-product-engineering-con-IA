Banco de Alimentos Comunitario



Sistema de gestión de donaciones, inventario y distribución equitativa de alimentos.



Aplicación web orientada a mejorar la gestión de un banco de alimentos comunitario, ayudando a reducir el desperdicio y garantizar una distribución más organizada y justa entre las familias beneficiarias.



Ver aplicación · Ver repositorio



1\. Sobre el proyecto



El proyecto nace de la necesidad de resolver los problemas de organización de un banco de alimentos comunitario coordinado por Jorge.



Actualmente, las donaciones llegan de manera impredecible, no existe un control adecuado de los vencimientos y tampoco hay un registro confiable de las entregas realizadas a las familias.



La solución propone una herramienta digital sencilla, accesible y de bajo costo que facilite el trabajo de Jorge y los voluntarios.



Objetivos

Reducir el desperdicio de alimentos.

Mantener un inventario actualizado.

Controlar las fechas de vencimiento.

Registrar las entregas realizadas.

Mejorar la distribución equitativa entre familias.

Facilitar el trabajo de voluntarios con poca experiencia tecnológica.

2\. Funcionalidades del producto



La aplicación contempla los siguientes módulos:



Módulo	Descripción

Inicio	Resumen de la actividad y alertas prioritarias.

Donaciones	Registro y seguimiento de donaciones recibidas.

Inventario	Control de productos, cantidades y lotes.

Familias	Registro y consulta de familias beneficiarias.

Entregas	Registro e historial de distribución.

Reparto justo	Apoyo a la priorización de familias.

Necesidades	Identificación de productos escasos.

Indicadores	Seguimiento de resultados del banco de alimentos.

Ajustes	Configuración y gestión de datos.

3\. Segunda etapa: Spec Driven Development



En esta etapa se aplica el enfoque Spec Driven Development (SDD) para reconstruir una funcionalidad prioritaria del producto mediante especificaciones estructuradas que orientan el trabajo de un agente de IA.



Feature seleccionado: Control de inventario y vencimientos



Se seleccionó este feature porque uno de los principales problemas del banco de alimentos es la pérdida de productos por falta de control de las fechas de vencimiento.



La solución propone gestionar los alimentos por lotes y aplicar el principio FEFO (First Expired, First Out), priorizando aquellos productos aptos cuya fecha de vencimiento esté más próxima.



Entregables de SDD

Archivo	Propósito

AGENTS.md	Define el contexto persistente y las instrucciones generales del proyecto.

specs/inventario-fefo.md	Establece el problema, el diseño de la solución y los criterios de aceptación.

skills/brand-design/SKILL.md	Define las directrices de identidad visual y diseño de la aplicación.

Criterios de aceptación



La especificación establece cinco criterios verificables:



Registro de nuevos lotes y actualización del inventario.

Priorización de lotes mediante FEFO.

Bloqueo de productos vencidos para distribución normal.

Validación de existencias para evitar cantidades negativas.

Identificación de alimentos próximos a vencer.

4\. Tecnologías

Tecnología	Uso

Next.js 16	Framework de aplicación web.

React 19	Construcción de interfaces.

TypeScript	Tipado y mantenibilidad del código.

Tailwind CSS 4	Estilos y diseño visual.

Base UI	Componentes de interfaz.

Lucide React	Iconografía.

pnpm	Gestión de dependencias.

5\. Estructura del proyecto

text

fundamentos-product-engineering-con-IA/

│

├── AGENTS.md

├── specs/

│   └── inventario-fefo.md

│

├── skills/

│   └── brand-design/

│       └── SKILL.md

│

├── app/

├── components/

├── lib/

├── public/

├── tests/

│

├── package.json

└── README.md



6\. Instalación y ejecución

Requisitos

Node.js

pnpm

Clonar el repositorio

bash

git clone https://github.com/error-rgl/fundamentos-product-engineering-con-IA.git



Instalar dependencias

bash

cd fundamentos-product-engineering-con-IA

pnpm install



Iniciar el entorno de desarrollo

bash

pnpm dev





La aplicación estará disponible en:



http://localhost:3000



