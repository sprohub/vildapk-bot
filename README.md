# 🤖 Bot WhatsApp — VildAPK

Bot para publicar, editar y borrar APKs desde WhatsApp. Funciona en **Termux** sin PC. Vinculación por **código**, sin QR.

---

## 🚀 Instalación en Termux

### Primera vez

```bash
# 1. Dar permisos de almacenamiento
termux-setup-storage

# 2. Instalar dependencias
pkg install -y git nodejs

# 3. Clonar el repo
git clone https://github.com/sprohub/vildapk-bot.git
cd vildapk-bot

# 4. Copiar tu llave de Firebase (debe estar en Descargas)
cp ~/storage/downloads/llave.json .

# 5. Instalar paquetes de Node
bash setup-termux.sh

# 6. Arrancar
npm start
```

Al arrancar por primera vez te pide tu número **una sola vez** y lo guarda.  
Luego te muestra el código de 8 dígitos para vincular WhatsApp.

### Vincular WhatsApp

1. Abre WhatsApp → **Ajustes → Dispositivos vinculados**
2. Toca **Vincular con número de teléfono**
3. Ingresa el código que aparece en Termux
4. El bot mostrará `✅ Bot conectado a WhatsApp`

### Próximas veces

```bash
cd vildapk-bot
npm start
```

---

## 📋 Comandos

| Comando | Descripción |
|---------|-------------|
| `!publicar` | Publica una APK nueva |
| `!editar [ID]` | Edita una APK existente |
| `!borrar [ID]` | Borra una APK |
| `!lista` | Lista las últimas 20 APKs |
| `!ayuda` | Muestra todos los comandos |

### Formato para publicar

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
Descripción: YouTube sin anuncios
Género: Apps
Tags: video, streaming, youtube
```

> Solo **Nombre** e **Icono** son obligatorios.

---

## ⚠️ Importante

- **Nunca** subas `llave.json` a GitHub — contiene tus credenciales de Firebase
- **No borres** `auth_session/` ni `session.json` — guardan tu sesión de WhatsApp
- Si borras `auth_session/` tendrás que vincular el bot de nuevo con un código nuevo
