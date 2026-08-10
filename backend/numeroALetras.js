// Conversor de número a letras (soles) - JavaScript
// Ej: 1250.50 -> "MIL DOSCIENTOS CINCUENTA CON 50/100 SOLES"

const UNIDADES = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const DECENAS = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
const DECENAS_10 = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function convertirGrupo(num) {
  let texto = "";

  if (num === 100) return "CIEN";

  const c = Math.floor(num / 100);
  const resto = num % 100;

  if (c > 0) texto += CENTENAS[c] + " ";

  if (resto >= 10 && resto < 20) {
    texto += DECENAS[resto - 10];
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;

    if (d === 2 && u > 0) {
      texto += "VEINTI" + UNIDADES[u].toLowerCase().replace(/^\w/, c => c.toUpperCase());
      texto = texto.toUpperCase();
    } else {
      if (d > 0) texto += DECENAS_10[d];
      if (d > 0 && u > 0) texto += " Y ";
      if (u > 0) texto += UNIDADES[u];
    }
  }

  return texto.trim();
}

function convertirEntero(num) {
  if (num === 0) return "CERO";

  let texto = "";
  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const resto = num % 1000;

  if (millones > 0) {
    texto += (millones === 1 ? "UN MILLON " : convertirGrupo(millones) + " MILLONES ");
  }

  if (miles > 0) {
    texto += (miles === 1 ? "MIL " : convertirGrupo(miles) + " MIL ");
  }

  if (resto > 0) {
    texto += convertirGrupo(resto);
  }

  return texto.trim();
}

/**
 * Convierte un monto numérico a su forma escrita en soles.
 * @param {number} monto - Ej: 1250.5
 * @returns {string} Ej: "MIL DOSCIENTOS CINCUENTA CON 50/100 SOLES"
 */
function montoALetras(monto) {
  const num = Number(monto);
  if (isNaN(num)) return "";

  const parteEntera = Math.floor(num);
  const centavos = Math.round((num - parteEntera) * 100);
  const centavosStr = centavos.toString().padStart(2, "0");

  const letras = convertirEntero(parteEntera);
  return `${letras} CON ${centavosStr}/100 SOLES`;
}

module.exports = { montoALetras };
