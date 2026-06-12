# DEPLOY.md — Guía de despliegue

## 1. Probar en local

Necesitas servir el proyecto por HTTP (no `file://`) para que el service
worker funcione. Node.js ≥ 18 debe estar instalado.

```bash
# Desde la raíz del proyecto:
npm run serve
# → http://localhost:3000
```

Abre esa URL en el navegador. La primera vez carga los assets; después
funciona sin conexión.

> **¿Por qué no `file://`?**
> Los service workers (y por tanto el modo offline) requieren un origen HTTP o
> HTTPS. Desde `file://` la app carga y funciona, pero no se instalará como
> PWA ni cacheará assets para uso offline.

---

## 2. Qué archivos subir al servidor

Sube **toda la carpeta** del proyecto tal cual. La estructura que el servidor
necesita servir es:

```
cheatsheet-piscinas/
  index.html
  manifest.webmanifest
  sw.js
  robots.txt
  data/
  src/
  styles/
  assets/
```

Los directorios `scripts/`, `docs/` y `node_modules/` (si existe) **no son
necesarios** en producción, pero subirlos no causa ningún problema.

---

## 3. Cómo subir al servidor

### Opción A — FTP / SFTP (panel de hosting clásico)

1. Conecta con tu cliente FTP (Filezilla, Cyberduck, etc.).
2. Sube la carpeta entera a la ruta deseada en tu servidor.
3. Listo. No hay build step.

### Opción B — rsync / SSH (servidor propio)

```bash
rsync -avz --delete ./ usuario@mi-dominio.com:/ruta/en/servidor/piscinas/
```

### Opción C — Git + pull en servidor

```bash
# En el servidor:
cd /ruta/apps/
git clone https://github.com/tu-usuario/cheatsheet-piscinas.git piscinas
# Para actualizar:
cd piscinas && git pull
```

---

## 4. Usar en una subcarpeta

El proyecto usa **rutas relativas** en todos los archivos (`./data/fichas.json`,
`./styles/main.css`, etc.), por lo que funciona correctamente en cualquier
subcarpeta sin ningún cambio.

Ejemplos que funcionan sin modificación:

```
https://mi-dominio.com/piscinas/
https://mi-dominio.com/herramientas/piscinas/
https://mi-dominio.com/apps/cheatsheet-piscinas/
```

Lo único que debes verificar es que el archivo `sw.js` esté en la **raíz de
la carpeta** de la app (ya lo está por defecto). El scope del service worker
es relativo a la ubicación de `sw.js`.

---

## 5. Cambiar la ruta base

No hay ninguna variable de configuración que cambiar. Al ser todo rutas
relativas, mover la carpeta a cualquier ruta del servidor es transparente.

Si en el futuro necesitas rutas absolutas (poco probable), la única variable
a editar sería `start_url` en `manifest.webmanifest`:

```json
"start_url": "/herramientas/piscinas/"
```

---

## 6. Requisitos del servidor para PWA

Para que la app funcione como PWA instalable (icono en pantalla de inicio,
modo offline):

| Requisito          | Detalle |
|--------------------|---------|
| **HTTPS**          | Obligatorio para service workers. La mayoría de hostings lo incluyen gratis (Let's Encrypt). |
| **Tipos MIME**     | El servidor debe servir `.webmanifest` como `application/manifest+json` y `.js` como `application/javascript`. Los servidores modernos (Apache, Nginx, Caddy) lo hacen automáticamente. |
| **Sin caché agresiva en `sw.js`** | El navegador no debe cachear `sw.js` más de 24h. Añade esta cabecera si tu servidor cachea agresivamente: `Cache-Control: no-cache` para `sw.js`. |

### Cabecera recomendada para sw.js (Apache `.htaccess`)

```apache
<Files "sw.js">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
</Files>
```

### Cabecera recomendada para sw.js (Nginx)

```nginx
location = /ruta/piscinas/sw.js {
  add_header Cache-Control "no-cache";
}
```

---

## 7. Limitaciones al abrir como archivo local (`file://`)

Si abres `index.html` directamente desde el explorador de archivos:

- ✅ La interfaz carga y es usable.
- ✅ El buscador, filtros, calculadora y árboles funcionan.
- ❌ Los archivos JSON no cargan (política de seguridad de los navegadores
  modernos bloquea `fetch()` en `file://`).
- ❌ El service worker no se registra → no hay modo offline.
- ❌ No se puede instalar como PWA.

**Conclusión:** para uso en campo, siempre acceder por la URL del servidor.

---

## 8. Proteger la carpeta con contraseña (sin login en la app)

### Apache — autenticación básica HTTP

1. Crea el archivo de contraseña:
   ```bash
   htpasswd -c /etc/apache2/.htpasswd ricard
   # te pedirá la contraseña
   ```

2. Añade un `.htaccess` en la raíz de la carpeta de la app:
   ```apache
   AuthType Basic
   AuthName "Área restringida"
   AuthUserFile /etc/apache2/.htpasswd
   Require valid-user
   ```

3. Asegúrate de que `AllowOverride AuthConfig` está activo en tu configuración
   de Apache.

### Nginx — autenticación básica HTTP

```nginx
location /piscinas/ {
  auth_basic "Área restringida";
  auth_basic_user_file /etc/nginx/.htpasswd;
}
```

### Panel de hosting (cPanel, Plesk, etc.)

Busca "Protección de directorios" o "Password protect directory" en el panel.
La mayoría de hostings lo ofrecen con un formulario gráfico.

> La app no tiene login propio. La protección es a nivel de servidor y
> es transparente para la app.

---

## 9. Actualizar el contenido

Cuando se añade o edita una ficha:

1. Edita `data/fichas.json`.
2. Ejecuta `npm run validate` — debe pasar sin errores.
3. **Sube los archivos modificados al servidor** (mínimo `data/fichas.json`).
4. Incrementa `CACHE_VERSION` en `sw.js` (ej. `v1` → `v2`) para que los
   usuarios vean la actualización al recargar.
5. Sube `sw.js` actualizado.

Los usuarios verán el toast **"Hay una nueva versión disponible · Actualizar"**
la próxima vez que abran la app con conexión.
