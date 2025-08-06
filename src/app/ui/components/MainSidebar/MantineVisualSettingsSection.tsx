// import React, { useState } from 'react';
// import {
//   Accordion,
//   Card,
//   Button,
//   Text,
//   Group,
//   Stack,
//   Box,
//   Center,
//   ActionIcon,
//   UnstyledButton,
//   Flex
// } from '@mantine/core';
// import {
//   IconDeviceDesktop,
//   IconMap,
//   IconBookmark,
//   IconInfoCircle,
//   IconRefresh,
//   IconChevronDown
// } from '@tabler/icons-react';
// import SidebarSettingsPanel from './SidebarSettingsPanel';
// import MantineSavedPlacesPanel from '~/app/ui/components/SavedPlacesModalPanel/MantineSavedPlacesPanel';
// import CompassPanel from '~/app/ui/components/CompassPanel';
// import GeolocationButton from '~/app/ui/components/GeolocationButton';
// import DataTimestamp from '~/app/ui/components/DataTimestamp';

// const MantineVisualSettingsSection: React.FC = () => {
//   const [openSections, setOpenSections] = useState<string[]>(['display-settings']);

//   const toggleSection = (sectionId: string): void => {
//     setOpenSections(prev =>
//       prev.includes(sectionId)
//         ? prev.filter(id => id !== sectionId)
//         : [...prev, sectionId]
//     );
//   };

//   return (
//     <Stack spacing={8}>
//       <Stack spacing={8}>
//         {/* Display Settings Section */}
//         <Box
//           style={{
//             backgroundColor: '#23293a',
//             border: '1px solid #4a5568',
//             borderRadius: '8px',
//             marginBottom: '8px',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//           }}
//         >
//           <Flex
//             justify="space-between"
//             align="center"
//             style={{
//               padding: '12px 16px',
//               minHeight: '40px',
//               cursor: 'pointer'
//             }}
//             onClick={(): void => toggleSection('display-settings')}
//           >
//             <UnstyledButton
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '12px',
//                 flex: 1,
//                 padding: 0,
//                 fontSize: '14px',
//                 fontWeight: 600,
//                 color: '#ffffff',
//                 fontFamily: "'Inter', 'Roboto', system-ui, sans-serif"
//               }}
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('display-settings');
//               }}
//             >
//               <IconDeviceDesktop size={18} />
//               <Text size="md" weight={600} color="white" style={{ fontFamily: "'Inter', 'Roboto', system-ui, sans-serif" }}>
//                 Display Settings
//               </Text>
//             </UnstyledButton>
//             <ActionIcon
//               variant="subtle"
//               size="xs"
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('display-settings');
//               }}
//               style={{
//                 color: '#ffffff',
//                 transform: openSections.includes('display-settings') ? 'rotate(180deg)' : 'rotate(0deg)',
//                 transition: 'transform 0.2s ease'
//               }}
//             >
//               <IconChevronDown size={12} />
//             </ActionIcon>
//           </Flex>

//           {openSections.includes('display-settings') && (
//             <Box style={{ padding: '16px 20px' }}>
//               <SidebarSettingsPanel />
//             </Box>
//           )}
//         </Box>

//         {/* Navigation Section */}
//         <Box
//           style={{
//             backgroundColor: '#23293a',
//             border: '1px solid #4a5568',
//             borderRadius: '8px',
//             marginBottom: '8px',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//           }}
//         >
//           <Flex
//             justify="space-between"
//             align="center"
//             style={{
//               padding: '12px 16px',
//               minHeight: '40px',
//               cursor: 'pointer'
//             }}
//             onClick={(): void => toggleSection('navigation')}
//           >
//             <UnstyledButton
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '4px',
//                 flex: 1,
//                 padding: 0,
//                 fontSize: '11px',
//                 fontWeight: 500,
//                 color: '#ffffff'
//               }}
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('navigation');
//               }}
//             >
//               <IconMap size={8} />
//               <Text size="xs" weight={500} color="white">
//                 Navigation
//               </Text>
//             </UnstyledButton>
//             <ActionIcon
//               variant="subtle"
//               size="xs"
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('navigation');
//               }}
//               style={{
//                 color: '#ffffff',
//                 transform: openSections.includes('navigation') ? 'rotate(180deg)' : 'rotate(0deg)',
//                 transition: 'transform 0.2s ease'
//               }}
//             >
//               <IconChevronDown size={12} />
//             </ActionIcon>
//           </Flex>

//           {openSections.includes('navigation') && (
//             <Box style={{ padding: '4px 6px' }}>
//               <Stack spacing={4}>
//                 <Card padding={8} style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
//                   <Stack spacing={4}>
//                     <Group spacing={4} align="center">
//                       <IconDeviceDesktop size={10} color="var(--mantine-color-blue-4)" />
//                       <Text size="xs" weight={500} c="white">
//                         Compass
//                       </Text>
//                     </Group>
//                     <Center>
//                       <CompassPanel />
//                     </Center>
//                   </Stack>
//                 </Card>

