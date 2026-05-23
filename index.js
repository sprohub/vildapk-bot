const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const firebase = require('./firebase');
const pino = require('pino');

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const BOT_NUMBER   = '573225814649'; // número que se vincula (SIM del bot)
const OWNER_NUMBER = '573225396540'; // número que envía los comandos

// ─── CONEXIÓN PRINCIPAL ───────────────────────────────────────────────────────
async function conectar() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_session');

    const logger = pino({ level: 'silent' });
    logger.child = () => logger;

    const sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: Browsers.macOS('Google Chrome'),
        markOnlineOnConnect: false,
        getMessage: async () => undefined,
    });

    sock.ev.on('creds.update', saveCreds);

    let pairingCodeSolicitado = false;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {

        // En v7 el pairing code se pide DESPUÉS de que el socket está listo
        if (connection === 'open' && !state.creds.registered && !pairingCodeSolicitado) {
            pairingCodeSolicitado = true;
            try {
                const codigo = await sock.requestPairingCode(BOT_NUMBER);
                console.clear();
                console.log('\n╔══════════════════════════════════════╗');
                console.log(`   🔑 CÓDIGO: \x1b[1m\x1b[32m${codigo}\x1b[0m`);
                console.log('╚══════════════════════════════════════╝\n');
                console.log('  WhatsApp → Dispositivos vinculados');
                console.log('  → Vincular con número de teléfono\n');
            } catch (e) {
                console.log('❌ Error al pedir código:', e.message);
                pairingCodeSolicitado = false;
            }
        }

        if (connection === 'close') {
            const codigo = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (codigo === DisconnectReason.loggedOut) {
                console.log('🚪 Sesión cerrada. Ejecuta: rm -rf auth_session/ && npm start');
            } else {
                console.log('🔄 Reconectando en 5 segundos...');
                await new Promise((r) => setTimeout(r, 5000));
                conectar();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado a WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        if (from.endsWith('@g.us')) return;

        const senderNumber = from.replace('@s.whatsapp.net', '');

        if (senderNumber !== OWNER_NUMBER) {
            await sock.sendMessage(from, { text: '🔒 No tienes permiso para usar este bot.' });
            return;
        }

        const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            '';

        if (!texto.trim()) return;

        const lineas = texto.trim().split('\n');
        const comando = lineas[0].trim().toLowerCase();

        if (comando === '!publicar') {
            const datos = parsearDatos(lineas.slice(1));
            if (!datos.nombre || !datos.icono) {
                await sock.sendMessage(from, {
                    text: '⚠️ Faltan campos obligatorios: *Nombre* e *Icono*.\n\nFormato:\n' + formatoAyuda()
                });
                return;
            }
            try {
                const id = await firebase.publicarApk(datos);
                await sock.sendMessage(from, {
                    text: `✅ *${datos.nombre}* publicada!\n\n🆔 ID: \`${id}\``
                });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error al publicar: ' + e.message });
            }

        } else if (comando.startsWith('!editar')) {
            const id = comando.split(' ')[1]?.trim();
            if (!id) {
                await sock.sendMessage(from, { text: '⚠️ Ejemplo: !editar abc123' });
                return;
            }
            const datos = parsearDatos(lineas.slice(1));
            if (Object.keys(datos).length === 0) {
                await sock.sendMessage(from, { text: '⚠️ No enviaste ningún campo para actualizar.' });
                return;
            }
            try {
                await firebase.editarApk(id, datos);
                await sock.sendMessage(from, { text: `✅ APK *${id}* actualizada.` });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error al editar: ' + e.message });
            }

        } else if (comando.startsWith('!borrar')) {
            const id = comando.split(' ')[1]?.trim();
            if (!id) {
                await sock.sendMessage(from, { text: '⚠️ Ejemplo: !borrar abc123' });
                return;
            }
            try {
                await firebase.borrarApk(id);
                await sock.sendMessage(from, { text: `🗑️ APK \`${id}\` borrada.` });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error al borrar: ' + e.message });
            }

        } else if (comando === '!lista') {
            try {
                const apps = await firebase.listarApks();
                if (apps.length === 0) {
                    await sock.sendMessage(from, { text: '📭 No hay APKs en el catálogo.' });
                    return;
                }
                const lista = apps.map((a, i) => `${i + 1}. *${a.title}* — \`${a.id}\``).join('\n');
                await sock.sendMessage(from, { text: `📦 *Catálogo VildAPK*:\n\n${lista}` });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Error: ' + e.message });
            }

        } else if (comando === '!ayuda') {
            await sock.sendMessage(from, { text: mensajeAyuda() });

        } else if (texto.startsWith('!')) {
            await sock.sendMessage(from, { text: '❓ Comando no reconocido. Envía *!ayuda*.' });
        }
    });
}

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
        if (campo && valor) datos[campo] = valor;
    }
    return datos;
}

function formatoAyuda() {
    return `!publicar
Nombre: YouTube Premium
Versión: 19.5.1
Tamaño: 45 MB
Icono: https://url-icono.com/icon.png
Link64: https://link-arm64.com/app.apk
Link32: https://link-arm32.com/app.apk
Universal: https://link.com/app.apk
PlayStore: com.google.android.youtube
Descripción: YouTube sin anuncios
Género: Apps
Tags: video, streaming`;
}

function mensajeAyuda() {
    return `🤖 *Bot VildAPK — Comandos*

*!publicar* — Publica una APK nueva
*!editar [ID]* — Edita una APK existente
*!borrar [ID]* — Borra una APK
*!lista* — Lista las últimas 20 APKs
*!ayuda* — Muestra este mensaje

━━━━━━━━━━━━━━━━
📋 *Formato:*

${formatoAyuda()}

━━━━━━━━━━━━━━━━
📝 Solo *Nombre* e *Icono* son obligatorios.`;
}

process.on('unhandledRejection', (err) => {
    console.error('⚠️ Error:', err?.message || err);
});

conectar();
