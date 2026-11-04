AGENTS.md

1\. Identidad del proyecto



Nombre: Banco de Alimentos Comunitario



Descripción: Aplicación digital para ayudar a Jorge y a los voluntarios de un banco de alimentos comunitario a gestionar donaciones, inventario, familias beneficiarias y entregas.



Objetivo principal: Reducir el desperdicio de alimentos y mejorar la distribución equitativa de los recursos disponibles.



2\. Contexto del usuario



El usuario principal es Jorge, coordinador del banco de alimentos.



Los voluntarios cambian semanalmente y muchos tienen poca experiencia tecnológica. La organización no dispone de presupuesto para adquirir software especializado ni contratar personal técnico.



Por ello, la aplicación debe ser sencilla, accesible, económica y fácil de mantener.



3\. Stack tecnológico



El proyecto utiliza:



Next.js 16.

React 19.

TypeScript.

Tailwind CSS 4.

Base UI.

Lucide React.

pnpm.



Antes de modificar código, inspeccionar la estructura existente y reutilizar los componentes, funciones y convenciones del proyecto.



No introducir tecnologías adicionales sin una justificación técnica.



4\. Principios de desarrollo

Priorizar la simplicidad y la facilidad de uso.

Reutilizar la arquitectura y los componentes existentes.

Mantener la coherencia visual de toda la aplicación.

Escribir código legible, modular y mantenible.

Evitar funcionalidades innecesarias.

No incorporar servicios de pago ni dependencias costosas.

Validar las operaciones antes de modificar los datos.

No afirmar que una funcionalidad está probada si no se ejecutaron las pruebas correspondientes.

5\. Reglas de negocio

Inventario

Cada producto debe poder organizarse por lotes.

Cada lote debe tener una cantidad disponible.

Las cantidades nunca pueden ser negativas.

Los movimientos de entrada y salida deben conservar un historial.

Las correcciones de inventario deben registrar su motivo.

Vencimientos

Aplicar FEFO (First Expired, First Out).

Priorizar los lotes aptos que tengan la fecha de vencimiento más próxima.

Los alimentos vencidos no pueden distribuirse mediante el flujo normal.

Los productos dañados o de seguridad dudosa deben quedar bloqueados.

Nunca inventar fechas de vencimiento.

Los alimentos sin fecha conocida deben quedar pendientes de revisión.

Operaciones

Evitar operaciones duplicadas.

No permitir salidas superiores al inventario disponible.

Validar los datos antes de confirmar una operación.

Conservar la trazabilidad de los movimientos.

6\. Experiencia de usuario



La aplicación debe ser accesible para personas con poca experiencia tecnológica.



Aplicar:



Tipografía legible.

Botones grandes.

Contraste adecuado.

Formularios sencillos.

Etiquetas descriptivas.

Mensajes de error comprensibles.

Confirmaciones antes de operaciones importantes.

Diseño adaptable a teléfonos y computadoras.

7\. Privacidad y seguridad

Almacenar únicamente los datos necesarios.

No exponer información personal innecesariamente.

No incorporar credenciales ni secretos en el código.

Respetar los mecanismos de almacenamiento y respaldo existentes.

8\. Instrucciones para el agente



Antes de implementar cualquier funcionalidad:



Leer este archivo.

Leer la especificación correspondiente.

Leer las skills aplicables.

Inspeccionar el código existente.

Identificar los componentes que pueden reutilizarse.

Implementar únicamente lo solicitado.

Ejecutar las pruebas disponibles.

Informar qué criterios de aceptación se cumplieron y cuáles no.



Si la implementación no cumple algún criterio de aceptación, revisar primero la especificación y corregir cualquier ambigüedad o contradicción antes de cambiar las instrucciones de implementación.



9\. Restricciones



No desarrollar recibos fiscales para donantes.



No incorporar inteligencia artificial de pago.



No modificar funcionalidades ajenas al alcance del feature sin autorización.



No eliminar funcionalidades existentes.



No sustituir una funcionalidad real por una maqueta visual.



10\. Objetivo de calidad



Cada funcionalidad debe aportar valor real al banco de alimentos y respetar las necesidades de Jorge y los voluntarios.



La prioridad es construir un producto confiable, sencillo, accesible y sostenible.



11\. Metodología de trabajo: Spec Driven Development



El proyecto debe desarrollarse siguiendo el enfoque Spec Driven Development (SDD).



La especificación funcional es la referencia principal para definir el comportamiento esperado de cada funcionalidad.



Flujo obligatorio de trabajo

Contexto: leer este archivo antes de iniciar cualquier tarea.

Especificación: identificar y leer la spec correspondiente al feature solicitado.

Diseño: analizar la arquitectura existente y proponer cómo integrar la funcionalidad.

Implementación: desarrollar exclusivamente lo definido en la especificación aprobada.

Validación: ejecutar pruebas para comprobar los criterios de aceptación.

Corrección: si algún criterio no se cumple, analizar si existe una ambigüedad o contradicción en la especificación y corregirla antes de modificar el prompt de implementación.

Documentación: registrar los cambios realizados y los resultados de las pruebas.

Jerarquía de instrucciones

Este archivo contiene el contexto y las reglas generales del proyecto.

Los archivos de especificación definen el comportamiento esperado de cada funcionalidad.

Las skills contienen conocimientos y procedimientos especializados que orientan al agente.



Si existen contradicciones, el agente debe identificarlas y solicitar una resolución antes de implementar.



Criterios de finalización



Una funcionalidad no se considera terminada únicamente porque su interfaz esté construida.



Debe cumplir sus criterios de aceptación, mantener la integridad de los datos, respetar las reglas de negocio y superar las pruebas correspondientes.



El agente debe informar qué pruebas ejecutó y cuáles fueron sus resultados, sin inventar evidencias.

