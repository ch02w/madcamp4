import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

const ThreeView: React.FC<{ canvasStates: CanvasState[] }> = ({ canvasStates }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraState, setCameraState] = useState<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
  }>({
    position: new THREE.Vector3(0, 0, 2),
    rotation: new THREE.Euler(0, 0, 0),
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.copy(cameraState.position);
    camera.rotation.copy(cameraState.rotation);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;

    const materialArray = canvasStates.map((canvasState) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        Object.entries(canvasState).forEach(([key, { value }]) => {
          const [_, x, y] = key.split('-');
          ctx.fillStyle = `#${value.toString(16).padStart(6, '0')}`;
          ctx.fillRect(parseInt(x), parseInt(y), 10, 10);
        });
      }
      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.MeshBasicMaterial({ map: texture });
    });

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

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      setCameraState({
        position: camera.position.clone(),
        rotation: camera.rotation.clone(),
      });
      mount.removeChild(renderer.domElement);
    };
  }, [canvasStates]);

  return <div ref={mountRef} style={{ width: '600px', height: '400px' }} />;
};

export default ThreeView;
