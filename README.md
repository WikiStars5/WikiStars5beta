
# WikiStars5: Descripción Detallada de Funcionalidades

WikiStars5 es una plataforma web interactiva diseñada para que los usuarios puedan explorar, calificar, y discutir sobre perfiles de figuras públicas de diversas categorías. La aplicación combina una base de datos de perfiles con sistemas de votación, gamificación y una completa sección de administración.

---

## 1. Funcionalidades para el Usuario General

Estas son las características disponibles para cualquier visitante del sitio.

### 1.1. Autenticación y Perfiles de Usuario

- **Sistema de Cuentas Dual:**
  - **Usuarios Registrados:** Pueden crear una cuenta con email y contraseña. Esto les permite tener un perfil persistente con logros y notificaciones.
  - **Usuarios Anónimos (Invitados):** Cualquier visitante que llega al sitio recibe automáticamente una sesión de invitado. Esto le permite participar en la mayoría de las funcionalidades (votar, comentar) sin necesidad de registrarse. Su información (nombre de invitado, género, país y actividad) se guarda localmente en su navegador.

- **Página de Perfil (`/profile`):**
  - **Invitados:** Pueden ver su actividad local (rachas, votos) y editar su nombre de invitado, género y país.
  - **Registrados:** Pueden editar su nombre de usuario, país y género. Su información se guarda de forma segura en la base de datos.
  - **Visualización de Actividad:** Todos los usuarios pueden ver sus rachas de comentarios activas y un historial de sus votos de actitud y emoción.

### 1.2. Exploración y Descubrimiento de Figuras

- **Página de Inicio (`/`):**
  - Presenta una sección de "Figuras Destacadas" seleccionadas por el administrador.
  - Incluye una barra de búsqueda principal para encontrar figuras por nombre.

- **Página de Explorar (`/figures`):**
  - Muestra una cuadrícula paginada con todas las figuras públicas disponibles en la base de datos.
  - Permite navegar entre páginas de resultados ("Anterior" y "Siguiente").

- **Página de Detalle de la Figura (`/figures/[id]`):**
  - **Información del Perfil:** Muestra toda la información detallada de la figura, incluyendo biografía, nacionalidad (con un enlace para ver otras figuras del mismo país), redes sociales y etiquetas.
  - **Votación de Actitud (EN MANTENIMIENTO):** Los usuarios pueden votar si se consideran "Fan", "Neutral", "Simp" o "Hater" de la figura. Se muestran los recuentos totales de cada categoría.
  - **Votación de Emoción:** Los usuarios votan por la emoción que les provoca la figura (Alegría, Envidia, Tristeza, etc.). Se muestran los porcentajes de cada emoción en un gráfico.
  - **Calificación por Estrellas:** Se muestra un resumen visual de las calificaciones (de 0 a 5 estrellas) que los usuarios han dado al dejar comentarios, junto con el promedio general.
  - **Perfiles Relacionados:** Una sección donde los administradores pueden enlazar a otras figuras de interés.

### 1.3. Interacción Social y Gamificación

- **Sistema de Comentarios Anidado:**
  - Los usuarios (tanto registrados como invitados) pueden dejar comentarios y opiniones en cada perfil.
  - Pueden dar "Me Gusta" y "No me Gusta" a los comentarios de otros.
  - Pueden responder a otros comentarios, creando hilos de discusión de hasta 4 niveles de profundidad.

- **Notificaciones (Solo para Usuarios Registrados):**
  - Un sistema de notificaciones en tiempo real (icono de campana en la cabecera) que alerta a los usuarios cuando:
    - Alguien responde a su comentario.
    - Alguien le da "Me Gusta" a su comentario.
    - Alguien le da "No me Gusta" a su comentario.
  - Las notificaciones se pueden filtrar por tipo y marcar como leídas.

- **Sistema de Rachas (Streaks):**
  - Si un usuario comenta en el perfil de una figura durante días consecutivos, inicia y mantiene una "racha".
  - En la página de perfil, el usuario puede ver sus rachas activas.
  - En la página de la figura, una tabla de "Top Rachas" muestra a los usuarios con las rachas más largas para esa figura en específico.

- **Logros:**
  - Los usuarios registrados pueden desbloquear logros por realizar acciones específicas, como ver un perfil por primera vez o emitir su primer voto.

---

## 2. Funcionalidades para Administradores

El panel de administración (`/admin`) es una sección protegida accesible solo para usuarios con el rol de "admin".

- **Panel Principal (`/admin`):**
  - Muestra un resumen de las estadísticas clave de la plataforma, como el número total de figuras.
  - Proporciona accesos directos a las principales acciones de administración.
  - Incluye herramientas de mantenimiento, como un botón para corregir masivamente URLs de imágenes mal formadas en la base de datos.

- **Gestión de Figuras (`/admin/figures`):**
  - **Crear Perfiles:** Un formulario completo para añadir nuevas figuras a la base de datos. El formulario incluye campos para toda la información biográfica, física, redes sociales, etc.
  - **Editar Perfiles:** Modificar cualquier dato de una figura existente.
  - **Eliminar Perfiles:** Borrar perfiles de la base de datos (con confirmación). Existe también un botón de "Eliminar Todo" para limpieza masiva.
  - **Marcar como Destacada:** Un interruptor para hacer que una figura aparezca en la página de inicio.

- **Gestión de Usuarios (`/admin/users`):**
  - Muestra una tabla con todos los usuarios **registrados** en la plataforma (no incluye a los invitados anónimos).
  - Permite buscar usuarios por nombre o correo electrónico.
  - Muestra detalles clave como su rol (usuario o admin), país y fecha del último acceso.
  - Los administradores pueden crear nuevas cuentas desde la página de registro (`/signup`).

---

## 3. Arquitectura y Tecnología

- **Frontend:** Construido con **Next.js** y **React**, utilizando componentes de **ShadCN UI** y estilizado con **Tailwind CSS**.
- **Backend y Base de Datos:** Utiliza los servicios de **Firebase**:
  - **Firestore:** Como base de datos NoSQL para almacenar todos los datos de figuras, perfiles de usuario, comentarios y más.
  - **Firebase Authentication:** Para gestionar tanto la autenticación por correo/contraseña como las sesiones anónimas.
  - **Firebase Storage:** Para alojar recursos como imágenes y logos.
  - **Firebase Cloud Functions (EN REVISIÓN):** La lógica de servidor está siendo migrada a un proveedor de hosting Serverless (como Vercel o Netlify) para mayor estabilidad y seguridad.
- **Progressive Web App (PWA):** La aplicación es instalable en dispositivos móviles y de escritorio, y puede enviar notificaciones push.
