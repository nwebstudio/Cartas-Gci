const ExcelJS = require("exceljs");
const path = require("path");

// Mapa de celdas: dónde va cada dato en la plantilla INFORME_GESTION_plantilla.xlsx.
// Las columnas se eligieron dejando espacio suficiente después de cada etiqueta
// (las etiquetas se desbordan sobre varias columnas angostas sin estar combinadas).
const CELDAS = {
  razonSocial: "F15",
  idLicencia: "L15",
  nombreLocal: "F17",
  distrito: "L17",
  direccionLocal: "F19",
  provincia: "L19",
  referencia: "F21",
  departamento: "L21",
  fechaRequerimiento: "J10",
  requerimientoDe: "J11",
  fechaVisita: "F34",
  horaVisita: "K34",
  nombreInspector: "I52",
  dniInspector: "I53",
};

// Casillas de "Sobre informe" (tipo de visita)
const CELDA_CHECK_INOPINADA = "B8";
const CELDA_CHECK_REQUERIMIENTO = "B10";

// Casillas de "Información solicitada" — dos columnas
const CHECKS_OBTENER_IZQUIERDA = {
  datos_usuario: "D25",
  nombre_interpretes: "D26",
  precio_entrada: "D27",
  aforo: "D28",
  asistencia: "D29",
  horario_uso_musica: "D30",
};

const CHECKS_OBTENER_DERECHA = {
  actualizacion_datos: "I25",
  gestion_cobranza: "I26",
  notificacion: "I27",
  constatacion_policial: "I28",
  arqueos: "I29",
  funcionamiento_local: "I30",
  otros: "I31",
};

async function generarInformeGestion(datos) {
  const wb = new ExcelJS.Workbook();
  const templatePath = path.join(__dirname, "..", "templates", "INFORME_GESTION_plantilla.xlsx");
  await wb.xlsx.readFile(templatePath);
  const ws = wb.getWorksheet("InformeGestión");

  const set = (celda, valor) => {
    if (valor) ws.getCell(celda).value = valor;
  };

  // Datos generales
  set(CELDAS.razonSocial, datos.razon_social);
  set(CELDAS.idLicencia, datos.id_licencia);
  set(CELDAS.nombreLocal, datos.local);
  set(CELDAS.distrito, datos.distrito_local);
  set(CELDAS.direccionLocal, datos.direccion_local);
  set(CELDAS.provincia, datos.provincia);
  set(CELDAS.referencia, datos.referencia);
  set(CELDAS.departamento, datos.departamento);

  // Tipo de visita
  if (datos.tipo_visita === "requerimiento") {
    ws.getCell(CELDA_CHECK_REQUERIMIENTO).value = "X";
    set(CELDAS.fechaRequerimiento, datos.fecha_requerimiento);
    set(CELDAS.requerimientoDe, datos.requerimiento_de);
  } else {
    ws.getCell(CELDA_CHECK_INOPINADA).value = "X";
  }

  // Información solicitada (checkboxes)
  const obtener = datos.obtener || [];
  for (const [clave, celda] of Object.entries(CHECKS_OBTENER_IZQUIERDA)) {
    if (obtener.includes(clave)) ws.getCell(celda).value = "X";
  }
  for (const [clave, celda] of Object.entries(CHECKS_OBTENER_DERECHA)) {
    if (obtener.includes(clave)) ws.getCell(celda).value = "X";
  }

  // Detalle de la visita
  set(CELDAS.fechaVisita, datos.fecha_visita);
  set(CELDAS.horaVisita, datos.hora_visita);

  // Observaciones (combina celdas para que el texto largo se vea bien, con wrap)
  if (datos.observaciones) {
    ws.mergeCells("B41:L43");
    const celdaObs = ws.getCell("B41");
    celdaObs.value = datos.observaciones;
    celdaObs.alignment = { wrapText: true, vertical: "top" };
  }

  // Acciones de mejora
  if (datos.acciones_mejora) {
    ws.mergeCells("B45:L48");
    const celdaAcc = ws.getCell("B45");
    celdaAcc.value = datos.acciones_mejora;
    celdaAcc.alignment = { wrapText: true, vertical: "top" };
  }

  // Inspector
  set(CELDAS.nombreInspector, datos.nombre_inspector);
  set(CELDAS.dniInspector, datos.dni_inspector);

  return wb.xlsx.writeBuffer();
}

module.exports = { generarInformeGestion };
