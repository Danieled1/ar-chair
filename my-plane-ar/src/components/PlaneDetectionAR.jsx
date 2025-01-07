// src/components/PlaneDetectionAR.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function PlaneDetectionAR({ modelPath }) {
    const containerRef = useRef(null);

    useEffect(() => {
      let camera, scene, renderer;
      let reticle;       
      let model;         
      let xrHitTestSource = null;
      let localSpace = null;
      let placed = false;  
  
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight, 0.01, 20
      );
  
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
  
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }
  
      // Simple lighting
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);
  
      // ---- FIX STARTS HERE ----
      // Use the imported GLTFLoader
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          model = gltf.scene;
          model.scale.set(0.3, 0.3, 0.3);
          model.visible = false;
          scene.add(model);
        },
        undefined,
        (err) => console.error('Error loading model:', err)
      );

    // Reticle (to indicate where the model will be placed)
    const geometry = new THREE.RingGeometry(0.06, 0.07, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    reticle = new THREE.Mesh(geometry, material);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Handle resize
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize);

    // Tap handler: place the model where the reticle is
    function onSelect() {
      if (!reticle.visible || placed) return;

      // Move the model to the reticle position
      const pose = reticle.matrix.clone();
      model.visible = true;
      model.matrix.copy(pose);
      model.matrix.decompose(model.position, model.quaternion, model.scale);

      placed = true;
      reticle.visible = false;
    }
    
    // Set up the XR session
    document.body.addEventListener('click', () => {
      // A user gesture is needed to request an XR session
      if (renderer.xr.isPresenting) return; // Already in an XR session

      navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
      }).then((session) => {
        renderer.xr.setSession(session);
        session.addEventListener('select', onSelect);
      }).catch((err) => {
        console.error('Failed to start AR session:', err);
      });
    }, { once: true }); 
    // "once: true" so we only attempt to request the session on the first tap.

    // This will be called on every frame in XR
    function renderXR(timestamp, frame) {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        // Create hit test source if not available yet
        if (!xrHitTestSource) {
          session.requestReferenceSpace('viewer').then((refSpace) => {
            session.requestHitTestSource({ space: refSpace }).then((hitTestSource) => {
              xrHitTestSource = hitTestSource;
            });
          });
        }

        // If we have a hit test source, get the hit test results
        if (xrHitTestSource) {
          const hitTestResults = frame.getHitTestResults(xrHitTestSource);
          if (hitTestResults.length) {
            const hit = hitTestResults[0];
            // Create a "local" reference space if not yet created
            if (!localSpace) {
              localSpace = renderer.xr.getReferenceSpace();
            }

            const pose = hit.getPose(localSpace);
            if (!placed) {
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            }
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(renderXR);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      renderer.setAnimationLoop(null);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelPath]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh', position: 'relative' }}
    >
      {/* This container holds the Three.js <canvas> */}
    </div>
  );
}

export default PlaneDetectionAR;
