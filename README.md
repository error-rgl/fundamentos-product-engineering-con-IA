

\# Banco de Alimentos Comunitario



\*\*Sistema de gestión de donaciones, inventario y distribución equitativa de alimentos.\*\*



\## Descripción del proyecto



Este proyecto consiste en desarrollar una solución digital para mejorar la gestión de un banco de alimentos comunitario coordinado por Jorge.



El problema principal es que las donaciones llegan de manera impredecible, no existe un control adecuado de las fechas de vencimiento y tampoco se cuenta con un registro confiable de las entregas realizadas a las familias beneficiarias.



Por ello, propongo una aplicación web sencilla y accesible que permita organizar las donaciones, controlar el inventario, reducir el desperdicio de alimentos y mejorar la distribución de los recursos disponibles.



\## Objetivos



\- Reducir el desperdicio de alimentos.

\- Mantener un inventario actualizado.

\- Controlar las fechas de vencimiento.

\- Registrar las entregas realizadas a las familias.

\- Mejorar la distribución equitativa de los alimentos.

\- Facilitar el trabajo de los voluntarios mediante una interfaz sencilla.



\## Funcionalidades del producto



La aplicación contempla los siguientes módulos:



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



\## Segunda etapa: Spec Driven Development



En esta segunda etapa, retomo el proyecto y aplico el enfoque \*\*Spec Driven Development (SDD)\*\* para desarrollar una funcionalidad prioritaria mediante especificaciones que orienten el trabajo de un agente de inteligencia artificial.



\### Feature seleccionado: Control de inventario y vencimientos



Elegí esta funcionalidad porque uno de los principales problemas identificados es la pérdida de alimentos debido a la falta de control de las fechas de vencimiento.



La solución consiste en gestionar los alimentos por lotes y aplicar el principio \*\*FEFO (First Expired, First Out)\*\*, priorizando los productos aptos cuya fecha de vencimiento esté más próxima.



\### Entregables de SDD



Para orientar el desarrollo del feature, preparé tres archivos:



| Archivo | Propósito |

|---|---|

| `AGENTS.md` | Define el contexto persistente y las instrucciones generales del proyecto. |

| `specs/inventario-fefo.md` | Describe el problema, el diseño de la solución y los criterios de aceptación. |

| `skills/brand-design/SKILL.md` | Establece las directrices de identidad visual y diseño de la aplicación. |



\### Criterios de aceptación



La especificación contempla cinco comportamientos verificables:



1\. Registrar nuevos lotes y actualizar el inventario.

2\. Priorizar los lotes mediante el principio FEFO.

3\. Bloquear productos vencidos para su distribución normal.

4\. Validar las existencias y evitar cantidades negativas.

5\. Identificar los alimentos próximos a vencer.



\## Tecnologías utilizadas



| Tecnología | Uso |

|---|---|

| Next.js 16 | Framework de aplicación web. |

| React 19 | Construcción de interfaces. |

| TypeScript | Tipado y mantenibilidad del código. |

| Tailwind CSS 4 | Estilos y diseño visual. |

| Base UI | Componentes de interfaz. |

| Lucide React | Iconografía. |

| pnpm | Gestión de dependencias. |



\## Estructura del proyecto



```text

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

```



\## Instalación y ejecución



\### Requisitos previos



\- Node.js

\- pnpm



\### Clonar el repositorio



```bash

git clone https://github.com/error-rgl/fundamentos-product-engineering-con-IA.git

```



\### Instalar dependencias



```bash

cd fundamentos-product-engineering-con-IA

pnpm install

```



\### Ejecutar el proyecto



```bash

pnpm dev

```



La aplicación estará disponible en:



`http://localhost:3000`





\## Enlaces del proyecto



\- \*\*Aplicación web:\*\* https://gestion-banco-alimentos.vercel.app/

\- \*\*Repositorio GitHub:\*\* https://github.com/error-rgl/fundamentos-product-engineering-con-IA



\---

