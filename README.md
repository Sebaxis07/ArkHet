<div align="center">

  <img src="public/logo.png" alt="Arkhet Logo" width="120" />

  # ARKHET
  ### Operating System de Arquitectura & Grafo Vivo de Sistemas

  [![React](https://img.shields.io/badge/React-19.0-black?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-black?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-black?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-black?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
  [![Node.js](https://img.shields.io/badge/Node.js-Express_API-black?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

  *Plataforma web de arquitectura corporativa de alto impacto visual. Escanea tus repositorios de GitHub y carpetas locales para generar grafos vivos de microservicios, endpoints de API, modelos de bases de datos y componentes de código.*

</div>

---

## ⚡ Características Principales

### 🧠 1. Lienzo Interactivo Macro Mapa Mental
- **Visualización Radial Bilateral**: Presenta el ecosistema de proyectos vinculados a tu cuenta en una estructura de mapa mental dinámica con curvas Bézier interactivas.
- **Modos de Vista**: Alterna entre **`🧠 MAPA MENTAL`** y **`📊 REJILLA CORPORATIVA`**.
- **Zoom & Pan**: Control táctil y zoom suave con la rueda del mouse (`0.35x` a `2.5x`).

### 🔬 2. Motor de Escaneo Profundo y Detección de Microservicios
- **Top-Level Microservice Discovery**: Analiza directorios raíz como `ai-service` (Python/FastAPI/OpenAI), `backend` (Express/Node.js), `frontend` (React/Vite) y `uploads/deliverables`.
- **Parser de Código Fuente**: Extrae automáticamente rutas HTTP (`GET`, `POST`, `PUT`, `DELETE`), componentes React UI y esquemas Mongoose / Prisma.

### ⚡ 3. Indicador de Progreso Real con Porcentaje (%) y Carga en Segundo Plano
- **Modal de Progreso en Vivo**: Muestra la descarga y análisis en tiempo real (`0% ➔ 100%`) con detalle exacto del archivo procesado.
- **Navegación en Segundo Plano**: Minimiza la tarea de escaneo a la barra superior y continúa trabajando sin interrupciones.

### 📐 4. Capas Adaptativas Dinámicas (Dynamic Cluster Layers)
- **Auto-Envolvente**: Las zonas contenedoras (`CAPA 1: PRESENTACIÓN`, `CAPA 2: SERVIDORES API`, `CAPA 3: PERSISTENCIA`) calculan su tamaño en tiempo real al arrastrar cualquier tarjeta por el lienzo.

### 📱 5. Diseño 100% Responsivo
- **Mobile Drawers**: El Árbol de Archivos y la Ficha Técnica se transforman en cajones sobrepuestos con fondo desenfocado en teléfonos y tablets.
- **Toolbars Táctiles**: Menús con desplazamiento horizontal táctil para evitar cortes de texto o desbordamientos.

### ☁️ 6. Sincronización en la Nube con MongoDB Atlas
- **Persistencia Multi-Dispositivo**: Guarda tus proyectos y snapshots en tu cuenta de usuario para acceder exactamente a la misma información desde tu computador o celular.

---

## 🛠️ Estructura del Proyecto

```bash
project-architecture-os/
├── api/                      # Vercel Serverless Function Handler
│   └── index.js              # Express API en Vercel con MongoDB Atlas
├── public/
│   └── logo.png              # Logo Oficial de Arkhet
├── server/                   # Servidor Express Node.js Independiente
│   ├── models/
│   │   ├── User.js           # Esquema Mongoose de Usuarios
│   │   └── Project.js        # Esquema Mongoose de Proyectos
│   ├── .env.example          # Plantilla de Variables de Entorno
│   └── index.js              # Servidor API REST
├── src/
│   ├── components/           # Componentes UI de React 19
│   │   ├── ArchitectureGraph.tsx     # Grafo Interactivo Canvas SVG
│   │   ├── RadarView.tsx             # Vista Principal Mapa Mental
│   │   ├── FolderTreeSidebar.tsx     # Árbol de Directorios
│   │   ├── TechSpecSidebar.tsx       # Ficha Técnica Inspector
│   │   ├── GitAuthModal.tsx          # Autenticación Nube & Git
│   │   └── GitRepoSuggestionsModal.tsx # Explorador de Repositorios
│   ├── services/
│   │   ├── apiClient.ts      # Cliente de Sincronización Nube
│   │   ├── githubApi.ts      # Integración con GitHub API
│   │   └── scanner.ts        # Motor Parser de Código Local y GitHub
│   └── App.tsx               # Aplicación Principal
├── vercel.json               # Configuración de Despliegue en Vercel
└── package.json
```

---

## 🚀 Inicio Rápido Local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/Sebaxis07/arkhet.git
cd arkhet
npm install
```

### 2. Iniciar el servidor de desarrollo Vite
```bash
npm run dev
```
Abre en tu navegador: **`http://localhost:5174`**

### 3. (Opcional) Iniciar el servidor Backend con MongoDB Atlas
```bash
cd server
npm install
node index.js
```

---

## ☁️ Variables de Entorno para MongoDB Atlas

En tu servidor backend (`server/.env`) o en las variables de entorno de **Vercel**, configura:

```env
MONGODB_URI=mongodb+srv://Sebaxx:Dpastora2@inkdb.prnwk92.mongodb.net/arkhet_db?retryWrites=true&w=majority&appName=InkDB
JWT_SECRET=arkhet_architecture_os_secret_jwt_key_2026
```

---

## 🌐 Despliegue en Vercel

Arkhet está listo para ser desplegado con un solo clic en **Vercel**:

1. Sube este repositorio a tu cuenta de GitHub.
2. Importa el proyecto en [vercel.com](https://vercel.com).
3. Añade la variable `MONGODB_URI` en **Environment Variables**.
4. Haz clic en **Deploy**.

---

<div align="center">
  <sub>Desarrollado para <strong>@Sebaxis07</strong> • ARKHET Operating System</sub>
</div>
