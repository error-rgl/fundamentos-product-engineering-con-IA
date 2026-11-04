Especificación: Control de inventario y vencimientos FEFO

1\. Información general



Proyecto: Banco de Alimentos Comunitario



Feature: Control de inventario y vencimientos.



Prioridad: Alta.



Usuario principal: Jorge, coordinador del banco de alimentos.



Usuarios secundarios: Voluntarios.



2\. Definición del problema



Jorge recibe donaciones de alimentos en cantidades y fechas impredecibles. Actualmente tiene dificultades para conocer las existencias disponibles, identificar qué alimentos vencen primero y evitar que los productos caduquen sin ser distribuidos.



Esta situación genera desperdicio de alimentos y dificulta la organización de las entregas.



Además, los voluntarios necesitan una herramienta sencilla para consultar el inventario y registrar movimientos sin cometer errores.



3\. Objetivo del feature



Implementar un módulo de inventario que permita registrar productos por lote, consultar cantidades disponibles, controlar fechas de vencimiento y priorizar los alimentos mediante el principio FEFO.



El sistema debe ayudar a reducir el desperdicio y evitar la distribución normal de productos vencidos o no aptos.



4\. Diseño de la solución



El módulo debe integrarse con la aplicación existente y aprovechar su arquitectura y componentes actuales.



4.1. Registro de productos y lotes



Permitir registrar:



Nombre del producto.

Categoría.

Identificador del lote.

Cantidad recibida.

Unidad de medida.

Fecha de recepción.

Fecha de vencimiento, cuando corresponda.

Estado del producto.



Cada lote debe mantener su propia cantidad y fecha de vencimiento.



4.2. Consulta de inventario



Mostrar una lista de productos con:



Nombre.

Cantidad disponible.

Unidad de medida.

Número de lote.

Fecha de vencimiento.

Estado.



Permitir buscar productos y consultar sus lotes.



4.3. Control de vencimientos



Clasificar los productos según su estado:



Disponible.

Próximo a vencer.

Vencido.

Pendiente de revisión.

No apto para distribución.



El periodo de proximidad al vencimiento debe poder configurarse.



4.4. Aplicación de FEFO



El sistema debe ordenar los lotes aptos para distribución desde la fecha de vencimiento más próxima hasta la más lejana.



Cuando dos lotes tengan la misma fecha de vencimiento, el sistema utilizará la fecha de recepción como criterio secundario de ordenamiento. Los lotes sin fecha de vencimiento conocida se mostrarán separados y no tendrán prioridad FEFO hasta completar su revisión.



Los lotes vencidos, dañados o de seguridad dudosa deben quedar excluidos de la distribución normal.



4.5. Movimientos de inventario



Registrar entradas, salidas y ajustes.



Cada movimiento debe conservar:



Producto.

Lote.

Cantidad.

Tipo de movimiento.

Fecha.

Motivo, cuando corresponda.



No permitir cantidades negativas ni salidas superiores a las existencias disponibles.



5\. Criterios de aceptación

CA-01. Registro de un nuevo lote



Dado que un voluntario recibe una donación de 12 unidades de arroz.



Cuando registra el producto, el lote, la cantidad y su fecha de vencimiento y confirma la operación.



Entonces el sistema debe registrar el lote y aumentar el inventario en 12 unidades.



Además, debe conservar la fecha de recepción y el movimiento realizado.



CA-02. Priorización FEFO



Dado que existen dos lotes de arroz aptos para distribución:



Lote	Cantidad	Vencimiento

A	10	2026-11-10

B	15	2026-11-20



Cuando Jorge consulta los lotes disponibles.



Entonces el sistema debe mostrar primero el lote A y después el lote B.



Ambos deben permanecer disponibles para distribución.



CA-03. Bloqueo de productos vencidos



Dado que existe un lote cuya fecha de vencimiento ya pasó.



Cuando un voluntario intenta incluirlo en una entrega normal.



Entonces el sistema debe impedir su distribución, mostrar una advertencia comprensible y conservar su cantidad en el inventario físico, sin contabilizarla como disponible para distribución.



CA-04. Validación de existencias



Dado que existen 5 unidades disponibles de leche en un lote.



Cuando un voluntario intenta registrar una salida de 8 unidades.



Entonces el sistema debe rechazar la operación, informar que solamente existen 5 unidades disponibles y mantener el inventario sin cambios.



CA-05. Identificación de alimentos próximos a vencer



Dado que existe un lote apto para distribución cuya fecha de vencimiento está dentro del periodo de alerta configurado.



Cuando Jorge consulta el inventario.



Entonces el sistema debe identificarlo como próximo a vencer, mostrar su fecha y cantidad disponible y facilitar su priorización.



6\. Reglas de negocio

Los lotes deben identificarse independientemente.

Las existencias disponibles nunca pueden ser negativas.

El sistema debe aplicar FEFO para priorizar los lotes aptos.

Los productos vencidos no pueden distribuirse normalmente.

Los productos de seguridad dudosa deben quedar bloqueados.

Las fechas desconocidas no deben inventarse.

Cada movimiento confirmado debe quedar registrado.

Las operaciones no deben duplicarse por reintentos o pulsaciones repetidas.

Las salidas deben validar las cantidades disponibles.

Las modificaciones deben conservar la trazabilidad.

7\. Fuera del alcance



Esta especificación no incluye:



Gestión de recibos fiscales.

Predicciones mediante inteligencia artificial.

Integración con servicios de pago.

Automatización de entregas a familias.

Optimización avanzada de rutas.

Gestión de donantes externos.



Estas funcionalidades podrán evaluarse en futuras versiones.



8\. Consideraciones de experiencia de usuario



El módulo debe mantener el diseño de la aplicación existente.



Debe utilizar lenguaje sencillo, formularios breves, botones visibles, indicadores de estado comprensibles y mensajes claros.



Las alertas de vencimiento deben ser fáciles de identificar sin depender exclusivamente de colores.



9\. Validación y pruebas



La implementación debe comprobar los cinco criterios de aceptación mediante pruebas funcionales.



Las pruebas deben verificar tanto los resultados visibles como la integridad de las cantidades y movimientos de inventario.



La fecha actual debe poder controlarse en las pruebas para comprobar correctamente los escenarios de vencimiento.



10\. Resultado esperado



Un módulo funcional de inventario que permita a Jorge y a sus voluntarios registrar lotes, conocer las existencias, identificar alimentos próximos a vencer y priorizar su distribución mediante FEFO.



El feature debe integrarse con la aplicación existente y cumplir los cinco criterios de aceptación antes de considerarse terminado.