//                 <Card padding={8} style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
//                   <Stack spacing={4}>
//                     <Group spacing={4} align="center">
//                       <IconMap size={10} color="var(--mantine-color-blue-4)" />
//                       <Text size="xs" weight={500} c="white">
//                         My Location
//                       </Text>
//                     </Group>
//                     <GeolocationButton />
//                   </Stack>
//                 </Card>
//               </Stack>
//             </Box>
//           )}
//         </Box>

//         {/* Saved Places Section */}
//         <Box
//           style={{
//             backgroundColor: '#2d3748',
//             border: '1px solid #4a5568',
//             borderRadius: '4px',
//             marginBottom: '2px'
//           }}
//         >
//           <Flex
//             justify="space-between"
//             align="center"
//             style={{
//               padding: '4px 6px',
//               minHeight: '24px',
//               cursor: 'pointer'
//             }}
//             onClick={(): void => toggleSection('saved-places')}
//           >
//             <UnstyledButton
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '4px',
//                 flex: 1,
//                 padding: 0,
//                 fontSize: '11px',
//                 fontWeight: 500,
//                 color: '#ffffff'
//               }}
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('saved-places');
//               }}
//             >
//               <IconBookmark size={8} />
//               <Text size="xs" weight={500} color="white">
//                 Saved Places
//               </Text>
//             </UnstyledButton>
//             <ActionIcon
//               variant="subtle"
//               size="xs"
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('saved-places');
//               }}
//               style={{
//                 color: '#ffffff',
//                 transform: openSections.includes('saved-places') ? 'rotate(180deg)' : 'rotate(0deg)',
//                 transition: 'transform 0.2s ease'
//               }}
//             >
//               <IconChevronDown size={12} />
//             </ActionIcon>
//           </Flex>

//           {openSections.includes('saved-places') && (
//             <Box style={{ padding: '4px 6px' }}>
//               <Card padding={8} style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
//                 <MantineSavedPlacesPanel />
//               </Card>
//             </Box>
//           )}
//         </Box>

//         {/* Information Section */}
//         <Box
//           style={{
//             backgroundColor: '#2d3748',
//             border: '1px solid #4a5568',
//             borderRadius: '4px',
//             marginBottom: '2px'
//           }}
//         >
//           <Flex
//             justify="space-between"
//             align="center"
//             style={{
//               padding: '4px 6px',
//               minHeight: '24px',
//               cursor: 'pointer'
//             }}
//             onClick={(): void => toggleSection('information')}
//           >
//             <UnstyledButton
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '4px',
//                 flex: 1,
//                 padding: 0,
//                 fontSize: '11px',
//                 fontWeight: 500,
//                 color: '#ffffff'
//               }}
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('information');
//               }}
//             >
//               <IconInfoCircle size={8} />
//               <Text size="xs" weight={500} color="white">
//                 Information
//               </Text>
//             </UnstyledButton>
//             <ActionIcon
//               variant="subtle"
//               size="xs"
//               onClick={(e): void => {
//                 e.stopPropagation();
//                 toggleSection('information');
//               }}
//               style={{
//                 color: '#ffffff',
//                 transform: openSections.includes('information') ? 'rotate(180deg)' : 'rotate(0deg)',
//                 transition: 'transform 0.2s ease'
//               }}
//             >
//               <IconChevronDown size={12} />
//             </ActionIcon>
//           </Flex>

//           {openSections.includes('information') && (
//             <Box style={{ padding: '4px 6px' }}>
//               <Stack spacing={4}>
//                 <Card padding={8} style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
//                   <Stack spacing={4}>
//                     <Group spacing={4} align="center">
//                       <IconInfoCircle size={10} color="var(--mantine-color-blue-4)" />
//                       <Text size="xs" weight={500} c="white">
//                         Data Status
//                       </Text>
//                     </Group>
//                     <DataTimestamp />
//                   </Stack>
//                 </Card>

//                 <Card padding={8} style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
//                   <Stack spacing={4}>
//                     <Group spacing={4} align="center">
//                       <IconDeviceDesktop size={10} color="var(--mantine-color-blue-4)" />
//                       <Text size="xs" weight={500} c="white">
//                         Platform Information
//                       </Text>
//                     </Group>
//                     <Text size="xs" c="#ffffff" style={{ lineHeight: 1.3 }}>
//                       GeoTwin is an advanced 3D flood risk assessment platform
//                       specifically designed for Dominica.
//                     </Text>
//                   </Stack>
//                 </Card>

//                 <Card padding={8} style={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
//                   <Stack spacing={4}>
//                     <Group spacing={4} align="center">
//                       <IconInfoCircle size={10} color="var(--mantine-color-blue-4)" />
//                       <Text size="xs" weight={500} c="white">
//                         Data Sources
//                       </Text>
//                     </Group>
//                     <Box pl="xs">
//                       <Text size="xs" c="#ffffff">• OpenStreetMap (Geographic Data)</Text>
//                       <Text size="xs" c="#ffffff">• COP30 (Elevation Model)</Text>
//                       <Text size="xs" c="#ffffff">• FastFlood API (Flood Simulation)</Text>
//                     </Box>
//                   </Stack>
//                 </Card>
//               </Stack>
//             </Box>
//           )}
//         </Box>
//       </Stack>
//     </Stack>
//   );
// };

// export default MantineVisualSettingsSection;
