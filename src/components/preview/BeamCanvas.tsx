import React, { useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { Button } from '@/components/ui/button';
import { Tags } from 'lucide-react';

// Helper to get bar prefix based on grade name
const getMainBarPrefix = (gradeName: string) => (gradeName.includes('500') ? 'HD' : 'D');
const getStirrupPrefix = (gradeName: string) => (gradeName.includes('500') ? 'HR' : 'R');

export const BeamCanvas: React.FC = () => {
    const [showAnnotations, setShowAnnotations] = useState(true);

    const beamGeometry = useBeamDesignStore((state) => state.beamGeometry);
    const finalReinforcement = useBeamDesignStore((state) => state.finalReinforcement);
    const materialProperties = useBeamDesignStore((state) => state.materialProperties);

    // This is the most important fix. It prevents rendering if the geometry is incomplete or invalid (e.g., during text input).
    if (!finalReinforcement || !beamGeometry.breadth || !beamGeometry.depth || beamGeometry.breadth <= 0 || beamGeometry.depth <= 0) {
        // You can return null or a placeholder showing the error
        return (
             <div className="w-[600px] h-[600px] bg-white rounded-md shadow-lg flex items-center justify-center text-muted-foreground">
                <p>Waiting for valid beam dimensions...</p>
            </div>
        );
    }

    // --- 1. Scaling and Layout ---
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 600;
    const PADDING = 100; // Increased padding for annotations

    const { breadth: B, depth: D, cover } = beamGeometry;
    const { n, db, ds, ss, legs } = finalReinforcement;

    const scale = (CANVAS_WIDTH - 2 * PADDING) / Math.max(B, D);
    const beamWidthPx = B * scale;
    const beamHeightPx = D * scale;
    const stageX = (CANVAS_WIDTH - beamWidthPx) / 2;
    const stageY = (CANVAS_HEIGHT - beamHeightPx) / 2;

    // --- 2. Advanced Stirrup Calculation ---
    const stirrupShapes = [];
    let stirrupLegSpacing = 0;
    if (legs > 1) {
        stirrupLegSpacing = (B - 2 * cover - 2 * ds) / (legs - 1);
    }

    // Outer stirrup for designs with 2 or more legs
    if (legs >= 2) {
        stirrupShapes.push({
            type: 'rect',
            x: stageX + cover * scale,
            y: stageY + cover * scale,
            width: (B - 2 * cover) * scale,
            height: (D - 2 * cover) * scale,
            strokeWidth: ds * scale,
            cornerRadius: ds * scale,
        });
    }

    // Inner legs/links
    if (legs === 1 ) { // Central link
        const centerX = stageX + B / 2 * scale;
        stirrupShapes.push({
            type: 'line',
            points: [centerX + 10, stageY + cover * scale + 25, centerX + 10, stageY + cover * scale, centerX- 10, stageY + cover * scale, 
                centerX-10, stageY + (D - cover) * scale, centerX+10, stageY + (D - cover) * scale, centerX+10, stageY + (D - cover) * scale-25],
            strokeWidth: ds * scale,
        });
    }
    if (legs >= 3) { // Evenly spaced inner stirrups
        for (let i = 1; i < legs -1; i++) {
            const legX = stageX + (cover + ds) * scale + i * stirrupLegSpacing * scale;
            stirrupShapes.push({
                type: 'line',
                points: [legX, stageY + cover * scale, legX, stageY + (D - cover) * scale],
                strokeWidth: ds * scale,
            });
        }
    }
    
    // --- 3. Bar Calculations (remains similar) ---
    const topBarDb = 12;
    const topBarRadiusPx = (topBarDb / 2) * scale;
    const topBarCenterY = stageY + (cover + ds + topBarDb / 2) * scale;
    const leftTopBarCenterX = stageX + (cover + ds + topBarDb / 2) * scale;
    const rightTopBarCenterX = stageX + (B - cover - ds - topBarDb / 2) * scale;

    // ... bottom bar calculation logic ...
    const bottomBarRadiusPx = (db / 2) * scale; 
    const bottomBarCenterY = stageY + (D - cover - ds - db / 2) * scale;

    const bottomBars = [];
    if (n > 0) {
        // The total width available for the centers of the bottom bars
        const drawableWidth = B - 2 * cover - 2 * ds - db;
        const firstBarCenterX = stageX + (cover + ds + db / 2) * scale;

        if (n === 1) {
            bottomBars.push({ x: stageX + (B / 2) * scale, y: bottomBarCenterY });
        } else {
            // The distance between the center of each bar
            const spacing = (drawableWidth / (n - 1)) * scale;
            for (let i = 0; i < n; i++) {
                bottomBars.push({ x: firstBarCenterX + i * spacing, y: bottomBarCenterY });
            }
        }
    }
    
    // --- 4. Annotation Text ---
    const mainBarPrefix = getMainBarPrefix(materialProperties.mainBarGradeName);
    const stirrupPrefix = getStirrupPrefix(materialProperties.stirrupGradeName);
    const mainBarText = `${n} x ${mainBarPrefix}${db}`;
    const stirrupText = `${stirrupPrefix}${ds} @ ${ss}mm (${legs} legs)`;

    return (
        <div className="flex flex-col items-center space-y-2">
            <div className="w-full flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowAnnotations(!showAnnotations)}>
                    <Tags className="h-4 w-4 mr-2" />
                    Toggle Annotations
                </Button>
            </div>
            <div className="bg-white rounded-md shadow-lg">
                <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                    <Layer>
                        {/* White "Paper" Background */}
                        <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="white" />

                        {/* Beam Section */}
                        <Rect x={stageX} y={stageY} width={beamWidthPx} height={beamHeightPx} fill="#F9FAFB" stroke="#6B7280" strokeWidth={1.5} />

                        {/* Render Stirrups */}
                        {stirrupShapes.map((shape, i) =>
                            shape.type === 'rect' ? (
                                <Rect key={`stirrup-${i}`} {...shape} stroke="#6B7280" />
                            ) : (
                                <Line key={`stirrup-${i}`} {...shape} stroke="#6B7280" lineCap="round" tension={0.5} />
                            )
                        )}
                        
                        {/* Top & Bottom Bars  */}
                        <Circle x={leftTopBarCenterX} y={topBarCenterY} radius={topBarRadiusPx} fill="#9CA3AF" />
                        <Circle x={rightTopBarCenterX} y={topBarCenterY} radius={topBarRadiusPx} fill="#9CA3AF" />
                        {bottomBars.map((bar, i) => (
                            <Circle
                                key={`bottom-bar-${i}`}
                                x={bar.x}
                                y={bar.y}
                                radius={bottomBarRadiusPx}
                                fill="#374151" // Darker fill for main reinforcement
                            />
                        ))}

                        {/* Annotations */}
                        {showAnnotations && (
                            <>
                                {/* Bottom Bar Annotation */}
                                <Line points={[stageX + beamWidthPx - (cover + ds + db/2) * scale, stageY + beamHeightPx - (cover + ds + db/2) * scale,  stageX + beamWidthPx + 30, stageY + beamHeightPx - (cover + ds + db/2) * scale]} stroke="black" strokeWidth={1} />
                                <Text x={stageX + beamWidthPx + 35} y={stageY + beamHeightPx - (cover + ds + db/2) * scale - 6} text={mainBarText} fontSize={12} />

                                {/* Stirrup Annotation */}
                                <Line points={[stageX + beamWidthPx - cover* scale, stageY + beamHeightPx / 2, stageX + beamWidthPx + 30, stageY + beamHeightPx / 2]} stroke="black" strokeWidth={1} />
                                <Text x={stageX + beamWidthPx + 35} y={stageY + beamHeightPx / 2 -6} text={stirrupText} fontSize={12} align="center" width={90} lineHeight={1.3} />

                                {/* Dimension B */}
                                <Line points={[stageX, stageY + beamHeightPx + 10, stageX, stageY + beamHeightPx + 20, stageX + beamWidthPx, stageY + beamHeightPx + 20, stageX + beamWidthPx, stageY + beamHeightPx + 10]} stroke="blue" strokeWidth={1} />
                                <Text x={stageX + beamWidthPx / 2 - 15} y={stageY + beamHeightPx + 26} text={`${B} mm`} fontSize={12} />

                                {/* Dimension D */}
                                <Line points={[stageX - 10, stageY, stageX -20, stageY, stageX -20, stageY + beamHeightPx, stageX -10, stageY + beamHeightPx]} stroke="blue" strokeWidth={1} />
                                <Text x={stageX -70} y={stageY + beamHeightPx / 2 - 6} text={`${D} mm`} fontSize={12} />
                            </>
                        )}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};