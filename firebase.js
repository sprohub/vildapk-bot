const admin = require('firebase-admin');
const serviceAccount = require('./llave.json'); // Tu llave nueva aquí

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const catalog = db.collection('catalog');

// ─── PUBLICAR APK NUEVA ──────────────────────────────────────────────────────
async function publicarApk(datos) {
    const genero = normalizarGenero(datos.genero);
    const tags = datos.tags ? datos.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const doc = {
        title:     datos.nombre || '',
        release:   datos.version || '',
        bytes:     datos.tamaño || '',
        thumbnail: datos.icono || '',
        official:  datos.playstore || '',
        arm32:     datos.link32 || '',
        arm64:     datos.link64 || '',
        mirror:    datos.universal || '',
        about:     datos.descripcion || '',
        genre:     genero,
        keywords:  tags,
        hits:      0,
        added:     Date.now()
    };

    const ref = await catalog.add(doc);
    return ref.id;
}

// ─── EDITAR APK EXISTENTE ────────────────────────────────────────────────────
async function editarApk(id, datos) {
    const ref = catalog.doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`No existe la APK con ID: ${id}`);

    const actualizar = {};
    if (datos.nombre)      actualizar.title     = datos.nombre;
    if (datos.version)     actualizar.release   = datos.version;
    if (datos.tamaño)      actualizar.bytes     = datos.tamaño;
    if (datos.icono)       actualizar.thumbnail = datos.icono;
    if (datos.playstore)   actualizar.official  = datos.playstore;
    if (datos.link32)      actualizar.arm32     = datos.link32;
    if (datos.link64)      actualizar.arm64     = datos.link64;
    if (datos.universal)   actualizar.mirror    = datos.universal;
    if (datos.descripcion) actualizar.about     = datos.descripcion;
    if (datos.genero)      actualizar.genre     = normalizarGenero(datos.genero);
    if (datos.tags)        actualizar.keywords  = datos.tags.split(',').map(t => t.trim()).filter(Boolean);

    await ref.set(actualizar, { merge: true });
}

// ─── BORRAR APK ──────────────────────────────────────────────────────────────
async function borrarApk(id) {
    const ref = catalog.doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`No existe la APK con ID: ${id}`);
    await ref.delete();
}

// ─── LISTAR APKS ─────────────────────────────────────────────────────────────
async function listarApks() {
    const snap = await catalog.orderBy('added', 'desc').limit(20).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── NORMALIZAR GÉNERO ───────────────────────────────────────────────────────
function normalizarGenero(valor = '') {
    const v = valor.toLowerCase().trim();
    if (['juegos', 'juego', 'game', 'games'].includes(v)) return 'Juegos';
    return 'Apps';
}

module.exports = { publicarApk, editarApk, borrarApk, listarApks };
