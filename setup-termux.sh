#!/data/data/com.termux/files/usr/bin/bash
# ────────────────────────────────────────────────
#   Setup VildAPK Bot para Termux
#   Uso: bash setup-termux.sh
# ────────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      🤖 VildAPK Bot — Setup          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Actualizar paquetes
echo "📦 Actualizando paquetes..."
pkg update -y && pkg upgrade -y

# 2. Instalar Node.js
echo ""
echo "📦 Instalando Node.js..."
pkg install -y nodejs

# 3. Verificar que llave.json existe
if [ ! -f "llave.json" ]; then
    echo ""
    echo "⚠️  ATENCIÓN: No se encontró el archivo llave.json"
    echo "   Coloca tu llave de Firebase en esta carpeta como 'llave.json'"
    echo "   y vuelve a ejecutar: npm start"
    echo ""
fi

# 4. Instalar dependencias npm
echo ""
echo "📦 Instalando dependencias del bot..."
npm install

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ✅ Instalación completada!          ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "▶️  Para iniciar el bot ejecuta:"
echo "    npm start"
echo ""
echo "📲 Al iniciarse te dará un CÓDIGO de 8 dígitos."
echo "   En WhatsApp → Dispositivos vinculados → Vincular con número"
echo "   Ingresa el código y listo ✅"
echo ""
