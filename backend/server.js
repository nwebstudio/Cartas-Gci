require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const { consultarRuc } = require("./rucService");
const { montoALetras } = require("./numeroALetras");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Protección con usuario y contraseña ---
// Así nadie más puede usar tu app (ni gastar tu cuota de ApiPeru.dev) si alguien
// llega a encontrar la URL pública.
function requiereLogin(req, res, next) {
  const usuario = process.env.APP_USER;
  const clave = process.env.APP_PASSWORD;

  // Si no configuraste usuario/clave, la app queda abierta (útil solo para pruebas locales)
  if (!usuario || !clave) return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Carta Requerimiento"');
    return res.status(401).send("Acceso restringido");
  }

  const [u, p] = Buffer.from(auth.split(" ")[1], "base64").toString().split(":");
  if (u === usuario && p === clave) return next();

  res.set("WWW-Authenticate", 'Basic realm="Carta Requerimiento"');
  return res.status(401).send("Usuario o clave incorrectos");
}

app.use(requiereLogin);
app.use(express.static(path.join(__dirname, "..", "frontend")));

// --- Endpoint: consultar RUC ---
app.get("/api/ruc/:numero", async (req, res) => {
  const { numero } = req.params;

  if (!/^\d{11}$/.test(numero)) {
    return res.status(400).json({ error: "El RUC debe tener 11 dígitos" });
  }

  try {
    const datos = await consultarRuc(numero);
    res.json(datos);
  } catch (err) {
    res.status(500).json({ error: "No se pudo consultar el RUC. Verifica el número o tu token." });
  }
});

// --- Endpoint: generar carta ---
app.post("/api/generar-carta", (req, res) => {
  try {
    const datos = req.body;

    // Fecha: usa la que envía el frontend (input tipo date: YYYY-MM-DD), o la de hoy si no llega
    // Formato: "07 de Agosto del 2026" (mes con mayúscula inicial, "de"/"del" en minúscula)
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    let fechaBase;
    if (datos.fecha && /^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) {
      const [anio, mes, dia] = datos.fecha.split("-").map(Number);
      fechaBase = { dia, mes: mes - 1, anio };
    } else {
      const hoy = new Date();
      fechaBase = { dia: hoy.getDate(), mes: hoy.getMonth(), anio: hoy.getFullYear() };
    }
    const fecha = `${String(fechaBase.dia).padStart(2, "0")} de ${meses[fechaBase.mes]} del ${fechaBase.anio}`;

    // Auto-calcular monto en letras (ya sale en mayúsculas)
    const montoEscrito = montoALetras(datos.montot);

    // Formato moneda con separador de miles: S/1,200.00
    const formatearMonto = (valor) =>
      "S/" + Number(valor).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Convierte a mayúsculas cualquier texto que venga (respeta vacíos)
    const may = (texto) => (texto || "").toString().toUpperCase();

    const datosPlantilla = {
      fecha,
      razon_social: may(datos.razon_social),
      direccion_df: may(datos.direccion_df),
      distrito_df: may(datos.distrito_df),
      representante: may(datos.representante),
      cargo: may(datos.cargo),
      local: may(datos.local),
      direccion_local: may(datos.direccion_local),
      distrito_local: may(datos.distrito_local),
      montot: formatearMonto(datos.montot),
      montot_escrito: montoEscrito,
      meses_debe: may(datos.meses_debe),
      monto_mensual: formatearMonto(datos.monto_mensual),
    };

    const templatePath = path.join(__dirname, "..", "templates", "REQUERIMIENTO_plantilla.docx");
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render(datosPlantilla);

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    const nombreArchivo = `Requerimiento_${(datos.razon_social || "carta").replace(/[^a-zA-Z0-9]/g, "_")}.docx`;

    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo generar la carta: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}\n`);
});
