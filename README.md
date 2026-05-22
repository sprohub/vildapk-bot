# 🤖 Bot WhatsApp — VildAPK

Bot para publicar, editar y borrar APKs en tu sitio VildAPK directamente desde WhatsApp.

---

## ⚙️ Instalación paso a paso

### 1. Requisitos
- Node.js 18 o superior → https://nodejs.org
- Tu archivo `llave.json` nuevo (el que generaste en Firebase)

### 2. Preparar los archivos
Coloca todos estos archivos en una misma carpeta:
```
vildapk-bot/
├── index.js
├── firebase.js
├── package.json
└── llave.json   ← tu llave nueva de Firebase
```

### 3. Instalar dependencias
Abre la terminal dentro de la carpeta y ejecuta:
```bash
npm install
```

### 4. Configurar tu número
Abre `index.js` y cambia esta línea:
```js
const OWNER_NUMBER = '57XXXXXXXXXX';
```
Por tu número con código de país sin + ni espacios.
Ejemplo Colombia: `573001234567`

### 5. Iniciar el bot
```bash
npm start
```
Aparecerá un **código QR** en la terminal.
Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo → escanea el QR.

¡Listo! El bot ya está activo. ✅

---

## 📋 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `!publicar` | Publica una APK nueva |
| `!editar [ID]` | Edita una APK existente |
| `!borrar [ID]` | Borra una APK |
| `!lista` | Lista las últimas 20 APKs con sus IDs |
| `!ayuda` | Muestra todos los comandos |

---

## 📤 Formato para publicar

Envíate este mensaje a ti mismo desde WhatsApp:

```
!publicar
Nombre: YouTube Premium
Versión: 19.5.1
Tamaño: 45 MB
Icono: https://url-del-icono.com/icon.png
Link64: https://link-arm64.com/app.apk
Link32: https://link-arm32.com/app.apk
Universal: https://link-alternativo.com/app.apk
PlayStore: com.google.android.youtube
Descripción: YouTube sin anuncios ni límites
Género: Apps
Tags: video, streaming, youtube
```

> Solo **Nombre** e **Icono** son obligatorios. Los demás campos son opcionales.

---

## ✏️ Formato para editar

Primero usa `!lista` para obtener el ID de la APK, luego:

```
!editar abc123XYZ
Versión: 20.0.0
Tamaño: 50 MB
```

Solo necesitas poner los campos que quieres cambiar.

---

## ⚠️ Notas importantes

- **Nunca compartas** tu `llave.json` con nadie ni la subas a GitHub
- La carpeta `auth_session/` se crea automáticamente al vincular WhatsApp, no la borres
- Si el bot se desconecta, simplemente vuelve a ejecutar `npm start`
