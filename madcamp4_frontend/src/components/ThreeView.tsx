import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ThreeView.css';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

const ThreeView: React.FC<{ canvasStates: CanvasState[] }> = ({ canvasStates }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const saveCameraState = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    localStorage.setItem('camera.position.x', camera.position.x.toString());
    localStorage.setItem('camera.position.y', camera.position.y.toString());
    localStorage.setItem('camera.position.z', camera.position.z.toString());
    localStorage.setItem('camera.rotation.x', camera.rotation.x.toString());
    localStorage.setItem('camera.rotation.y', camera.rotation.y.toString());
    localStorage.setItem('camera.rotation.z', camera.rotation.z.toString());
    localStorage.setItem('camera.zoom', camera.zoom.toString());
    localStorage.setItem('controls.target.x', controls.target.x.toString());
    localStorage.setItem('controls.target.y', controls.target.y.toString());
    localStorage.setItem('controls.target.z', controls.target.z.toString());
  };

  const loadCameraState = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const positionX = parseFloat(localStorage.getItem('camera.position.x') || '0');
    const positionY = parseFloat(localStorage.getItem('camera.position.y') || '0');
    const positionZ = parseFloat(localStorage.getItem('camera.position.z') || '2');
    const rotationX = parseFloat(localStorage.getItem('camera.rotation.x') || '0');
    const rotationY = parseFloat(localStorage.getItem('camera.rotation.y') || '0');
    const rotationZ = parseFloat(localStorage.getItem('camera.rotation.z') || '0');
    const zoom = parseFloat(localStorage.getItem('camera.zoom') || '1');

    const targetX = parseFloat(localStorage.getItem('controls.target.x') || '0');
    const targetY = parseFloat(localStorage.getItem('controls.target.y') || '0');
    const targetZ = parseFloat(localStorage.getItem('controls.target.z') || '0');

    camera.position.set(positionX, positionY, positionZ);
    camera.rotation.set(rotationX, rotationY, rotationZ);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();

    controls.target.set(targetX, targetY, targetZ);
    controls.update();
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearAlpha(0);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    loadCameraState();

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

    const handleResize = () => {
      if (renderer && camera) {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      saveCameraState();
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [canvasStates]); // Add canvasStates as a dependency to re-render when it changes

  return <div ref={mountRef} className="threeview-container" />;
};

export default ThreeView;
