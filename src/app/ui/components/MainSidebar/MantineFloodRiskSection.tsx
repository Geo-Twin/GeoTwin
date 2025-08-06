import React, { useState } from 'react';
import {
  Accordion,
  Stack,
  Box,
  ActionIcon,
  UnstyledButton,
  Flex,
  Text
} from '@mantine/core';
import {
  IconBolt,
  IconEye,
  IconChartBar,
  IconChevronDown
} from '@tabler/icons-react';
import MantineFloodSimulationPanel from '~/app/ui/components/FloodDashboard/MantineFloodSimulationPanel';
import FloodControls from '~/app/ui/components/FloodDashboard/FloodControls';
import { FloodMetrics } from '../OriginUI/FloodMetrics';

const MantineFloodRiskSection: React.FC = () => {
  const [openSections, setOpenSections] = useState<string[]>(['simulation-parameters']);

  const toggleSection = (sectionId: string): void => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <Stack spacing={8}>
      <Stack spacing={8}>
        {/* Simulation Parameters Section */}
        <Box
          style={{
            backgroundColor: '#23293a',
            border: '1px solid #4a5568',
            borderRadius: '8px',
            marginBottom: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{
              padding: '12px 16px',
              minHeight: '40px',
              cursor: 'pointer'
            }}
            onClick={(): void => toggleSection('simulation-parameters')}
          >
            <UnstyledButton
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                padding: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
              }}
              onClick={(e): void => {
                e.stopPropagation();
                toggleSection('simulation-parameters');
              }}
            >
              <IconBolt size={18} />
              <Text size="md" weight={600} color="white" style={{ fontFamily: "'Inter', 'Roboto', system-ui, sans-serif" }}>
                Simulation Parameters
              </Text>
            </UnstyledButton>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={(e): void => {
                e.stopPropagation();
                toggleSection('simulation-parameters');
              }}
              style={{
                color: '#ffffff',
                transform: openSections.includes('simulation-parameters') ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <IconChevronDown size={12} />
            </ActionIcon>
          </Flex>

          {openSections.includes('simulation-parameters') && (
            <Box style={{ padding: '16px 20px' }}>
              <MantineFloodSimulationPanel />
            </Box>
          )}
        </Box>

        {/* Visualization Controls Section */}
        <Box
          style={{
            backgroundColor: '#2d3748',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            marginBottom: '2px'
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{
              padding: '4px 6px',
              minHeight: '24px',
              cursor: 'pointer'
            }}
            onClick={(): void => toggleSection('visualization-controls')}
          >
            <UnstyledButton
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
                padding: 0,
                fontSize: '11px',
                fontWeight: 500,
                color: '#ffffff'
              }}
              onClick={(e): void => {
                e.stopPropagation();
                toggleSection('visualization-controls');
              }}
            >
              <IconEye size={8} />
              <Text size="xs" weight={500} color="white">
                Visualization Controls
              </Text>
            </UnstyledButton>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={(e): void => {
                e.stopPropagation();
                toggleSection('visualization-controls');
              }}
              style={{
                color: '#ffffff',
                transform: openSections.includes('visualization-controls') ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <IconChevronDown size={12} />
            </ActionIcon>
          </Flex>

          {openSections.includes('visualization-controls') && (
            <Box style={{ padding: '4px 6px' }}>
              <FloodControls />
            </Box>
          )}
        </Box>

        {/* Impact Analysis Section - DO NOT MODIFY THE CONTENT */}
        <Box
          style={{
            backgroundColor: '#2d3748',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            marginBottom: '2px'
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{
              padding: '4px 6px',
              minHeight: '24px',
              cursor: 'pointer'
            }}
            onClick={(): void => toggleSection('impact-analysis')}
          >
            <UnstyledButton
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
                padding: 0,
                fontSize: '11px',
                fontWeight: 500,
                color: '#ffffff'
              }}
              onClick={(e): void => {
                e.stopPropagation();
                toggleSection('impact-analysis');
              }}
            >
              <IconChartBar size={8} />
              <Text size="xs" weight={500} color="white">
                Impact Analysis
              </Text>
            </UnstyledButton>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={(e): void => {
                e.stopPropagation();
                toggleSection('impact-analysis');
              }}
              style={{
                color: '#ffffff',
                transform: openSections.includes('impact-analysis') ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <IconChevronDown size={12} />
            </ActionIcon>
          </Flex>

          {openSections.includes('impact-analysis') && (
            <Box style={{ padding: '4px 6px' }}>
              {/* CRITICAL: Do NOT modify FloodMetrics - it contains the perfect analysis result cards */}
              <FloodMetrics />
            </Box>
          )}
        </Box>
      </Stack>
    </Stack>
  );
};

export default MantineFloodRiskSection;
