import React from 'react';
import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import { geoTwinDesignTokens } from '~/app/ui/theme/geoTwinTheme';

// Extended interface that combines Mantine props with GeoTwin-specific props
interface GeoTwinButtonProps extends Omit<MantineButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'filled' | 'light' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

// Map GeoTwin variants to Mantine variants
const variantMapping = {
  primary: 'filled' as const,
  secondary: 'light' as const,
  ghost: 'subtle' as const,
  outline: 'outline' as const,
  filled: 'filled' as const,
  light: 'light' as const,
  subtle: 'subtle' as const,
};

export const Button: React.FC<GeoTwinButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  children,
  sx,
  ...props
}) => {
  const mantineVariant = variantMapping[variant] || 'filled';
  
  // Custom styles for GeoTwin theme
  const customStyles = {
    root: {
      fontWeight: geoTwinDesignTokens.typography.fontWeight.medium,
      borderRadius: geoTwinDesignTokens.borderRadius.md,
      
      // Primary variant custom styling
      ...(variant === 'primary' && {
        backgroundColor: geoTwinDesignTokens.colors.primary,
        borderColor: geoTwinDesignTokens.colors.primary,
        color: geoTwinDesignTokens.colors.text,
        
        '&:hover': {
          backgroundColor: geoTwinDesignTokens.colors.primaryHover,
          borderColor: geoTwinDesignTokens.colors.primaryHover,
        },
        
        '&:active': {
          backgroundColor: geoTwinDesignTokens.colors.primaryActive,
          borderColor: geoTwinDesignTokens.colors.primaryActive,
        },
      }),
      
      // Secondary variant custom styling
      ...(variant === 'secondary' && {
        backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
        borderColor: geoTwinDesignTokens.colors.border,
        color: geoTwinDesignTokens.colors.text,
        
        '&:hover': {
          backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
          borderColor: geoTwinDesignTokens.colors.borderLight,
        },
      }),
      
      // Outline variant custom styling
      ...(variant === 'outline' && {
        backgroundColor: 'transparent',
        borderColor: geoTwinDesignTokens.colors.border,
        color: geoTwinDesignTokens.colors.text,
        
        '&:hover': {
          backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
          borderColor: geoTwinDesignTokens.colors.primary,
        },
      }),
      
      // Ghost variant custom styling
      ...(variant === 'ghost' && {
        backgroundColor: 'transparent',
        border: 'none',
        color: geoTwinDesignTokens.colors.text,
        
        '&:hover': {
          backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
        },
      }),
      
      // Focus styles for accessibility
      '&:focus': {
        outline: `2px solid ${geoTwinDesignTokens.colors.primary}`,
        outlineOffset: '2px',
      },
      
      // Disabled styles
      '&:disabled': {
        opacity: 0.5,
        pointerEvents: 'none',
        backgroundColor: geoTwinDesignTokens.colors.backgroundTertiary,
        borderColor: geoTwinDesignTokens.colors.border,
        color: geoTwinDesignTokens.colors.textMuted,
      },
    },
    
    // Icon styles
    leftIcon: {
      marginRight: geoTwinDesignTokens.spacing.xs,
    },
    
    rightIcon: {
      marginLeft: geoTwinDesignTokens.spacing.xs,
    },
  };

  return (
    <MantineButton
      variant={mantineVariant}
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      leftIcon={icon && iconPosition === 'left' ? icon : undefined}
      rightIcon={icon && iconPosition === 'right' ? icon : undefined}
      sx={{
        ...customStyles,
        ...sx,
      }}
      {...props}
    >
      {children}
    </MantineButton>
  );
};

export default Button;
