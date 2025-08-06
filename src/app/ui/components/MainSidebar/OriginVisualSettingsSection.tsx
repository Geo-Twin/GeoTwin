// import React from 'react';
// import { Accordion, AccordionItem } from '../OriginUI/Accordion';
// import { Card } from '../OriginUI/Card';
// import { Button } from '../OriginUI/Button';
// import { 
//   ComputerDesktopIcon, 
//   MapIcon, 
//   BookmarkIcon, 
//   InformationCircleIcon,
//   ArrowPathIcon
// } from '@heroicons/react/24/outline';
// import SidebarSettingsPanel from './SidebarSettingsPanel';
// import SavedPlacesModalPanel from '~/app/ui/components/SavedPlacesModalPanel';
// import CompassPanel from '~/app/ui/components/CompassPanel';
// import GeolocationButton from '~/app/ui/components/GeolocationButton';
// import DataTimestamp from '~/app/ui/components/DataTimestamp';

// const OriginVisualSettingsSection: React.FC = () => {
//   return (
//     <div className="space-y-4">
//       <Accordion>
//         <AccordionItem
//           title="Display Settings"
//           icon={<ComputerDesktopIcon className="h-4 w-4" />}
//           defaultOpen={true}
//         >
//           <div className="space-y-4">
//             <SidebarSettingsPanel />
//           </div>
//         </AccordionItem>
        
//         <AccordionItem
//           title="Navigation"
//           icon={<MapIcon className="h-4 w-4" />}
//         >
//           <div className="space-y-4">
//             <Card padding="sm">
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 text-sm font-medium text-white">
//                   <ComputerDesktopIcon className="h-4 w-4 text-blue-400" />
//                   <span>Compass</span>
//                 </div>
//                 <div className="flex justify-center">
//                   <CompassPanel />
//                 </div>
//               </div>
//             </Card>
            
//             <Card padding="sm">
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 text-sm font-medium text-white">
//                   <MapIcon className="h-4 w-4 text-blue-400" />
//                   <span>My Location</span>
//                 </div>
//                 <GeolocationButton />
//               </div>
//             </Card>
//           </div>
//         </AccordionItem>

//         <AccordionItem
//           title="Saved Places"
//           icon={<BookmarkIcon className="h-4 w-4" />}
//         >
//           <Card padding="sm">
//             <SavedPlacesModalPanel />
//           </Card>
//         </AccordionItem>

//         <AccordionItem
//           title="Information"
//           icon={<InformationCircleIcon className="h-4 w-4" />}
//         >
//           <div className="space-y-4">
//             <Card padding="sm">
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 text-sm font-medium text-white">
//                   <InformationCircleIcon className="h-4 w-4 text-blue-400" />
//                   <span>Data Status</span>
//                 </div>
//                 <DataTimestamp />
//               </div>
//             </Card>
            
//             <Card padding="sm">
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 text-sm font-medium text-white">
//                   <ComputerDesktopIcon className="h-4 w-4 text-blue-400" />
//                   <span>Platform Information</span>
//                 </div>
//                 <p className="text-sm text-gray-300 leading-relaxed">
//                   GeoTwin is an advanced 3D flood risk assessment platform 
//                   specifically designed for Dominica's unique geography and climate challenges.
//                 </p>
//               </div>
//             </Card>
            
//             <Card padding="sm">
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 text-sm font-medium text-white">
//                   <InformationCircleIcon className="h-4 w-4 text-blue-400" />
//                   <span>Data Sources</span>
//                 </div>
//                 <ul className="text-sm text-gray-300 space-y-1 pl-4">
//                   <li className="list-disc">OpenStreetMap (Geographic Data)</li>
//                   <li className="list-disc">COP30 (Elevation Model)</li>
//                   <li className="list-disc">FastFlood API (Flood Simulation)</li>
//                 </ul>
//               </div>
//             </Card>
//           </div>
//         </AccordionItem>
//       </Accordion>
//     </div>
//   );
// };

// export default OriginVisualSettingsSection;
