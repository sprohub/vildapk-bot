# 🤖 VildAPK Bot

Bot de WhatsApp para publicar, editar y gestionar APKs en el catálogo de VildAPK. Usa [Baileys](https://github.com/WhiskeySockets/Baileys) para conectarse a WhatsApp y Firebase Firestore como base de datos.

---

## ⚙️ Requisitos

- Node.js 18 o superior
- Una cuenta de Firebase con Firestore habilitado
- Un número de WhatsApp **dedicado** para el bot (no uses tu número personal)

---

## 🚀 Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/vildapk-bot.git
cd vildapk-bot

# 2. Instala las dependencias
npm install

# 3. Agrega tu llave de Firebase
#    Descarga el archivo de cuenta de servicio desde Firebase Console
#    y guárdalo como llave.json en la raíz del proyecto
#    ⚠️ NUNCA subas llave.json a GitHub

# 4. Inicia el bot
npm start
```

Al iniciar por primera vez te pedirá tu número de WhatsApp (con código de país, sin `+`).  
Ejemplo Colombia: `573001234567`

Luego mostrará un **código de 8 letras**. En WhatsApp ve a:  
`Dispositivos vinculados → Vincular con número de teléfono` e ingresa el código.

---

## 📋 Comandos

| Comando | Descripción |
|---|---|
| `!publicar` | Publica una APK nueva |
| `!editar [ID]` | Edita una APK existente |
| `!borrar [ID]` | Borra una APK del catálogo |
| `!lista` | Lista las últimas 20 APKs |
| `!ayuda` | Muestra los comandos y el formato |

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

## 🔒 Seguridad

- `llave.json` y `auth_session/` están en `.gitignore` — nunca se suben a GitHub.
- El bot solo responde al número del owner configurado.
- Los mensajes de grupos son ignorados completamente.

---

## 📁 Estructura

```
vildapk-bot/
├── index.js        # Lógica principal del bot
├── firebase.js     # Funciones de Firestore
├── package.json
├── .gitignore
└── llave.json      # ← TÚ lo agregas localmente (no está en el repo)
```
