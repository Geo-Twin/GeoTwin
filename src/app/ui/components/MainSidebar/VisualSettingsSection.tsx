import React, { useState } from 'react';
import { Box, Text, Stack, Group } from '@mantine/core';
import { IconDeviceDesktop, IconMap, IconBookmark, IconInfoCircle, IconChevronDown } from '@tabler/icons-react';
import SidebarSettingsPanel from './SidebarSettingsPanel';
import CompassPanel from '../CompassPanel';
import GeolocationButton from '../GeolocationButton';
import MantineSavedPlacesPanel from '../SavedPlacesModalPanel/MantineSavedPlacesPanel';
import DataTimestamp from '../DataTimestamp';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children
}) => {
  return (
    <Box
      style={{
        backgroundColor: '#2d3748', // Match SelectionPanel background
        border: '1px solid #3a4553', // Match SelectionPanel border
        borderRadius: '12px', // Match SelectionPanel border-radius
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', // Enhanced shadow like SelectionPanel
        fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
      }}
    >
      <Box
        onClick={onToggle}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isOpen ? '1px solid #3a4553' : 'none',
          borderRadius: isOpen ? '12px 12px 0 0' : '12px',
          transition: 'background-color 0.2s ease',
          ':hover': {
            backgroundColor: 'rgba(74, 144, 226, 0.05)'
          }
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon}
          <Text
            style={{
              color: '#ffffff',
              fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {title}
          </Text>
        </Box>
        <IconChevronDown
          size={16}
          style={{
            color: '#4a90e2', // Use SelectionPanel blue color
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </Box>
      {isOpen && (
        <Box style={{
          padding: '20px',
          borderRadius: '0 0 12px 12px'
        }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

const VisualSettingsSection: React.FC = () => {
  const [openSections, setOpenSections] = useState<string[]>(['display-settings']);

  const toggleSection = (sectionId: string): void => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <Stack style={{ gap: '12px' }}>
      <CollapsibleSection
        title="Display Settings"
        icon={<IconDeviceDesktop size={18} color="#ffffff" />}
        isOpen={openSections.includes('display-settings')}
        onToggle={(): void => toggleSection('display-settings')}
      >
        <SidebarSettingsPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="Navigation"
        icon={<IconMap size={18} color="#ffffff" />}
        isOpen={openSections.includes('navigation')}
        onToggle={(): void => toggleSection('navigation')}
      >
        <Box
          style={{
            backgroundColor: '#23293a', // Slightly darker for sub-sections
            padding: '16px',
            borderRadius: '8px', // Smaller radius for sub-sections
            border: '1px solid #3a4553'
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              marginBottom: '16px',
              fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            Navigation Controls
          </Text>
          {/* Horizontal layout for navigation buttons with individual cards */}
          <Box style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '16px',
            width: '100%'
          }}>
            {/* Compass Card - matching SelectionPanel card styling */}
            <Box style={{
              backgroundColor: '#2d3748', // Match SelectionPanel card background
              border: '1px solid #3a4553', // Match SelectionPanel border
              borderRadius: '8px', // Consistent with SelectionPanel sub-sections
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              maxWidth: '120px'
            }}>
              <CompassPanel />
              <Text style={{
                fontSize: '11px',
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                Look North
              </Text>
            </Box>

            {/* GeolocationButton Card - matching SelectionPanel card styling */}
            <Box style={{
              backgroundColor: '#2d3748', // Match SelectionPanel card background
              border: '1px solid #3a4553', // Match SelectionPanel border
              borderRadius: '8px', // Consistent with SelectionPanel sub-sections
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              maxWidth: '120px'
            }}>
              <GeolocationButton />
              <Text style={{
                fontSize: '11px',
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                My Location
              </Text>
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>

      <CollapsibleSection
        title="Saved Places"
        icon={<IconBookmark size={18} color="#ffffff" />}
        isOpen={openSections.includes('saved-places')}
        onToggle={(): void => toggleSection('saved-places')}
      >
        <Box
          style={{
            backgroundColor: '#23293a', // Slightly darker for sub-sections
            padding: '16px',
            borderRadius: '8px', // Smaller radius for sub-sections
            border: '1px solid #3a4553'
          }}
        >
          <MantineSavedPlacesPanel />
        </Box>
      </CollapsibleSection>

      <CollapsibleSection
        title="Information"
        icon={<IconInfoCircle size={18} color="#ffffff" />}
        isOpen={openSections.includes('information')}
        onToggle={(): void => toggleSection('information')}
      >
        <Stack style={{ gap: '16px' }}>
          <Box
            style={{
              backgroundColor: '#23293a', // Slightly darker for sub-sections
              padding: '16px',
              borderRadius: '8px', // Smaller radius for sub-sections
              border: '1px solid #3a4553'
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Data Status
            </Text>
            <DataTimestamp />
          </Box>

          <Box
            style={{
              backgroundColor: '#23293a', // Slightly darker for sub-sections
              padding: '16px',
              borderRadius: '8px', // Smaller radius for sub-sections
              border: '1px solid #3a4553'
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Platform Information
            </Text>
            <Text
              style={{
                color: '#ffffff',
                lineHeight: 1.4,
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px'
              }}
            >
              GeoTwin is an advanced 3D flood risk communication platform
              specifically designed for Dominica.
            </Text>
          </Box>

          <Box
            style={{
              backgroundColor: '#23293a', // Slightly darker for sub-sections
              padding: '16px',
              borderRadius: '8px', // Smaller radius for sub-sections
              border: '1px solid #3a4553'
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Data Sources
            </Text>
            <Stack style={{ gap: '4px' }}>
              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px'
              }}>
                • OpenStreetMap (Geographic Data)
              </Text>
              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px'
              }}>
                • COP30 (Elevation Model)
              </Text>
              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px'
              }}>
                • FastFlood API (Flood Simulation)
              </Text>
            </Stack>
          </Box>

          <Box
            style={{
              backgroundColor: '#23293a', // Slightly darker for sub-sections
              padding: '16px',
              borderRadius: '8px', // Smaller radius for sub-sections
              border: '1px solid #3a4553'
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Controls Reference
            </Text>
            <Stack style={{ gap: '8px' }}>
              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500
              }}>
                Camera Movement:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                W A S D keys (hold Shift for faster movement) or drag with left mouse button
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px'
              }}>
                Camera View:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                Q E R F keys or drag with right mouse button to look around
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px'
              }}>
                Zoom:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                Middle mouse button for 2x zoom
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px'
              }}>
                Camera Mode:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                Tab key to switch between ground view (default) and free camera mode
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px'
              }}>
                Reset View:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                Ctrl + P to refresh the map
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px'
              }}>
                Hide Interface:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                Ctrl + U to toggle menu visibility
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px'
              }}>
                Flood Area Selection:
              </Text>
              <Text style={{
                color: '#a0a0a0',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                Ctrl + B to select flood simulation area
              </Text>

              <Text style={{
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '8px'
              }}>
                GitHub Repository:
              </Text>
              <Box style={{ marginLeft: '8px', marginTop: '4px' }}>
                <Text
                  component="a"
                  href="https://github.com/AzyAli/GeoTwin"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#4a90e2',
                    fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
                    fontSize: '12px',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                    (e.target as HTMLAnchorElement).style.color = '#357abd';
                    (e.target as HTMLAnchorElement).style.borderBottomColor = '#357abd';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                    (e.target as HTMLAnchorElement).style.color = '#4a90e2';
                    (e.target as HTMLAnchorElement).style.borderBottomColor = 'transparent';
                  }}
                >
                  https://github.com/AzyAli/GeoTwin
                </Text>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CollapsibleSection>
    </Stack>
  );
};

export default VisualSettingsSection;
