// =========================================================
// AUTOS DEL GARAJE 3D
// Aquí puedes cambiar nombres, precios, colores y especificaciones
// sin tocar assets/js/automobili3d.js. Guarda y recarga la página.
//
// Campos de cada auto:
//   modelo      -> nombre del archivo 3D: assets/3d/modelos/modelo-<modelo>.js
//                  (lo genera utilidades/convertir-modelo.html a partir de un .glb)
//   largo       -> largo real en metros (para que todos se vean a escala)
//   girar       -> true si el auto aparece de reversa (lo gira 180°)
//   materialCarroceria -> nombre del material de la pintura (o una lista de nombres). Si lo dejas
//                  vacío, la página intenta detectarlo sola.
//   precioBase  -> precio en pesos mexicanos (MXN) del color más económico
//   Precios convertidos de USD a MXN con un tipo de cambio de $18.40 (octubre 2026).
//   pinturaConTextura -> true si la pintura del modelo usa una textura con detalles
//                  (la página la tiñe en lugar de reemplazarla)
//   ocultar     -> lista de textos: esconde las piezas cuyo nombre los contenga
//                  (útil para destellos o sombras que trae el modelo)
//   datos       -> números para el comparador: hp, acel (segundos), acelRef ('0–100' o '0–96'),
//                  velMax (km/h), traccion. Usa null si no hay dato.
//   fondo       -> fondo de la vista de edición: c1 (color de luz), c2 (color de sombra),
//                  lugar (texto grande), ciudad (texto pequeño), patron opcional: 'cuadros'
//   colorInicial-> color con el que aparece en el garaje
//   vistaPrevia -> auto original que se muestra mientras falta el modelo real:
//                  'superdeportivo', 'gt' o 'sedan'
// =========================================================
window.AUTOMOBILI = {
    // recargo = porcentaje extra sobre el precio base (0.05 = 5 %)
    colores: [
        { nombre: 'Rosso',   hex: '#d40000', recargo: 0.035 },
        { nombre: 'Arancio', hex: '#ff6a00', recargo: 0.045 },
        { nombre: 'Bianco',  hex: '#eeeeee', recargo: 0.05  },
        { nombre: 'Giallo',  hex: '#f2c200', recargo: 0.04  },
        { nombre: 'Blu',     hex: '#1f4fd8', recargo: 0.06  },
        { nombre: 'Nero',    hex: '#161616', recargo: 0.02  },
        { nombre: 'Argento', hex: '#a9adb3', recargo: 0.015 },
        { nombre: 'Verde',   hex: '#0e6b3a', recargo: 0.075 },
        { nombre: 'Viola',   hex: '#6b2fb3', recargo: 0.09  },
        { nombre: 'Grigio',  hex: '#5b5f66', recargo: 0     },
        { nombre: 'Oro',     hex: '#c2a04a', recargo: 0.12  },
    ],

    autos: [
        {
            modelo: 'ferrari458', vistaPrevia: 'ferrari', nombre: 'Ferrari 458 Italia', anio: 2011, tipo: 'Deportivo', largo: 4.53, girar: true,
            materialCarroceria: ['carpaint'], colorInicial: 'Rosso',
            // Modelo 3D: "2011 Ferrari 458 Italia" por Ddiaz Design (Sketchfab), licencia CC BY 4.0 (optimizado)
            // Mientras carga se ve el Ferrari ligero de assets/3d/modelo-ferrari.js
            // el Ferrari conserva sus precios por color
            preciosPorColor: { Rosso: 4525000, Arancio: 4644000, Bianco: 4784000, Giallo: 4595000, Blu: 4992000, Nero: 4390000, Argento: 4304000, Verde: 5271000, Viola: 5756000, Grigio: 4223000, Oro: 6407000 },
            datos: { hp: 570, acel: 3.4, acelRef: '0–100', velMax: 325, traccion: 'Trasera' },
            fondo: { c1: '#d40000', c2: '#3a0505', lugar: 'MARANELLO', ciudad: 'Maranello · Italia' },
            specs: [['Potencia', '570 hp'], ['0–100 km/h', '3.4 s'], ['Vel. máxima', '325 km/h'], ['Motor', 'V8 4.5 L']],
        },
        {
            modelo: 'granturismo', vistaPrevia: 'gt', nombre: 'Maserati GranTurismo MC Stradale', anio: 2014, tipo: 'Gran turismo', largo: 4.93, girar: true,
            materialCarroceria: ['Gphong1SG1'],
            precioBase: 2760000, colorInicial: 'Blu',
            // Modelo 3D: "2014 Maserati Gran Turismo MC Stradale" por 007 (Sketchfab), licencia CC BY 4.0
            datos: { hp: 453, acel: 4.5, acelRef: '0–100', velMax: 303, traccion: 'Trasera' },
            fondo: { c1: '#2f5fe0', c2: '#0b1a3a', lugar: 'MODENA', ciudad: 'Módena · Italia' },
            specs: [['Potencia', '460 CV (338 kW)'], ['0–100 km/h', '4.5 s'], ['Vel. máxima', '303 km/h'], ['Motor', 'V8 4.7 L']],
        },
        {
            modelo: 'supra', vistaPrevia: 'gt', nombre: 'Toyota GR Supra 3.0', anio: 2026, tipo: 'Deportivo', largo: 4.38, girar: true,
            materialCarroceria: ['Supra_body_paint'],
            // Modelo 3D: "Toyota Supra MK5 A90" por pryanex (Sketchfab), licencia CC BY 4.0 (optimizado)
            precioBase: 1095000, colorInicial: 'Arancio',
            datos: { hp: 382, acel: 4.2, acelRef: '0–96', velMax: 250, traccion: 'Trasera' },
            fondo: { c1: '#ff3d6e', c2: '#3b1d8f', lugar: 'TOYOTA CITY', ciudad: 'Toyota, Aichi · Japón' },
            specs: [['Potencia', '382 hp'], ['0–96 km/h', '4.2 s'], ['Vel. máxima', '250 km/h'], ['Motor', '6 cil. 3.0 L turbo']],
        },
        {
            modelo: 'porsche918', vistaPrevia: 'superdeportivo', nombre: 'Porsche 918 Spyder', anio: 2015, tipo: 'Deportivo híbrido', largo: 4.64, girar: true,
            materialCarroceria: ['P1car_Mistery_Porsche_carpaint1', 'Internal_CarPaint'],
            precioBase: 15548000, colorInicial: 'Argento',
            // Modelo 3D: "2026 Porsche 918 Spyder Asphalt Edition" por Ddiaz Design (Sketchfab), licencia CC BY-NC-SA 4.0
            datos: { hp: 887, acel: 2.6, acelRef: '0–100', velMax: 345, traccion: 'Integral' },
            fondo: { c1: '#c9ced6', c2: '#2b3036', lugar: 'STUTTGART', ciudad: 'Stuttgart · Alemania' },
            specs: [['Potencia', '887 hp'], ['0–100 km/h', '2.6 s'], ['Vel. máxima', '345 km/h'], ['Motor', 'V8 4.6 L + 2 eléctricos']],
        },
        {
            modelo: 'huracan', vistaPrevia: 'superdeportivo', nombre: 'Lamborghini Huracán EVO Spyder', anio: 2020, tipo: 'Deportivo convertible', largo: 4.52,
            materialCarroceria: ['Material.001', 'Material.007'], pinturaConTextura: true,
            girar: true, ocultar: ['glows'],
            precioBase: 5288000, colorInicial: 'Verde',
            // Modelo 3D: "lamborghini huracan lp 640-4 evo spyder" por amogusstrikesback2 (Sketchfab), licencia CC BY 4.0
            datos: { hp: 631, acel: 3.1, acelRef: '0–100', velMax: 325, traccion: 'Integral' },
            fondo: { c1: '#19c25a', c2: '#0a2e1a', lugar: "SANT'AGATA", ciudad: "Sant'Agata Bolognese · Italia" },
            specs: [['Potencia', '631 hp (640 CV)'], ['0–100 km/h', '3.1 s'], ['Vel. máxima', '325 km/h'], ['Motor', 'V10 5.2 L']],
        },
        {
            modelo: 'mclaren', vistaPrevia: 'superdeportivo', nombre: 'McLaren 765LT Spider', anio: 2022, tipo: 'Deportivo convertible', largo: 4.60, girar: true,
            materialCarroceria: ['Primary_Paint'],
            precioBase: 7038000, colorInicial: 'Arancio',
            // Modelo 3D: "McLaren Spider" por SINNIK (Sketchfab), licencia CC BY 4.0 (optimizado)
            datos: { hp: 755, acel: 2.8, acelRef: '0–100', velMax: 330, traccion: 'Trasera' },
            fondo: { c1: '#ff8000', c2: '#3a1a00', lugar: 'WOKING', ciudad: 'Woking · Reino Unido' },
            specs: [['Potencia', '755 hp'], ['0–100 km/h', '2.8 s'], ['Vel. máxima', '330 km/h'], ['Motor', 'V8 4.0 L biturbo']],
        },
        {
            modelo: 'chiron', vistaPrevia: 'superdeportivo', nombre: 'Bugatti Chiron', anio: 2016, tipo: 'Hiperdeportivo', largo: 4.54, girar: true,
            materialCarroceria: ['Material.001'], pinturaConTextura: true, ocultar: ['glow'],
            precioBase: 55200000, colorInicial: 'Blu',
            // Modelo 3D: "bugatti chiron" por amogusstrikesback2 (Sketchfab), licencia CC BY 4.0
            datos: { hp: 1479, acel: 2.4, acelRef: '0–100', velMax: 420, traccion: 'Integral' },
            fondo: { c1: '#2d5bff', c2: '#0d0f2e', lugar: 'MOLSHEIM', ciudad: 'Molsheim · Francia' },
            specs: [['Potencia', '1,479 hp (1,500 CV)'], ['0–100 km/h', '2.4 s'], ['Vel. máxima', '420 km/h'], ['Motor', 'W16 8.0 L, 4 turbos']],
        },
        {
            modelo: 'jetta-gli', vistaPrevia: 'sedan', nombre: 'Volkswagen Jetta GLI', anio: 2025, tipo: 'Sedán deportivo', largo: 4.70,
            materialCarroceria: ['Gris_Franela_mciyg2wz'],
            precioBase: 691190, colorInicial: 'Grigio',
            // Modelo 3D: "Volkswagen Jetta GLI (2025)" por geyges (Sketchfab), licencia Sketchfab Standard
            // (aligerado: sin bolsas de aire internas ni datos de textura sin uso)
            // Precio: precio de lista en México (autocosmos, octubre 2026)
            datos: { hp: 228, acel: null, acelRef: '', velMax: null, traccion: 'Delantera' },
            fondo: { c1: '#e10600', c2: '#16181c', lugar: 'PUEBLA', ciudad: 'Puebla · México' },
            specs: [['Potencia', '228 hp'], ['Motor', '4 cil. 2.0 L turbo (TSI)'], ['Transmisión', 'DSG 7 vel.'], ['Carrocería', 'Sedán']],
        },
        {
            modelo: 'bmw-serie3', vistaPrevia: 'sedan', nombre: 'BMW 330i xDrive', anio: 2025, tipo: 'Sedán', largo: 4.71, girar: true,
            materialCarroceria: ['bmwcar_body1', 'bmwcar_bodykit1', 'bmwcar_hood1'],
            precioBase: 945000, colorInicial: 'Argento',
            // Modelo 3D: "2025 BMW 330i xDrive" por Ddiaz Design (Sketchfab), licencia CC BY-NC-SA 4.0
            datos: { hp: 255, acel: 5.3, acelRef: '0–96', velMax: 209, traccion: 'Integral' },
            fondo: { c1: '#1c69d4', c2: '#4b1f6e', lugar: 'MÜNCHEN', ciudad: 'Múnich · Alemania' },
            specs: [['Potencia', '255 hp'], ['0–96 km/h', '5.3 s'], ['Tracción', 'Integral xDrive'], ['Motor', '4 cil. 2.0 L turbo']],
        },
        {
            modelo: 'mazda3', vistaPrevia: 'sedan', nombre: 'Mazda 3 Sedán 2.5', anio: 2020, tipo: 'Sedán', largo: 4.66, girar: true,
            materialCarroceria: ['M_2020_Mazda_3_Sedan_Machine_Gray_Metallic'],
            precioBase: 476000, colorInicial: 'Rosso',
            // Modelo 3D: "2020 Mazda 3 Sedan" por tonielpro520 (Sketchfab), licencia CC BY 4.0
            // (optimizado: vértices repetidos unidos y normales comprimidas; de 52 MB a 12 MB)
            datos: { hp: 186, acel: 7.5, acelRef: '0–96', velMax: 224, traccion: 'Delantera' },
            fondo: { c1: '#b3141c', c2: '#2a0a0a', lugar: 'HIROSHIMA', ciudad: 'Hiroshima · Japón' },
            specs: [['Potencia', '186 hp'], ['Motor', '4 cil. 2.5 L'], ['Transmisión', 'Automática 6 vel.'], ['Carrocería', 'Sedán']],
        },
        {
            modelo: 'audi-r8', vistaPrevia: 'superdeportivo', nombre: 'Audi R8 LMS', anio: 2009, tipo: 'Auto de carreras GT3', largo: 4.47, girar: true,
            materialCarroceria: ['body', 'body_2'], pinturaConTextura: true,
            precioBase: 5581000, colorInicial: 'Bianco',
            // Modelo 3D: "2009 Audi R8 LMS" por OUTPISTON (Sketchfab), licencia CC BY-NC-SA 4.0
            // Precio: 262,000 euros + IVA (lanzamiento), convertido a pesos de forma aproximada
            datos: { hp: 500, acel: 2.8, acelRef: '0–100', velMax: 320, traccion: 'Trasera' },
            fondo: { c1: '#e8e8ea', c2: '#bb0a30', lugar: 'INGOLSTADT', ciudad: 'Ingolstadt · Alemania', patron: 'cuadros' },
            specs: [['Potencia', '500 hp'], ['0–100 km/h', '2.8 s'], ['Vel. máxima', '320 km/h'], ['Motor', 'V10 5.2 L']],
        },
    ],
};
