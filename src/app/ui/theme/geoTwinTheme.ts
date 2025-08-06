import { MantineThemeOverride } from '@mantine/core';

// GeoTwin Design Tokens - Centralized theme configuration
export const geoTwinDesignTokens = {
  // Color Palette
  colors: {
    // Primary blue (existing #4a90e2)
    primary: '#4a90e2',
    primaryHover: '#357abd',
    primaryActive: '#2d6ba3',

    // Background colors (bluish-gray like VS Code)
    background: '#1e2328',        // Very dark bluish-gray
    backgroundSecondary: '#2d3748', // Medium bluish-gray
    backgroundTertiary: '#374151',  // Lighter bluish-gray

    // Text colors (high contrast white)
    text: '#ffffff',
    textSecondary: '#e2e8f0',     // Slightly off-white
    textMuted: '#a0aec0',         // Bluish-gray muted text
    
    // Accent colors
    accent: '#357abd',
    accentLight: '#4a90e2',
    
    // Status colors
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    
    // Border colors (bluish-gray borders)
    border: '#4a5568',
    borderLight: '#5a6578',
    borderDark: '#2d3748',
  },
  
  // Spacing Scale
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    xxl: '3rem',    // 48px
  },
  
  // Typography Scale
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      xxl: '1.5rem',   // 24px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Mantine Theme Configuration for GeoTwin
export const geoTwinTheme: MantineThemeOverride = {
  colorScheme: 'dark',
  
  // Custom color palette
  colors: {
    // Override dark colors for better contrast
    dark: [
      geoTwinDesignTokens.colors.text,           // 0: white text
      geoTwinDesignTokens.colors.textSecondary,  // 1: secondary text
      geoTwinDesignTokens.colors.textMuted,      // 2: muted text
      geoTwinDesignTokens.colors.borderLight,    // 3: light borders
      geoTwinDesignTokens.colors.border,         // 4: default borders
      geoTwinDesignTokens.colors.backgroundTertiary, // 5: tertiary bg
      geoTwinDesignTokens.colors.backgroundSecondary, // 6: secondary bg
      geoTwinDesignTokens.colors.background,     // 7: primary bg
      '#1a1a1a',                                 // 8: darker bg
      '#0a0a0a',                                 // 9: darkest bg
    ],
    
    // Primary blue color scale
    blue: [
      '#e3f2fd',
      '#bbdefb', 
      '#90caf9',
      '#64b5f6',
      geoTwinDesignTokens.colors.primary,        // 4: primary blue
      geoTwinDesignTokens.colors.primaryHover,   // 5: hover state
      geoTwinDesignTokens.colors.primaryActive,  // 6: active state
      '#1e4a73',
      '#0d3a5f',
      '#042a4b',
    ],
  },
  
  // Set primary color
  primaryColor: 'blue',
  primaryShade: { light: 4, dark: 4 },
  
  // Typography
  fontFamily: geoTwinDesignTokens.typography.fontFamily,
  fontSizes: geoTwinDesignTokens.typography.fontSize,
  lineHeight: geoTwinDesignTokens.typography.lineHeight.normal,
  
  headings: {
    fontFamily: geoTwinDesignTokens.typography.fontFamily,
    fontWeight: geoTwinDesignTokens.typography.fontWeight.semibold,
    sizes: {
      h1: { fontSize: geoTwinDesignTokens.typography.fontSize.xxl },
      h2: { fontSize: geoTwinDesignTokens.typography.fontSize.xl },
      h3: { fontSize: geoTwinDesignTokens.typography.fontSize.lg },
      h4: { fontSize: geoTwinDesignTokens.typography.fontSize.md },
      h5: { fontSize: geoTwinDesignTokens.typography.fontSize.sm },
      h6: { fontSize: geoTwinDesignTokens.typography.fontSize.xs },
    },
  },
  
  // Spacing
  spacing: geoTwinDesignTokens.spacing,
  
  // Border radius
  radius: geoTwinDesignTokens.borderRadius,
  
  // Shadows
  shadows: geoTwinDesignTokens.shadows,
  
  // Component-specific overrides
  components: {
    Accordion: {
      styles: (theme) => ({
        root: {
          backgroundColor: 'transparent',
        },
        item: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          border: `1px solid ${geoTwinDesignTokens.colors.border}`,
          borderRadius: geoTwinDesignTokens.borderRadius.sm,
          marginBottom: '2px',
          '&[data-active]': {
            backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          },
        },
        control: {
          backgroundColor: 'transparent',
          color: geoTwinDesignTokens.colors.text,
          padding: geoTwinDesignTokens.spacing.xs,
          minHeight: '28px',
          fontSize: geoTwinDesignTokens.typography.fontSize.sm,
          '&:hover': {
            backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
          },
        },
        label: {
          color: geoTwinDesignTokens.colors.text,
          fontWeight: geoTwinDesignTokens.typography.fontWeight.medium,
          fontSize: geoTwinDesignTokens.typography.fontSize.xs,
        },
        icon: {
          color: geoTwinDesignTokens.colors.primary,
        },
        chevron: {
          width: '8px !important',
          height: '8px !important',
          minWidth: '8px !important',
          minHeight: '8px !important',
          color: geoTwinDesignTokens.colors.textMuted,
          '& svg': {
            width: '8px !important',
            height: '8px !important',
          },
        },
        content: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
          padding: geoTwinDesignTokens.spacing.xs,
        },
      }),
    },

    Button: {
      styles: (theme) => ({
        root: {
          fontWeight: geoTwinDesignTokens.typography.fontWeight.medium,
          borderRadius: geoTwinDesignTokens.borderRadius.md,
          '&[data-variant="filled"]': {
            backgroundColor: geoTwinDesignTokens.colors.primary,
            color: geoTwinDesignTokens.colors.text,
            '&:hover': {
              backgroundColor: geoTwinDesignTokens.colors.primaryHover,
            },
            '&:active': {
              backgroundColor: geoTwinDesignTokens.colors.primaryActive,
            },
          },
          '&[data-variant="outline"]': {
            borderColor: geoTwinDesignTokens.colors.primary,
            color: geoTwinDesignTokens.colors.primary,
            '&:hover': {
              backgroundColor: 'rgba(74, 144, 226, 0.1)',
            },
          },
          '&[data-variant="light"]': {
            backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
            color: geoTwinDesignTokens.colors.text,
            '&:hover': {
              backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
            },
          },
        },
      }),
    },

    Card: {
      styles: (theme) => ({
        root: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderColor: geoTwinDesignTokens.colors.border,
          borderRadius: geoTwinDesignTokens.borderRadius.lg,
          border: `1px solid ${geoTwinDesignTokens.colors.border}`,
        },
      }),
    },

    TextInput: {
      styles: (theme) => ({
        input: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderColor: geoTwinDesignTokens.colors.border,
          color: geoTwinDesignTokens.colors.text,
          '&::placeholder': {
            color: geoTwinDesignTokens.colors.textSecondary,
          },
          '&:focus': {
            borderColor: geoTwinDesignTokens.colors.primary,
          },
        },
      }),
    },

    Select: {
      styles: (theme) => ({
        input: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderColor: geoTwinDesignTokens.colors.border,
          color: geoTwinDesignTokens.colors.text,
          '&:focus': {
            borderColor: geoTwinDesignTokens.colors.primary,
          },
        },
        dropdown: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderColor: geoTwinDesignTokens.colors.border,
        },
        item: {
          color: geoTwinDesignTokens.colors.text,
          '&[data-selected]': {
            backgroundColor: geoTwinDesignTokens.colors.primary,
            color: geoTwinDesignTokens.colors.text,
          },
          '&[data-hovered]': {
            backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
          },
        },
      }),
    },

    ActionIcon: {
      styles: (theme) => ({
        root: {
          '&[data-variant="subtle"]': {
            color: geoTwinDesignTokens.colors.text,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      }),
    },

    Modal: {
      styles: (theme) => ({
        modal: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderRadius: geoTwinDesignTokens.borderRadius.lg,
        },
        header: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderBottom: `1px solid ${geoTwinDesignTokens.colors.border}`,
        },
      }),
    },

    Navbar: {
      styles: (theme) => ({
        root: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderColor: geoTwinDesignTokens.colors.border,
        },
      }),
    },

    Paper: {
      styles: (theme) => ({
        root: {
          backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
          borderColor: geoTwinDesignTokens.colors.border,
          border: `1px solid ${geoTwinDesignTokens.colors.border}`,
          color: geoTwinDesignTokens.colors.text,
        },
      }),
    },

    UnstyledButton: {
      styles: (theme) => ({
        root: {
          color: geoTwinDesignTokens.colors.text,
          '&:hover': {
            backgroundColor: 'var(--mantine-color-dark-5)',
          },
        },
      }),
    },
  },
  
  // Global styles
  globalStyles: (theme) => ({
    body: {
      backgroundColor: geoTwinDesignTokens.colors.background,
      color: geoTwinDesignTokens.colors.text,
      fontFamily: geoTwinDesignTokens.typography.fontFamily,
    },
    
    // Ensure high contrast for accessibility
    '*': {
      '&:focus': {
        outline: `2px solid ${geoTwinDesignTokens.colors.primary}`,
        outlineOffset: '2px',
      },
    },
  }),
};
