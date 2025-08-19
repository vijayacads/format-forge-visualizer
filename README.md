# Format Forge Visualizer

A powerful template-based form builder with real-time preview and responsive design capabilities.

## 🚀 Version 2.0 Release (Latest)

### ✨ Major Features & Improvements

#### 🎯 **Complete Positioning System Overhaul**
- **Responsive Field Positioning**: Fields now scale proportionally with the template image across all screen sizes
- **Coordinate System Optimization**: Fixed coordinate system mismatches between `offsetTop`/`offsetLeft` and `getBoundingClientRect()`
- **Transform-Based Positioning**: Implemented GPU-accelerated `transform: translate()` for smooth field positioning
- **Cross-Platform Consistency**: Fields maintain visual consistency between desktop and mobile views

#### 🔧 **Advanced Debugging System**
- **Comprehensive Debug Tools**: Added multiple debug buttons for troubleshooting positioning issues
- **Real-Time CSS Inspection**: Check computed styles and detect CSS conflicts
- **Cache Busting**: Built-in cache clearing and force re-render capabilities
- **Position Calculation Logging**: Detailed logging of percentage-to-pixel conversions

#### 📱 **Enhanced Responsive Design**
- **Proportional Scaling**: Fields automatically scale with image dimensions
- **Viewport Adaptation**: Seamless switching between desktop and mobile layouts
- **Touch-Friendly Interface**: Optimized for mobile interactions
- **Flexible Layout System**: Adaptive container sizing and positioning

#### 🎨 **UI/UX Improvements**
- **Modern Component Library**: Enhanced shadcn/ui integration
- **Improved Field Overlays**: Better visual feedback and interaction states
- **Template Preview Enhancements**: Real-time preview with accurate positioning
- **Admin Interface**: Streamlined template management

### 🔍 **Technical Improvements**

#### **Positioning Engine**
```typescript
// New proportional scaling system
const getDisplayPositions = () => {
  return Object.entries(currentTemplate.fieldPositions).reduce((acc, [fieldId, position]) => {
    const pixelPosition = percentagesToPixels(position, displayedDimensions);
    return { ...acc, [fieldId]: pixelPosition };
  }, {});
};
```

#### **Debug System**
- **Cache Bust Button**: Force complete re-render with timestamp
- **CSS Conflict Detection**: Real-time CSS style inspection
- **Comprehensive Debug**: All-in-one positioning analysis
- **Field Overlay Debug**: Individual field positioning verification

#### **Performance Optimizations**
- **Memoization**: Prevented unnecessary recalculations
- **GPU Acceleration**: Transform-based positioning for smooth animations
- **Efficient Re-renders**: Optimized React component updates

### 🐛 **Bug Fixes**
- Fixed field positioning outside viewport issues
- Resolved coordinate system mismatches
- Corrected CSS transform interpretation
- Fixed mobile/desktop positioning inconsistencies

### 📋 **Previous Versions**

#### Version 1.5.1
- Basic template management
- Initial positioning system
- OCR integration
- Supabase backend

#### Version 1.0
- Core form builder functionality
- Template upload system
- Basic preview capabilities

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/vijayacads/format-forge-visualizer.git

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env file with your actual values:
# VITE_ADMIN_EMAIL=your_admin_email
# VITE_ADMIN_PASSWORD=your_admin_password
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev

## 🧪 Test Environment Setup

For safe testing without affecting production data, see [TEST_ENVIRONMENT_SETUP.md](./TEST_ENVIRONMENT_SETUP.md)

```bash
# Set up test environment
npm run dev:test
```
```

## 🚀 Quick Start

1. **Upload Template**: Drag and drop your template image
2. **Add Fields**: Click to add form fields on the template
3. **Preview**: See real-time preview with responsive scaling
4. **Export**: Generate forms with accurate field positioning

## 🔧 Development

### Key Components
- `TemplatePreview.tsx`: Main preview container with positioning logic
- `TemplateRenderer.tsx`: Field positioning and rendering engine
- `FieldOverlay.tsx`: Individual field overlay components
- `positionUtils.ts`: Coordinate conversion utilities

### Debug Tools
Use the debug buttons in the admin interface to:
- **Comprehensive Debug**: Full positioning analysis
- **Cache Bust**: Force re-render and clear cache
- **Check CSS Conflicts**: Inspect computed styles

## 📱 Responsive Design

The application now features:
- **Proportional Scaling**: Fields scale with image dimensions
- **Cross-Platform Consistency**: Same visual experience on all devices
- **Touch Optimization**: Mobile-friendly interactions
- **Adaptive Layouts**: Automatic layout adjustments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with debug tools
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Version 2.0** represents a major milestone with a complete positioning system overhaul, comprehensive debugging tools, and enhanced responsive design capabilities. The application now provides a seamless experience across all devices with accurate field positioning and real-time preview functionality.
