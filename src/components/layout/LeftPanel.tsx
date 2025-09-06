// src/components/layout/LeftPanel.tsx
import React, {useRef} from 'react';
import { JobSetup } from '../inputs/JobSetup';
import { LoadsInput } from '../inputs/LoadsInput';
import { GeometryInput } from '../inputs/GeometryInput';
import { MaterialInput } from '../inputs/MaterialInput';

import { RecommendedOutputs } from '@/components/outputs/RecommendedOutputs';
import { DetailedDesignInput } from '@/components/inputs/DetailedDesignInput';
import { FinalDesignOutput } from '@/components/outputs/FinalDesignOutput';
import { SLSDesignInput } from '@/components/inputs/SLSDesignInput';
import { SLSDesignOutput } from '@/components/outputs/SLSDesignOutput';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // For Help/About popups

// Lucide Icons
import { Menu, Info, HelpCircle, DraftingCompass, Lightbulb, Wrench, Settings } from 'lucide-react';
import { cn } from '@/lib/utils'; // Utility for combining tailwind classes
import { useBeamDesignStore } from '@/stores/beamDesignStore'; // Import store for project name

// Define the sections we want to navigate to
interface Section {
    id: string; // HTML ID for scrolling to
    title: string;
    component: React.FC; // The component to render for this section
}

const inputSections: Section[] = [
    { id: 'job-setup', title: 'Job Setup', component: JobSetup },
    { id: 'design-loads', title: 'Design Loads', component: LoadsInput },
    { id: 'geometry', title: 'Geometry', component: GeometryInput },
    { id: 'materials', title: 'Materials', component: MaterialInput },
    // Add other sections here as you create their components
];

// Define the output section separately for clarity
const outputSection: Section = {
    id: 'recommended-design',
    title: 'Design Options',
    component: RecommendedOutputs,
};

const finalDesignSection: Section = {
    id: 'final-design',
    title: 'Final Design',
    component: DetailedDesignInput,
};

const finalDesignOutputSection: Section = {
    id: 'final-design-output',
    title: 'Check Results',
    component: FinalDesignOutput,
};

const slsInputSection: Section = {
    id: 'sls-input',
    title: 'SLS Inputs',
    component: SLSDesignInput,
};
const slsOutputSection: Section = {
    id: 'sls-output',
    title: 'SLS Results',
    component: SLSDesignOutput,
};

