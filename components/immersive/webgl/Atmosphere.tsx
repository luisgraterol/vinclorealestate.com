'use client';

import { useEffect, useRef } from 'react';
import { ensureGsap, ScrollTrigger, motionOK } from '../motion';
import styles from './Atmosphere.module.css';

// Gold dust drifting over the hero photography: a scoped three.js scene that
// mounts only when motion is allowed and WebGL is available. Purely
// decorative (aria-hidden), fades out as the hero scrolls away, pauses when
// off screen, and disposes fully on unmount. Everything degrades to the
// plain photographic hero.

const GOLD = 0xc9a96e;
const GOLD_LIGHT = 0xdfc090;

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function makeSprite(): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export default function Atmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !motionOK() || !supportsWebGL()) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // three is only fetched on capable clients; keeps it out of the shared bundle.
    import('three').then(THREE => {
      if (disposed || !host) return;

      const gsap = ensureGsap();
      const parent = host.parentElement ?? host;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.z = 10;

      const sprite = new THREE.CanvasTexture(makeSprite());
      const group = new THREE.Group();
      scene.add(group);

      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      const makeCloud = (count: number, spread: number, size: number, color: number, opacity: number) => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * spread * 2.2; // x: wider than tall
          pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
          pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
          map: sprite,
          color,
          size,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geo, mat);
        group.add(points);
        return points;
      };

      const far = makeCloud(isMobile ? 140 : 260, 12, 0.055, GOLD, 0.5);
      const near = makeCloud(isMobile ? 60 : 110, 9, 0.12, GOLD_LIGHT, 0.35);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      // Mouse parallax (desktop only; lerped in the tick).
      const target = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
        target.y = (e.clientY / window.innerHeight - 0.5) * 0.35;
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      let running = true;
      const tick = () => {
        if (!running) return;
        const t = performance.now() / 1000;
        far.rotation.y = t * 0.012;
        near.rotation.y = -t * 0.02;
        group.position.y = Math.sin(t * 0.18) * 0.25;
        group.rotation.x += (target.y * 0.3 - group.rotation.x) * 0.03;
        group.rotation.z += (-target.x * 0.12 - group.rotation.z) * 0.03;
        camera.position.x += (target.x * 1.1 - camera.position.x) * 0.04;
        renderer.render(scene, camera);
      };
      gsap.ticker.add(tick);

      // Render only while the hero is on screen.
      const io = new IntersectionObserver(([entry]) => {
        running = entry.isIntersecting;
      });
      io.observe(parent);

      // Fade the dust out as the hero scrolls away.
      const st = ScrollTrigger.create({
        trigger: parent,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: self => {
          host.style.opacity = String(1 - self.progress * 1.4);
        },
      });

      const onContextLost = (e: Event) => {
        e.preventDefault();
        running = false;
        host.style.display = 'none';
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);

      cleanup = () => {
        gsap.ticker.remove(tick);
        io.disconnect();
        ro.disconnect();
        st.kill();
        window.removeEventListener('pointermove', onPointer);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        [far, near].forEach(p => {
          p.geometry.dispose();
          (p.material as InstanceType<typeof THREE.PointsMaterial>).dispose();
        });
        sprite.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={ref} className={styles.wrap} aria-hidden="true" />;
}
