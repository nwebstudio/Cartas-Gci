# Generador de Cartas de Requerimiento — APDAYC / GCI

## ¿Qué hace?
1. Escribes un RUC → jala automáticamente: Razón Social, Dirección Fiscal, Distrito, Representante Legal y Cargo (vía ApiPeru.dev).
2. Llenas manualmente: Local, Dirección del local, Distrito del local, Monto adeudado, Meses que debe, Tarifa mensual.
3. El sistema calcula solo el monto en letras.
4. Un clic genera la carta en Word (.docx) lista para imprimir/enviar, con el mismo diseño original (logos, formato, firma).

## Instalación (una sola vez)

1. Instala Node.js si no lo tienes: https://nodejs.org (versión LTS)
2. Abre una terminal en la carpeta `backend` y ejecuta:
   ```
   npm install
   ```
3. Regístrate gratis en https://apiperu.dev/ y saca tu token.
4. Abre el archivo `backend/.env` y reemplaza `TU_TOKEN_AQUI` por tu token real:
   ```
   APIPERU_TOKEN=tu_token_real_aqui
   ```

## Uso diario

1. En la terminal, dentro de la carpeta `backend`, ejecuta:
   ```
   node server.js
   ```
2. Abre tu navegador en: http://localhost:3000
3. Usa el formulario normalmente.

Nota: mientras no pongas tu token real, el sistema usa datos de PRUEBA automáticamente (verás un aviso amarillo) — así puedes probar todo el flujo sin necesidad del token.

## Estructura del proyecto
```
carta-requerimiento/
├── backend/
│   ├── server.js          → servidor principal
│   ├── rucService.js      → consulta a ApiPeru.dev
│   ├── numeroALetras.js   → conversor de monto a letras
│   ├── .env                → aquí va tu token
│   └── package.json
├── frontend/
│   └── index.html          → la interfaz que usas
└── templates/
    └── REQUERIMIENTO_plantilla.docx  → plantilla con marcadores
```

## Agregar más tipos de carta (a futuro)
Cuando tengas otros modelos de carta, se agregan como nuevas plantillas en `templates/` 
siguiendo el mismo patrón de marcadores `{campo}`, y se añade un endpoint similar en `server.js`.
