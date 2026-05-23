#!/data/data/com.termux/files/usr/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      🤖 VildAPK Bot — Setup          ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "📦 Actualizando paquetes..."
pkg update -y && pkg upgrade -y

echo "📦 Instalando Node.js..."
pkg install -y nodejs

if [ ! -f "llave.json" ]; then
    echo ""
    echo "⚠️  Falta llave.json — cópiala así:"
    echo "   cp ~/storage/downloads/llave.json ."
    echo ""
fi

echo "📦 Instalando dependencias..."
npm install

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ✅ Instalación completada!          ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "▶️  Ejecuta: npm start"
echo ""
