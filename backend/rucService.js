// Servicio de consulta RUC usando ApiPeru.dev
// Docs: https://docs.apiperu.dev/

const API_BASE = "https://apiperu.dev/api";

// Datos de prueba (se usan automáticamente si no hay API_TOKEN en .env)
const MOCK_DATA = {
  ruc: {
    success: true,
    data: {
      nombre_o_razon_social: "EMPRESA DE PRUEBA S.A.C.",
      direccion: "AV. EJEMPLO NRO. 123 URB. LAS FLORES",
      distrito: "SAN ISIDRO",
      provincia: "LIMA",
      departamento: "LIMA",
      estado: "ACTIVO",
      condicion: "HABIDO",
    },
  },
  representantes: {
    success: true,
    data: [
      {
        tipo_de_documento: "DNI",
        numero_de_documento: "12345678",
        nombre: "JUAN PEREZ GOMEZ (DATO DE PRUEBA)",
        cargo: "GERENTE GENERAL",
        fecha_desde: "01/01/2020",
      },
    ],
  },
};

async function consultarRuc(numeroRuc) {
  const token = process.env.APIPERU_TOKEN;
  const esPersonaNatural = numeroRuc.startsWith("10");

  // Modo de prueba: si no hay token configurado, devuelve datos mock
  if (!token || token === "TU_TOKEN_AQUI") {
    console.log("⚠️  Usando datos de PRUEBA (aún no configuraste APIPERU_TOKEN en .env)");
    const mockRuc = esPersonaNatural
      ? { ...MOCK_DATA.ruc.data, nombre_o_razon_social: "PEREZ GOMEZ JUAN CARLOS (PRUEBA)" }
      : MOCK_DATA.ruc.data;
    return construirRespuesta(mockRuc, MOCK_DATA.representantes.data, true, esPersonaNatural);
  }

  try {
    // 1. Consulta datos generales del RUC
    const resRuc = await fetch(`${API_BASE}/ruc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ruc: numeroRuc }),
    });
    const dataRuc = await resRuc.json();

    if (!dataRuc.success) {
      throw new Error(dataRuc.message || "No se pudo consultar el RUC");
    }

    // RUC que empieza en "10" = Persona Natural. No tiene representante legal
    // (la persona ES el titular), así que no hace falta consultar ese endpoint.
    const esPersonaNatural = numeroRuc.startsWith("10");

    let representantes = [];
    if (!esPersonaNatural) {
      // 2. Consulta representante(s) legal(es), solo aplica a personas jurídicas
      const resRep = await fetch(`${API_BASE}/ruc-representantes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ruc: numeroRuc }),
      });
      const dataRep = await resRep.json();
      representantes = dataRep.success ? dataRep.data : [];
    }

    return construirRespuesta(dataRuc.data, representantes, false, esPersonaNatural);
  } catch (err) {
    console.error("Error consultando RUC:", err.message);
    throw err;
  }
}

function construirRespuesta(datosRuc, representantes, esMock, esPersonaNatural = false) {
  const razonSocial = datosRuc.nombre_o_razon_social || datosRuc.razon_social || "";
  const direccionFiscal = datosRuc.direccion || "";
  const distritoFiscal = datosRuc.distrito || "";

  let representante, cargo;

  if (esPersonaNatural) {
    // Persona natural: ella misma es el "representante", con cargo fijo
    representante = razonSocial;
    cargo = "REPRESENTANTE";
  } else {
    // Persona jurídica: toma el primer representante legal (normalmente el titular/gerente general)
    const rep = representantes && representantes.length > 0 ? representantes[0] : null;
    representante = rep ? rep.nombre : "";
    cargo = rep ? rep.cargo : "";
  }

  return {
    razon_social: razonSocial,
    direccion_df: direccionFiscal,
    distrito_df: distritoFiscal,
    representante,
    cargo,
    estado: datosRuc.estado || "",
    condicion: datosRuc.condicion || "",
    es_persona_natural: esPersonaNatural,
    _mock: esMock, // le avisa al frontend si son datos de prueba
  };
}

async function consultarDni(numeroDni) {
  const token = process.env.APIPERU_TOKEN;

  // Modo de prueba
  if (!token || token === "TU_TOKEN_AQUI") {
    console.log("⚠️  Usando datos de PRUEBA (aún no configuraste APIPERU_TOKEN en .env)");
    return construirRespuestaDni({
      nombre_completo: "PEREZ GOMEZ JUAN CARLOS (DATO DE PRUEBA)",
    }, true);
  }

  try {
    const resDni = await fetch(`${API_BASE}/dni`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dni: numeroDni }),
    });
    const dataDni = await resDni.json();

    if (!dataDni.success) {
      throw new Error(dataDni.message || "No se pudo consultar el DNI");
    }

    return construirRespuestaDni(dataDni.data, false);
  } catch (err) {
    console.error("Error consultando DNI:", err.message);
    throw err;
  }
}

// El DNI no trae dirección/distrito (esos siempre van manuales en "Datos del local"),
// así que aquí solo se arma el nombre. razon_social = representante = el mismo nombre,
// igual que en RUC 10, y también se marca como persona natural.
function construirRespuestaDni(datosDni, esMock) {
  const nombreCompleto = datosDni.nombre_completo || "";

  return {
    razon_social: nombreCompleto,
    direccion_df: "",
    distrito_df: "",
    representante: nombreCompleto,
    cargo: "REPRESENTANTE",
    estado: "",
    condicion: "",
    es_persona_natural: true,
    _mock: esMock,
  };
}

module.exports = { consultarRuc, consultarDni };
