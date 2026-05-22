const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const firebase = require('./firebase');
const pino = require('pino');

// ─── TU NÚMERO DE WHATSAPP (con código de país, sin + ni espacios) ───────────
const OWNER_NUMBER = '57XXXXXXXXXX'; // Ej: 573001234567

async function conectar() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexión cerrada. Reconectando:', shouldReconnect);
            if (shouldReconnect) conectar();
        } else if (connection === 'open') {
            console.log('✅ Bot conectado a WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const senderNumber = from.replace('@s.whatsapp.net', '');

        // Solo responde al dueño
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
            const partes = comando.split(' ');
            const id = partes[1]?.trim();
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
            const partes = comando.split(' ');
            const id = partes[1]?.trim();
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

        // ── COMANDO DESCONOCIDO ──────────────────────────────────────────────
        else if (texto.startsWith('!')) {
            await sock.sendMessage(from, { text: '❓ Comando no reconocido. Envía *!ayuda* para ver los comandos.' });
        }
    });
}

// ─── PARSEAR LOS DATOS DEL MENSAJE ──────────────────────────────────────────
function parsearDatos(lineas) {
    const datos = {};
    const mapa = {
        'nombre':      'nombre',
        'version':     'version',
        'versión':     'version',
        'tamaño':      'tamaño',
        'tamano':      'tamaño',
        'icono':       'icono',
        'link64':      'link64',
        'link32':      'link32',
        'universal':   'universal',
        'playstore':   'playstore',
        'descripcion': 'descripcion',
        'descripción': 'descripcion',
        'genero':      'genero',
        'género':      'genero',
        'tags':        'tags',
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

// ─── MENSAJE DE AYUDA ────────────────────────────────────────────────────────
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
