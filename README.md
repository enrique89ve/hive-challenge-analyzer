# Hive Challenge Analyzer 🚀

Una aplicación web moderna para analizar desafíos de Hive blockchain, desarrollada con React + TypeScript y diseño terminal.

## 🎯 Características

- **Análisis Integral**: Muestra usuarios válidos, inválidos e ignorados con razones específicas
- **Análisis de Comentarios**: Utiliza dhive para obtener comentarios del blockchain
- **Análisis de Power-ups**: API directa para operaciones de delegación
- **Filtrado Inteligente**: Ignora automáticamente cuentas bot
- **Fechas UTC**: Manejo correcto de fechas sin adaptación de zona horaria
- **UI Terminal**: Diseño retro con estética de terminal verde

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Blockchain**: dhive library + Syncad Hafah API
- **Estilo**: TailwindCSS con tema terminal personalizado
- **Build**: Vite
- **Fecha**: date-fns
- **Iconos**: lucide-react

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/[tu-usuario]/hive-challenge-analyzer.git
cd hive-challenge-analyzer

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 🎮 Uso

1. **Seleccionar Fechas**: Elige el rango de fechas en formato UTC
2. **Analizar**: La aplicación buscará automáticamente comentarios y power-ups
3. **Revisar Resultados**:
   - ✅ Usuarios válidos (comentario + power-up)
   - ❌ Usuarios inválidos (con razón específica)
   - ⚠️ Usuarios ignorados (bots)

## 🔧 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── DateRangeSelector.tsx
│   ├── UserList.tsx
│   ├── StatusBar.tsx
│   └── ...
├── services/           # Lógica de negocio
│   └── hiveService.ts
├── types/              # Definiciones TypeScript
│   └── hive.ts
└── App.tsx            # Componente principal
```

## 🤖 Filtrado de Bots

La aplicación automáticamente ignora estas cuentas:

- hivebuzz
- peakd
- ecency
- 3speak
- liketu
- y otras cuentas de servicios conocidas

## � APIs Utilizadas

- **dhive**: Para comentarios del blockchain
- **Syncad Hafah API**: Para operaciones de power-up

## � Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## � Contacto

Desarrollado con ❤️ para la comunidad Hive