export const LeftPanel: React.FC = () => {
    
    const projectName = useBeamDesignStore((state) => state.projectInfo.projectName);
    const newDesign = useBeamDesignStore((state) => state.newDesign);
    const exportDesign = useBeamDesignStore((state) => state.exportDesign);

    const handleNavigationClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveDesign = () => {
        const designData = exportDesign();
        const jsonString = JSON.stringify(designData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${designData.projectInfo.projectName || 'beam_design'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        useBeamDesignStore.getState().setStage(5); // 4 = design saved
    };

    const handleLoadDesign = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
            const loadedDesign = JSON.parse(e.target?.result as string);
            useBeamDesignStore.getState().loadDesign(loadedDesign);
            // optional: show toast/notification
            useBeamDesignStore.getState().setStage(6); // 5 = design loaded
            } catch (err) {
            console.error('Failed to load design:', err);
            alert('Invalid design JSON.');
            }
        };
        reader.readAsText(file);
    };

    const setTheme = (theme: 'light' | 'dark') => {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    };

    // Apply saved theme on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (saved) setTheme(saved);
    }, []);

    return (
        <div className="flex h-full">
            {/* Navigation Sidebar */}
            <nav className="w-40 xl:w-56 flex-shrink-0 border-r dark:border-gray-700 p-4 flex flex-col justify-between">
                {/* Top Section: App Title, Project Name, Design Actions */}
                <div>
                    <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">RC Beam Designer</h1>

                    <div className="flex items-center justify-between mb-4">
                        <span className="flex-1 overflow-hidden text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-2" title={projectName}>
                            {projectName || 'No Project'}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"> {/* Smaller button */}
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={newDesign}>New Design</DropdownMenuItem>
                                <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault(); // prevent Radix from closing before we trigger
                                    fileInputRef.current?.click();
                                }}
                                >
                                Load Design
                                </DropdownMenuItem>

                                <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(e) => {
                                    handleLoadDesign(e);
                                    e.currentTarget.value = ""; // reset after load
                                }}
                                />
                                <DropdownMenuItem onClick={handleSaveDesign}>Save Design</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Separator className="my-4" />

                    {/* Middle Section: Navigation to Input Blocks */}
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Inputs</h3>
                    <div className="space-y-2">
                        {inputSections.map((section, index) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavigationClick(section.id);
                                }}
                                className={cn(
                                    "block text-sm font-medium rounded-md px-2 py-1 transition-colors",
                                    "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                                    // You can add an 'active' state based on scroll position later
                                )}
                            >
                                {index + 1}. {section.title}
                            </a>
                        ))}
                        <Separator className="my-2" />
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Design</h3>
                        {/* Add navigation link for the output section */}
                        <a
                            key={outputSection.id}
                            href={`#${outputSection.id}`}
                            onClick={(e) => { e.preventDefault(); handleNavigationClick(outputSection.id); }}
                            className={cn("block text-sm font-medium rounded-md px-2 py-1 transition-colors text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800")}
                        >
                            <span className="flex items-center"><Lightbulb className="h-4 w-4 mr-2"/> {outputSection.title}</span>
                        </a>
                        {/* Add navigation for the Final Design section */}
                        <a
                            key={finalDesignSection.id}
                            href={`#${finalDesignSection.id}`}
                            onClick={(e) => { e.preventDefault(); handleNavigationClick(finalDesignSection.id); }}
                            className={cn("block text-sm font-medium rounded-md px-2 py-1 transition-colors text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800")}
                        >
                            {/* ... icon and title ... */}
                            <span className="flex items-center"><DraftingCompass className="h-4 w-4 mr-2"/> Final Design </span>
                        </a>
                        {/* Add navigation for the SLS Design section */}
                        <a
                            key={slsInputSection.id}
                            href={`#${slsInputSection.id}`}
                            onClick={(e) => { e.preventDefault(); handleNavigationClick(slsInputSection.id); }}
                            className={cn("block text-sm font-medium rounded-md px-2 py-1 transition-colors text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800")}
                        >
                            {/* ... icon and title ... */}
                            <span className="flex items-center"><Wrench className="h-4 w-4 mr-2"/> SLS Design </span>
                        </a>
                    </div>
                </div>

                {/* Bottom Section: Help / About Buttons */}
                <div className="space-y-2">
                    <Separator className="my-4" />

                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => setTheme('light')}>
                        Light Theme
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>
                        Dark Theme
                        </DropdownMenuItem>
                        {/* You can add more settings options here later */}
                    </DropdownMenuContent>                
                    </DropdownMenu>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                                <HelpCircle className="h-4 w-4 mr-2" /> Help
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Help & Documentation</DialogTitle>
                                <DialogDescription>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This is a Reinforced Concrete Beam Design application based on NZS3101 standards. 
                                        You can enter your project details, beam geometry, material properties, and applied loads to generate design options. 
                                        All calculations follow the NZS3101 provisions for bending, shear, and serviceability.
                                    </p>
                                    <h4 className="font-semibold mt-4 mb-2">Usage Instructions:</h4>
                                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li>Complete the input sections from top to bottom as per the instructions. Ensure all mandatory fields are filled correctly.</li>
                                        <li>The preview panel on the right updates in real-time as you modify the inputs.</li>
                                        <li>Generate design options by clicking "Calculate Designs". Review the suggested options and select the preferred one to start the detailed design process.</li>
                                        <li>In the <strong>Final Design Details</strong> section, review the recommended reinforcement. You can adjust bar numbers, diameters, stirrup spacing, and legs. Then perform the detailed design checks.</li>
                                        <li>In the <strong>SLS Design</strong> section, check serviceability by reviewing crack widths and stiffness calculations. Adjust reinforcement if necessary to meet SLS requirements.</li>
                                        <li>Use the <strong>Save Design</strong> button to export your current project to a JSON file. Use the <strong>Load Design</strong> button to load a previously saved project.</li>
                                        <li>The <strong>Status</strong> footer displays the current stage of your project, helping you track your workflow.</li>
                                        <li>All units are in kN, mm (span in m), and MPa unless otherwise noted.</li>
                                        <li>Refer to the NZS3101 standard or the application manual for detailed guidance on design rules and calculations.</li>
                                        <li>For best results, follow the recommended workflow: Input → Generate Options → Select Option → Final Design → Detailed Checks → SLS Checks → Save Project.</li>
                                    </ul>

                                    <h4 className="font-semibold mt-4 mb-2">Tips:</h4>
                                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li>Always start a new design by clicking "New Design" to reset the inputs.</li>
                                        <li>You can modify reinforcement manually, but it is recommended to first run the design options to get a feasible starting point.</li>
                                        <li>Pay attention to warnings or errors displayed during detailed design checks; these indicate non-compliance with NZS3101 provisions.</li>
                                        <li>Use the app on larger screens for better visibility of tables and design previews.</li>
                                    </ul>
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                                <Info className="h-4 w-4 mr-2" /> About
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>About This Application</DialogTitle>
                            <DialogDescription>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This Reinforced Concrete (RC) Beam Designer is developed for educational and conceptual design purposes. 
                                    It is built using React, Vite, TypeScript, Tailwind CSS, and Shadcn UI. 
                                    You can use it to explore beam design concepts in accordance with NZS3101 provisions.
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">Disclaimer:</h4>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    **This application is not intended for professional engineering design work.** 
                                    All calculations and results must be verified by a qualified structural engineer. 
                                    The developers are not responsible for any design errors, misinterpretations, or construction issues. 
                                    Use at your own risk. All designs must comply with relevant local building codes and standards.
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">Reporting Bugs:</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    To report a bug, please email a detailed description of the issue, including any error messages, steps to reproduce, and your environment or browser version. 
                                    Contact Email: <a href="mailto:structcalcnz@gmail.com" className="underline">structcalcnz@gmail.com</a>
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">Copyright and License:</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                                    &copy; {new Date().getFullYear()} StructCalcNZ. All rights reserved. <br />
                                    This web application is provided as a design aid and may be used for non-commercial and commercial purposes. 
                                    Modification of the underlying code, scripts, or internal functionality without permission is prohibited. 
                                    This tool is not a substitute for professional engineering judgment. 
                                    Users assume full responsibility for the accuracy of inputs, calculations, and designs. 
                                    All outputs must be reviewed and approved by a qualified structural engineer prior to construction. 
                                    For full licensing details, limitations, and warranty disclaimers, refer to the LICENSE file in the repository.
                                </p>
                            </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </div>
            </nav>

            {/* Scrollable Content Area */}
            
            <ScrollArea className="flex-1 h-full p-4 overflow-y-auto">
                <div className="space-y-6 pb-8">
                    {inputSections.map(section => (
                        <div key={section.id} id={section.id} className="scroll-mt-6">
                            <section.component />
                        </div>
                    ))}
                    
                    <Separator className="my-8" />

                    {/* Render the self-contained output section */}
                    <div id={outputSection.id} className="scroll-mt-6">
                        <outputSection.component />
                    </div>
                    {/* Render the new final design section */}
                    <div id={finalDesignSection.id} className="scroll-mt-6">
                        <finalDesignSection.component />
                    </div>
                    {/* ... (DetailedDesignInput) ... */}
                    <div id={finalDesignOutputSection.id} className="scroll-mt-6">
                        <finalDesignOutputSection.component />
                    </div> 

                    <Separator className="my-8 border-t-2" />
                    {/* Add new SLS sections */}
                    <div id={slsInputSection.id} className="scroll-mt-6">
                        <slsInputSection.component />
                    </div>
                    <div id={slsOutputSection.id} className="scroll-mt-6">
                        <slsOutputSection.component />
                    </div>                   
                </div>
            </ScrollArea>
           
        </div>
    );
};