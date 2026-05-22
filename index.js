const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const firebase = require('./firebase');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs');

const SESSION_FILE = './session.json';

// ─── OBTENER NÚMERO DEL OWNER ────────────────────────────────────────────────
async function obtenerNumero() {
    if (fs.existsSync(SESSION_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
            if (data.ownerNumber) return data.ownerNumber;
        } catch {}
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const numero = await new Promise((resolve) => {
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║      🤖 VildAPK Bot — Setup           ║');
        console.log('╚══════════════════════════════════════╝\n');
        console.log('  Solo necesitas hacer esto UNA VEZ.\n');
        rl.question('  📱 Tu número (con código de país, sin +):\n  Ejemplo Colombia: 573001234567\n👉 ', (r) => {
            rl.close();
            resolve(r.trim().replace(/[^0-9]/g, ''));
        });
    });

    fs.writeFileSync(SESSION_FILE, JSON.stringify({ ownerNumber: numero }, null, 2));
    console.log(`\n  ✅ Número guardado: ${numero}`);
    console.log('  (No te volverá a preguntar esto)\n');
    return numero;
}

// ─── CONEXIÓN PRINCIPAL ───────────────────────────────────────────────────────
async function conectar() {
    const OWNER_NUMBER = await obtenerNumero();
    const { state, saveCreds } = await useMultiFileAuthState('./auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        // FIX 1: Se elimina Browsers.ubuntu — causaba rechazo en WhatsApp.
        // FIX 2: printQRInTerminal false está correcto para pairing code,
        //        pero ahora el flujo es robusto y no llama process.exit.
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    // FIX 3: El pairing code se pide DENTRO de connection.update cuando
    // el estado es 'open' o cuando llega el evento correcto.
    // Antes se pedía inmediatamente antes de que el socket estuviera listo,
    // lo que causaba error "connection not open".
    let codigoPedido = false;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

        // FIX 4: Cuando Baileys emite `qr`, es la señal de que el socket
        // ya está listo para pedir el pairing code.
        if (qr && !codigoPedido && !state.creds.registered) {
            codigoPedido = true;
            try {
                const codigo = await sock.requestPairingCode(OWNER_NUMBER);
                console.clear();
                console.log('\n╔══════════════════════════════════════╗');
                console.log(`   🔑 CÓDIGO DE VINCULACIÓN: \x1b[1m\x1b[32m${codigo}\x1b[0m`);
                console.log('╚══════════════════════════════════════╝\n');
                console.log('  📲 WhatsApp → Dispositivos vinculados');
                console.log('     → Vincular con número de teléfono\n');
                console.log('  ⏳ Esperando que vincules...\n');
            } catch (e) {
                console.log('❌ Error al pedir código:', e.message);
                console.log('🔄 Reinicia el bot e intenta de nuevo.');
                // FIX 5: No hacer process.exit — intentar reconectar limpiamente
                sock.end();
            }
        }

        if (connection === 'close') {
            const codigo = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (codigo === DisconnectReason.loggedOut) {
                console.log('🚪 Sesión cerrada. Borra la carpeta auth_session/ y ejecuta npm start.');
            } else {
                console.log('🔄 Reconectando...');
                conectar();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado a WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const senderNumber = from.replace('@s.whatsapp.net', '');

        if (senderNumber !== OWNER_NUMBER) {
            await sock.sendMessage(from, { text: '🔒 No tienes permiso para usar este bot.' });
            return;
        }

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const lineas = texto.trim().split('\n');
        const comando = lineas[0].trim().toLowerCase();

        // ── COMANDO: !publicar ───────────────────────────────────────────────
        if (comando === '!publicar') {
            const datos = parsearDatos(lineas.slice(1));
            if (!datos.nombre || !datos.icono) {
                await sock.sendMessage(from, {
                    text: '⚠️ Faltan campos obligatorios: *Nombre* e *Icono*.\n\nUsa el formato:\n' + formatoAyuda()
                });
                return;
            }
            try {
                const id = await firebase.publicarApk(datos);
                await sock.sendMessage(from, {
                    text: `✅ *${datos.nombre}* publicada correctamente!\n\n🆔 ID: \`${id}\``
                });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error al publicar: ' + e.message });
            }
        }

        // ── COMANDO: !editar ID ──────────────────────────────────────────────
        else if (comando.startsWith('!editar')) {
            const id = comando.split(' ')[1]?.trim();
            if (!id) {
                await sock.sendMessage(from, { text: '⚠️ Debes indicar el ID.\nEjemplo: !editar abc123' });
                return;
            }
            const datos = parsearDatos(lineas.slice(1));
            try {
                await firebase.editarApk(id, datos);
                await sock.sendMessage(from, { text: `✅ APK *${id}* actualizada correctamente.` });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error al editar: ' + e.message });
            }
        }

        // ── COMANDO: !borrar ID ──────────────────────────────────────────────
        else if (comando.startsWith('!borrar')) {
            const id = comando.split(' ')[1]?.trim();
            if (!id) {
                await sock.sendMessage(from, { text: '⚠️ Debes indicar el ID.\nEjemplo: !borrar abc123' });
                return;
            }
            try {
                await firebase.borrarApk(id);
                await sock.sendMessage(from, { text: `🗑️ APK \`${id}\` borrada.` });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error al borrar: ' + e.message });
            }
        }

        // ── COMANDO: !lista ──────────────────────────────────────────────────
        else if (comando === '!lista') {
            try {
                const apps = await firebase.listarApks();
                if (apps.length === 0) {
                    await sock.sendMessage(from, { text: '📭 No hay APKs en el catálogo.' });
                    return;
                }
                const lista = apps.slice(0, 20).map((a, i) => `${i + 1}. *${a.title}* — \`${a.id}\``).join('\n');
                await sock.sendMessage(from, { text: `📦 *Catálogo VildAPK* (últimas ${Math.min(apps.length, 20)}):\n\n${lista}` });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error: ' + e.message });
            }
        }

        // ── COMANDO: !ayuda ──────────────────────────────────────────────────
        else if (comando === '!ayuda') {
            await sock.sendMessage(from, { text: mensajeAyuda() });
        }

        else if (texto.startsWith('!')) {
            await sock.sendMessage(from, { text: '❓ Comando no reconocido. Envía *!ayuda* para ver los comandos.' });
        }
    });
}

// ─── PARSEAR DATOS ───────────────────────────────────────────────────────────
function parsearDatos(lineas) {
    const datos = {};
    const mapa = {
        'nombre': 'nombre', 'version': 'version', 'versión': 'version',
        'tamaño': 'tamaño', 'tamano': 'tamaño', 'icono': 'icono',
        'link64': 'link64', 'link32': 'link32', 'universal': 'universal',
        'playstore': 'playstore', 'descripcion': 'descripcion',
        'descripción': 'descripcion', 'genero': 'genero', 'género': 'genero',
        'tags': 'tags',
    };
    for (const linea of lineas) {
        const idx = linea.indexOf(':');
        if (idx === -1) continue;
        const clave = linea.slice(0, idx).trim().toLowerCase();
        const valor = linea.slice(idx + 1).trim();
        const campo = mapa[clave];
        if (campo) datos[campo] = valor;
    }
    return datos;
}

function formatoAyuda() {
    return `!publicar
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
Tags: video, streaming, youtube`;
}

function mensajeAyuda() {
    return `🤖 *Bot VildAPK — Comandos*

*!publicar* — Publica una APK nueva
*!editar [ID]* — Edita una APK existente
*!borrar [ID]* — Borra una APK del catálogo
*!lista* — Lista las últimas 20 APKs
*!ayuda* — Muestra este mensaje

━━━━━━━━━━━━━━━━
📋 *Formato para publicar:*

${formatoAyuda()}

━━━━━━━━━━━━━━━━
📝 *Notas:*
• Solo *Nombre* e *Icono* son obligatorios
• Género puede ser: *Apps* o *Juegos*
• Tags separados por coma`;
}

conectar();
