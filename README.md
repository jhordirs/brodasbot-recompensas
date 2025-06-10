# Descripción:

La aplicación **BRODAS Bot - Recompensas** es un bot de discord que envía una tabla de puntaje mediante un mensaje embed integrado en un dahsboard web.

### Características:

1- Permite crear una lista de miembros del servidor de discord y asignar puntajes para recompensas.

2- Toda la información se almacena de manera local en una base de datos y al entrar al dashboard o refrescar la página, los últimos datos agregados/modificados se cargan automáticamente.

3- Cuenta con una sección para agregar/eliminar miembros, asignar puntos y modificar el orden de los miembros de la lista.

4- Soporte para incluir una cadena de texto en el embed que está ubicado en la parte superior e inferior, como también la capacidad de añadir menciones de miembros, roles y emotes.

# Iniciar proyecto:

1- Crear un archivo **.env** en la carpeta raíz con el siguiente contenido:

```TOKEN=TU_API_DISCORD_TOKEN```

```DB_PATH=./rewards.db```

2- Ejecutar **node index.js** en terminal para iniciar proyecto.

3- Entrar a **http://localhost:3000/** para abrir proyecto.

4- Ejecutar comando **Ctrl+C** en terminal para detener proyecto.

# Guardar cambios:

1- Ejecutar **git add .** en terminal para actualizar o añadir archivos del proyecto.

2- Ejecutar **git commit -m "mensaje"** en terminal para hacer una captura instantánea de los cambios.

3- Ejecutar **git push** en terminal para enviar todos los cambios realizados al repositorio.

### Importante:

Cualquier cambio que se haga de manera local, incluyendo modificaciones a la base de datos, guarda los cambios para uso de todos los colaboradores.

# Cargar cambios:

1- Ejecutar **git pull** en terminal para obtener los cambios más recientes del repositorio.

# Verificaciones:

1- Ejecutar **git remote -v** para verificar que esté vinculado al repositorio correcto: **https://github.com/jhordirs/brodasbot-recompensas.git**.

2- Ejecutar **git remote add origin https://github.com/jhordirs/brodasbot-recompensas.git** para vincular el proyecto con el repositorio.

3- Ejecutar **git remote set-url https://github.com/jhordirs/brodasbot-recompensas.git** para actualizar el repositorio del proyecto si es que cuenta con otro.

# Notas:

1- El proyecto no es para uso general (pero tampoco está restringido), fue elaborado y personalizado para **uso** del **Clan BRODAS - Destiny 2**.

2- Cualquier consulta y/o duda. Escríbeme en Discord, búscame como **jhordi**.
