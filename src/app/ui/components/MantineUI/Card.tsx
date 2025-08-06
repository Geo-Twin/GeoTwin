import React from 'react';
import { Card as MantineCard, CardProps as MantineCardProps, Text, Group } from '@mantine/core';
import { geoTwinDesignTokens } from '~/app/ui/theme/geoTwinTheme';

interface GeoTwinCardProps extends MantineCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const Card: React.FC<GeoTwinCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  sx,
  ...props
}) => {
  const customStyles = {
    root: {
      backgroundColor: geoTwinDesignTokens.colors.backgroundSecondary,
      borderColor: geoTwinDesignTokens.colors.border,
      borderRadius: geoTwinDesignTokens.borderRadius.lg,
      border: `1px solid ${geoTwinDesignTokens.colors.border}`,
      boxShadow: geoTwinDesignTokens.shadows.sm,
    },
  };

  return (
    <MantineCard
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      sx={{
        ...customStyles,
        ...sx,
      }}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <MantineCard.Section withBorder inheritPadding py="xs">
          <Group position="apart" align="flex-start">
            <div>
              {title && (
                <Text
                  weight={600}
                  size="lg"
                  color={geoTwinDesignTokens.colors.text}
                  mb={subtitle ? 4 : 0}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  size="sm"
                  color={geoTwinDesignTokens.colors.textSecondary}
                >
                  {subtitle}
                </Text>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </Group>
        </MantineCard.Section>
      )}
      
      <MantineCard.Section inheritPadding py="xs">
        {children}
      </MantineCard.Section>
    </MantineCard>
  );
};

export default Card;
