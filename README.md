# 🤖 Bot WhatsApp — VildAPK

Bot para publicar, editar y borrar APKs en tu sitio VildAPK directamente desde WhatsApp.  
Funciona en **Termux** (Android) sin necesidad de PC. Vinculación por **código**, sin QR.

---

## 🚀 Instalación en Termux (Android)

### Paso 1 — Clonar el repositorio
```bash
pkg install -y git
git clone https://github.com/TU_USUARIO/vildapk-bot.git
cd vildapk-bot
```

### Paso 2 — Agregar tu llave de Firebase
Copia el archivo `llave.json` de tu proyecto Firebase a la carpeta del bot.  
Puedes pasarlo desde el almacenamiento de tu teléfono:
```bash
cp /sdcard/llave.json .
```
> ⚠️ **Nunca** subas `llave.json` a GitHub. Ya está en `.gitignore`.

### Paso 3 — Ejecutar el setup (solo la primera vez)
```bash
bash setup-termux.sh
```
Esto instala Node.js y todas las dependencias automáticamente.

### Paso 4 — Configurar tu número *(opcional)*
Si quieres fijar tu número sin escribirlo cada vez, abre `index.js` y edita esta línea:
```js
const OWNER_NUMBER = '57XXXXXXXXXX'; // Ej: 573001234567
```
Si lo dejas como está, el bot te lo pedirá al arrancar.

### Paso 5 — Iniciar el bot
```bash
npm start
```

El bot te mostrará un **código de 8 dígitos** en pantalla:
```
✅ Tu código de emparejamiento es: ABCD-1234
📲 Ve a WhatsApp → Dispositivos vinculados → Vincular con número de teléfono
   Ingresa ese código y en segundos el bot estará activo.
```

¡Listo! ✅

---

## 🔄 Próximas veces
```bash
cd vildapk-bot
npm start
```
Ya no pide código porque la sesión queda guardada en `auth_session/`.

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

> Solo **Nombre** e **Icono** son obligatorios. Los demás son opcionales.

---

## ✏️ Formato para editar

Primero usa `!lista` para obtener el ID de la APK, luego:

```
!editar abc123XYZ
Versión: 20.0.0
Tamaño: 50 MB
```

---

## ⚠️ Notas importantes

- **Nunca compartas** tu `llave.json` ni la subas a GitHub
- La carpeta `auth_session/` guarda tu sesión — no la borres
- Si el bot se desconecta, ejecuta `npm start` nuevamente

---

## 📁 Estructura del proyecto

```
vildapk-bot/
├── index.js           ← Lógica principal del bot
├── firebase.js        ← Conexión con Firestore
├── package.json       ← Dependencias
├── setup-termux.sh    ← Instalador para Termux
├── .gitignore         ← Protege llave.json y auth_session/
└── llave.json         ← ⚠️ TÚ lo agregas, NO está en GitHub
```
