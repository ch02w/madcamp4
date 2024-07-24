import * as THREE from 'three';
import * as fs from 'fs';
import { createCanvas } from 'canvas';

global.window = global as any;
global.Blob = require('vblob').Blob;
global.FileReader = require('vblob').FileReader;
global.THREE = THREE;

const mockDocument = {
    createElement: (nodeName: string) => {
        if (nodeName !== 'canvas') throw new Error(`Cannot create node ${nodeName}`);
        return createCanvas(256, 256) as unknown as HTMLCanvasElement;
    },
} as unknown as Document;

global.document = mockDocument;

interface CanvasState {
    [key: string]: { value: number; timestamp: number };
}

export async function generateGLB(canvasStates: CanvasState[], outputPath: string) {
    const { GLTFExporter } = await (eval(`import('three/examples/jsm/exporters/GLTFExporter.js')`) as Promise<typeof import('three/examples/jsm/exporters/GLTFExporter')>);

    const scene = new THREE.Scene();
    var materialArray = [
        new THREE.MeshBasicMaterial( { color: 0xFFFFFF, visible: true } ),
        new THREE.MeshBasicMaterial( { color: 0xFF0000, visible: true } ),
        new THREE.MeshBasicMaterial( { color: 0x00FF00, visible: true } ),
        new THREE.MeshBasicMaterial( { color: 0x0000FF, visible: true } ),
        new THREE.MeshBasicMaterial( { color: 0xFFFF00, visible: true } ),
        new THREE.MeshBasicMaterial( { color: 0x00FFFF, visible: true } )
  ];

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
        materialArray[0], // Front (z+)
        materialArray[1], // Back (z-)
        materialArray[2], // Top (y+)
        materialArray[3], // Bottom (y-)
        materialArray[4], // Left (x-)
        materialArray[5], // Right (x+)
    ];
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    const exporter = new GLTFExporter();
    exporter.parse(
        scene,
        (result) => {
            if (result instanceof ArrayBuffer) {
                const output = Buffer.from(result);
                const filePath = outputPath;
                fs.writeFileSync(filePath, output);
                console.log('GLB file written:', filePath);
            } else {
                console.error('Unexpected result format from GLTFExporter');
            }
        },
        (error) => console.error('An error occurred during parsing', error),
        { binary: true }
    );
}
