# Sistema de Control Escolar

Sistema web para la gestión de grupos escolares, control de alumnos y registro de asistencias.

## Requisitos

- Node.js
- Angular CLI
- MySQL

## Instalación

1. **Clonar e instalar dependencias**
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd maestros_angular

# Instalar dependencias del proyecto
npm install

# Instalar dependencias del backend
cd backend-auth
npm install
```

## Ejecutar el Proyecto

1. **Iniciar Backend**
```bash
cd backend-auth
npm start
```

2. **Iniciar Frontend** (en una nueva terminal)
```bash
cd maestros_angular
ng serve
```

La aplicación estará disponible en:
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5001`

## Funcionalidades

- ✏️ Gestión de grupos escolares
- 👥 Control de alumnos
- ✓ Registro de asistencias
- 📊 Reportes en PDF
- 🌓 Modo oscuro/claro

## Desarrollado con

- Angular 19.0.2
- Node.js
- MySQL
