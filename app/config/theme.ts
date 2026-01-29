/**
 * CONFIGURACIÓN GLOBAL DE TIENDA
 * Adaptado para TiendaNube
 * 
 * Modifica estos valores para cambiar toda la tienda
 */

export const themeConfig = {
  // COLORES
  colors: {
    primary: '#000000',      // Color principal (botones, textos)
    secondary: '#ffffff',    // Color secundario (fondos)
    accent: '#f0f0f0',       // Color acentuado (bordes, divisores)
    text: '#000000',         // Texto principal
    textLight: '#666666',    // Texto secundario
    textVeryLight: '#999999', // Texto terciario
    background: '#ffffff',   // Fondo general
  },

  // TIPOGRAFÍA
  typography: {
    fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    fontSize: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '32px',
    },
    letterSpacing: {
      tight: '0px',
      normal: '0.5px',
      wide: '1px',
      extrawide: '2px',
    },
  },

  // ESPACIADO
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '30px',
    '2xl': '40px',
    '3xl': '60px',
    '4xl': '80px',
  },

  // BORDES Y RADIOS
  borders: {
    radius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    width: {
      light: '1px',
      normal: '2px',
      bold: '3px',
    },
    color: '#f0f0f0',
  },

  // SOMBRAS
  shadows: {
    light: '0 1px 3px rgba(0,0,0,0.1)',
    normal: '0 4px 12px rgba(0,0,0,0.1)',
    medium: '0 10px 30px rgba(0,0,0,0.1)',
    dark: '0 20px 40px rgba(0,0,0,0.15)',
  },

  // TRANSICIONES
  transitions: {
    fast: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // BREAKPOINTS (Responsive)
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1400px',
  },

  // COMPONENTES
  components: {
    header: {
      height: '70px',
      sticky: true,
    },
    footer: {
      bgColor: '#ffffff',
      borderTop: '1px solid #f0f0f0',
    },
    button: {
      padding: '10px 20px',
      fontSize: '12px',
      fontWeight: 700,
      borderRadius: '4px',
      transition: 'all 0.2s ease',
    },
    input: {
      padding: '10px 15px',
      fontSize: '12px',
      borderRadius: '4px',
      borderColor: '#ddd',
    },
  },

  // ANIMACIONES
  animations: {
    slideUp: {
      from: 'transform: translateY(20px); opacity: 0;',
      to: 'transform: translateY(0); opacity: 1;',
      duration: '0.6s',
    },
    fadeIn: {
      from: 'opacity: 0;',
      to: 'opacity: 1;',
      duration: '0.4s',
    },
    slideIn: {
      from: 'transform: translateX(-20px); opacity: 0;',
      to: 'transform: translateX(0); opacity: 1;',
      duration: '0.5s',
    },
  },

  // PRODUCTO
  product: {
    gridColumns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
    imageAspectRatio: '3/4',
    hoverScale: 1.05,
  },

  // CARRITO Y CHECKOUT
  cart: {
    primaryColor: '#000000',
    buttonText: 'Agregar al carrito',
    ctaText: 'Comprar ahora',
  },

  // TIENDANUBE
  tiendaNube: {
    // Estos valores se obtienen de MongoDB, pero aquí están los defaults
    defaultStoreId: '5112334',
    apiPerPage: 200,
    cacheTTL: 60, // segundos
  },
};

/**
 * Generar CSS personalizado basado en el tema
 */
export function generateThemeCSS(): string {
  const { colors, typography, spacing } = themeConfig;
  
  return `
    :root {
      --primary-color: ${colors.primary};
      --secondary-color: ${colors.secondary};
      --accent-color: ${colors.accent};
      --text-color: ${colors.text};
      --text-light: ${colors.textLight};
      --text-very-light: ${colors.textVeryLight};
      --background: ${colors.background};
      
      --font-family: ${typography.fontFamily};
      --spacing-xs: ${spacing.xs};
      --spacing-sm: ${spacing.sm};
      --spacing-md: ${spacing.md};
      --spacing-lg: ${spacing.lg};
      --spacing-xl: ${spacing.xl};
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--font-family);
      color: var(--text-color);
      background: var(--background);
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
}
