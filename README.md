# VELOCE · Automobili 3D

Página de autos con garaje 3D (11 modelos), reservas y herramientas para el cliente.
Abre `index.html` con doble clic (solo necesita internet para las fuentes).

## Estructura

```
index.html                  Página principal (garaje 3D, historia, reserva)
paginas/                    Una página por característica
  comparador.html             Comparador de modelos
  mantenimiento.html          Guía de mantenimiento
  financiamiento.html         Calculadora de financiamiento
  prueba-de-manejo.html       Agendar prueba de manejo
  garantia.html               Garantía y garantía extendida
  seguro.html                 Seguro de auto (cotización)
  accesorios.html             Accesorios (selección con total)
  entrega-a-domicilio.html    Entrega a domicilio (costo por zona)
  ficha.html?auto=<modelo>    Ficha completa de cada auto (ej. ficha.html?auto=chiron)
utilidades/
  convertir-modelo.html       Convierte un .glb en modelo-<auto>.js
assets/
  css/                        Estilos (styles, reserva, herramientas, automobili3d)
  js/                         Scripts (autos, script, reserva, herramientas, i18n, automobili3d)
  3d/                         Ferrari ligero y autos de vista previa
    modelos/                  Modelo 3D real de cada auto (modelo-<auto>.js)
  img/                        Logo e ilustraciones de la historia
  vendor/bootstrap/           Bootstrap local
```

## Los 11 autos

- Los datos (nombre, año, especificaciones, precio base, colores) están en `assets/js/autos.js`.
  Ahí se cambian sin tocar `assets/js/automobili3d.js`.
- El precio cambia según el color. El Ferrari tiene precios fijos por color;
  los demás usan su `precioBase` + el recargo de cada color.

## Cómo se cargan los modelos 3D

- Al abrir la página solo se cargan el Ferrari (`assets/3d/modelo-ferrari.js`) y los autos
  de vista previa (`assets/3d/modelos-vista-previa.js`), unos 5 MB. El garaje aparece de inmediato.
- Los modelos reales (`assets/3d/modelos/modelo-<auto>.js`) se cargan solos después, uno por uno,
  empezando por el auto que estás viendo y sus vecinos. Mientras no carga, se ve su vista previa
  y la ficha dice "Cargando modelo 3D…".
- No hace falta agregar etiquetas `<script>`: basta con que el archivo exista en
  `assets/3d/modelos/` con el nombre correcto (ver `assets/3d/modelos/LEEME.txt`).

## Agregar o cambiar un modelo

1. Abre `utilidades/convertir-modelo.html`. Tiene un enlace de búsqueda en Sketchfab para cada auto.
2. Descarga un modelo gratuito (licencia CC Attribution o CC0) en formato GLB.
3. Arrástralo al convertidor, descarga `modelo-<auto>.js` y guárdalo en `assets/3d/modelos/`.
4. Recarga la página. El tamaño, la posición y el color se ajustan solos.
   Si el auto sale de reversa, pon `girar: true` en ese auto dentro de `assets/js/autos.js`.

Da crédito al autor de cada modelo en el footer (ya están los 11).

## Menú y páginas

- El menú (botón de dos rayitas, arriba a la izquierda) lleva a cada página de `paginas/`.
  Todas usan `assets/js/herramientas.js` y `assets/css/herramientas.css`.
- Cada página tiene una barra para ir a las demás y un selector de modelos.
- "Ver en 3D" y "Reservar" regresan a `index.html` con el auto o la reserva ya abiertos.
- Los favoritos se guardan en el navegador y se comparten entre todas las páginas.
