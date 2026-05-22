# 🤖 Bot WhatsApp — VildAPK

Bot para publicar, editar y borrar APKs desde WhatsApp. Funciona en **Termux** sin PC. Vinculación por **código**, sin QR.

---

## 🚀 Instalación en Termux

### Primera vez

```bash
# 1. Dar permisos de almacenamiento
termux-setup-storage

# 2. Instalar git
pkg install -y git

# 3. Clonar el repo
git clone https://github.com/sprohub/vildapk-bot.git
cd vildapk-bot

# 4. Copiar tu llave de Firebase
cp ~/storage/downloads/llave.json .

# 5. Instalar todo
bash setup-termux.sh

# 6. Arrancar
npm start
```

Al arrancar por primera vez te pide tu número **una sola vez** y lo guarda. Luego te muestra el código para vincular WhatsApp.

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

---

## ⚠️ Importante

- **Nunca** subas `llave.json` a GitHub
- `session.json` y `auth_session/` guardan tu sesión — no los borres
