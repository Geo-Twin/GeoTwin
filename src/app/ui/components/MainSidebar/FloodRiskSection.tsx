import React, { useState } from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { IconBolt, IconEye, IconChartBar, IconChevronDown } from '@tabler/icons-react';
import MantineFloodSimulationPanel from '../FloodDashboard/MantineFloodSimulationPanel';
import FloodControls from '../FloodDashboard/FloodControls';
import FloodMetrics from '../FloodDashboard/FloodMetrics';

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

const FloodRiskSection: React.FC = () => {
  const [openSections, setOpenSections] = useState<string[]>(['simulation-parameters']);

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
        title="Simulation Parameters"
        icon={<IconBolt size={18} color="#ffffff" />}
        isOpen={openSections.includes('simulation-parameters')}
        onToggle={(): void => toggleSection('simulation-parameters')}
      >
        <MantineFloodSimulationPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="Visualization Controls"
        icon={<IconEye size={18} color="#ffffff" />}
        isOpen={openSections.includes('visualization-controls')}
        onToggle={(): void => toggleSection('visualization-controls')}
      >
        <FloodControls />
      </CollapsibleSection>

      <CollapsibleSection
        title="Impact Analysis"
        icon={<IconChartBar size={18} color="#ffffff" />}
        isOpen={openSections.includes('impact-analysis')}
        onToggle={(): void => toggleSection('impact-analysis')}
      >
        {/* CRITICAL: Do NOT modify FloodMetrics - it contains the perfect analysis result cards */}
        <FloodMetrics />
      </CollapsibleSection>
    </Stack>
  );
};

export default FloodRiskSection;
