\# SPEC: Priorización equitativa de familias



\## 1. Información general



\- \*\*Proyecto:\*\* Banco de Alimentos Comunitario.

\- \*\*Feature:\*\* Priorización equitativa de familias beneficiarias.

\- \*\*Prioridad:\*\* Alta.

\- \*\*Usuario principal:\*\* Jorge, coordinador del banco de alimentos.



\## 2. Definición del problema



Actualmente, Jorge no dispone de un mecanismo claro para identificar qué familias llevan más tiempo sin recibir ayuda.



Esto provoca que algunas familias puedan recibir alimentos varias veces mientras otras permanecen esperando.



Cuando las donaciones son insuficientes para atender a todos los beneficiarios, se necesita un mecanismo transparente que facilite la toma de decisiones.



\## 3. Objetivo



Desarrollar una funcionalidad que permita consultar las familias beneficiarias, conocer cuánto tiempo llevan esperando desde su última entrega y generar una propuesta de prioridad para organizar la distribución de alimentos.



La decisión final siempre debe permanecer bajo la responsabilidad de Jorge.



\## 4. Diseño de la solución



Crear un módulo denominado \*\*Prioridad de familias\*\* dentro de la aplicación.



Debe incluir:

\- Listado de familias registradas.

\- Fecha de la última entrega.

\- Número de integrantes.

\- Días transcurridos desde la última ayuda.

\- Estado de atención.

\- Indicador de prioridad.

\- Propuesta de distribución.



\### Criterios de priorización



El sistema debe considerar:

1\. Mayor tiempo transcurrido desde la última entrega.

2\. Número de integrantes de la familia.

3\. Historial de entregas recientes.

4\. Necesidades justificadas registradas.



El sistema debe explicar por qué una familia aparece en determinada posición.  

La propuesta debe poder revisarse antes de confirmar cualquier entrega.



\## 5. Criterios de aceptación



\### CA-01. Visualización de familias pendientes

\- \*\*Dado que\*\* existen familias registradas en el sistema.

\- \*\*Cuando\*\* Jorge ingresa al módulo de priorización.

\- \*\*Entonces\*\* debe visualizar el listado de familias, su última fecha de entrega y los días transcurridos desde esa fecha.



\### CA-02. Priorización por tiempo de espera

\- \*\*Dado que\*\* existen tres familias elegibles:



| Familia | Días sin recibir ayuda |

| :--- | :--- |

| F001 | 20 |

| F002 | 12 |

| F003 | 4 |



\- \*\*Cuando\*\* Jorge solicita una propuesta de priorización.

\- \*\*Entonces\*\* el sistema debe ordenar F001, F002 y F003, explicando que se utiliza el tiempo de espera como criterio principal.



\### CA-03. Consideración del tamaño familiar

\- \*\*Dado que\*\* dos familias tienen el mismo tiempo de espera.

\- \*\*Cuando\*\* el sistema genera la propuesta de prioridad.

\- \*\*Entonces\*\* debe mostrar el número de integrantes como criterio secundario para facilitar la evaluación de Jorge.



\### CA-04. Confirmación manual de la distribución

\- \*\*Dado que\*\* el sistema ha generado una propuesta de priorización.

\- \*\*Когда\*\* (o \*\*Cuando\*\*) Jorge revisa las familias sugeridas.

\- \*\*Entonces\*\* debe poder aprobar o modificar la propuesta y ninguna entrega debe registrarse automáticamente.



\## 6. Métricas de éxito



Se utilizarán las siguientes métricas para evaluar el funcionamiento del feature:



| Métrica | Objetivo |

| :--- | :--- |

| \*\*Cobertura de familias\*\* | Incrementar en 20% la proporción de familias elegibles atendidas durante un periodo de medición. |

| \*\*Tiempo de espera\*\* | Reducir en 15% el tiempo promedio de espera de las familias. |

| \*\*Trazabilidad\*\* | Alcanzar un 100% de propuestas con explicación del criterio de prioridad. |

| \*\*Control de entregas\*\* | Lograr que el 100% de las entregas confirmadas queden registradas en el historial. |



> \*Nota: Los porcentajes son objetivos iniciales de diseño y deberán contrastarse con una línea base real.\*



\### Fórmulas de medición



\- \*\*Cobertura de familias:\*\*  

&#x20; Familias elegibles atendidas / Total de familias elegibles × 100.



\- \*\*Tiempo promedio de espera:\*\*  

&#x20; Suma de días de espera de las familias elegibles / Número de familias elegibles.



\- \*\*Trazabilidad:\*\*  

&#x20; Propuestas con criterios explicados / Total de propuestas generadas × 100.



\- \*\*Registro de entregas:\*\*  

&#x20; Entregas confirmadas con historial / Total de entregas confirmadas × 100.



\## 7. Reglas de negocio



\- Cada familia debe tener un identificador único.

\- La fecha de la última entrega debe actualizarse al confirmar una nueva entrega.

\- Las familias sin historial de entregas deben identificarse como pendientes de primera atención.

\- El tiempo de espera será el criterio principal de priorización.

\- El número de integrantes será un criterio secundario.

\- Las excepciones deben incluir una justificación.

\- Ninguna propuesta debe convertirse automáticamente en una entrega.

\- El sistema debe conservar el historial de las decisiones y entregas.



\## 8. Fuera del alcance



\- Asignación automática de alimentos.

\- Decisiones automatizadas mediante inteligencia artificial.

\- Gestión de solicitudes externas.

\- Notificaciones por SMS o WhatsApp.

\- Predicción de necesidades familiares.



\## 9. Experiencia de usuario



La interfaz debe ser sencilla y mantener la identidad visual del Banco de Alimentos Comunitario.



Debe mostrar claramente las familias prioritarias, los días de espera y las razones de priorización.



Se deben utilizar tablas legibles, indicadores visuales y acciones claramente identificadas.



\## 10. Resultado esperado



Un módulo que ayude a Jorge a tomar decisiones transparentes sobre la distribución de alimentos, mejorar la cobertura de las familias beneficiarias y reducir los tiempos de espera, manteniendo siempre la supervisión humana.

