# Marble Cake Family

Proyecto real para la página pública de Marble Cake Family.

## Contexto del producto

- Explicar qué es Marble Cake Family.
- Mantener clara la conexión con Dummeez.
- Preparar el sitio para merch, drops, galería, updates y lo que se vaya sumando.
- Evitar tratar esta base como demo temporal: la estructura inicial debe poder crecer sin rehacer todo.

## Stack inicial

- Vite con HTML, CSS y JavaScript vanilla.
- Assets públicos en `public/assets/`.
- Estilos principales en `src/styles.css`.

## Comandos

```bash
npm install
npm run dev
npm run build
```


## Publicación

El sitio público está en GitHub Pages:

- URL: https://troghx.github.io/Marble-Cake-Family/
- Fuente de Pages: rama `main`, carpeta `/docs`.
- `docs/` contiene el build estático publicado; no editarlo a mano salvo emergencia.

Para publicar cambios:

```bash
npm run build:pages
git add .
git commit -m "Describe el cambio"
git push
```

Netlify quedó desactivado sin borrar el proyecto, por si después se quiere retomar ese deploy.

## Notas de diseño

- El primer fondo oficial vive en `public/assets/marble-cake.png`.
- La dirección inicial es editorial, oscura, cálida y enfocada en el mundo Marble Cake.
- La prioridad inmediata es composición y tono; tamaño, colores finos y secciones pueden iterarse después.
