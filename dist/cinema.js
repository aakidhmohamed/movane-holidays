import * as THREE from './vendor/three.module.min.js';

const section = document.getElementById('journey');
const stage = document.getElementById('cinema-stage');
const canvas = document.getElementById('travel-world');
const intro = document.getElementById('cinema-intro');
const ending = document.getElementById('cinema-end');
const caption = document.getElementById('destination-caption');
const indicator = document.getElementById('journey-indicator');
const stops = [...indicator.querySelectorAll('button')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b);
const lerp = THREE.MathUtils.lerp;
const labels = [
  ['01 — Arrival', 'Welcome to Sri Lanka'],
  ['02 — Sigiriya', 'Ancient stories above the clouds'],
  ['03 — Kandy', 'Culture at the heart of the island'],
  ['04 — Hill Country', 'Into the highlands'],
  ['05 — Ella', 'Take the scenic route'],
  ['06 — The Wild', 'Where nature takes over'],
  ['07 — South Coast', 'Follow the island to the ocean'],
];
const boundaries = [0, .16, .275, .39, .57, .735, .875, 1];
const moments = [0, .215, .32, .455, .622, .798, .94];
let target = 0, progress = 0, frame = 0, previousTime = 0, visible = true, world = null, lastLabel = -1;

function scrollProgress() {
  const distance = section.offsetHeight - stage.offsetHeight;
  target = clamp(-section.getBoundingClientRect().top / Math.max(1, distance), 0, 1);
  wake();
}
function travelTo(value) {
  const top = scrollY + section.getBoundingClientRect().top;
  window.scrollTo({ top: top + value * (section.offsetHeight - stage.offsetHeight), behavior: motion.matches ? 'instant' : 'smooth' });
}
stops.forEach(button => button.addEventListener('click', () => travelTo(Number(button.dataset.stop))));
document.getElementById('start-journey').addEventListener('click', () => travelTo(.058));
function interfaceAt(p) {
  const opening = 1 - smooth(.008, .065, p);
  intro.style.opacity = opening;
  intro.style.transform = `translateY(${-28 * (1 - opening)}px)`;
  intro.inert = opening < .05;
  stage.classList.toggle('is-travelling', p > .055);
  const navigation = stage.querySelector('.cinema-nav nav');
  navigation.inert = p > .055;
  let index = boundaries.findIndex((value, i) => i < 7 && p >= value && p < boundaries[i + 1]);
  if (index < 0) index = 6;
  if (index !== lastLabel) {
    document.getElementById('cinema-label').textContent = labels[index][0];
    document.getElementById('cinema-caption').textContent = labels[index][1];
    stops.forEach((button, i) => { button.classList.toggle('active', i === index); if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    lastLabel = index;
  }
  const local = (p - boundaries[index]) / (boundaries[index + 1] - boundaries[index]);
  const captionOpacity = smooth(.07, .20, local) * (1 - smooth(.76, .94, local)) * (1 - opening) * (1 - smooth(.92, .97, p));
  caption.style.opacity = captionOpacity;
  caption.style.transform = `translateY(${8 * (1 - captionOpacity)}px)`;
  const final = smooth(.955, .992, p);
  ending.style.opacity = final;
  ending.style.pointerEvents = final > .65 ? 'auto' : 'none';
  ending.inert = final < .65;
  stage.classList.toggle('is-ending', p > .955);
  indicator.inert = p > .98;
  indicator.style.setProperty('--route-progress', p);
}
function wake() { if (!frame && visible && world) frame = requestAnimationFrame(tick); }
function tick(time) {
  frame = 0;
  const dt = Math.min(.064, (time - (previousTime || time - 16)) / 1000);
  previousTime = time;
  if (motion.matches) {
    const chapter = Math.max(0, boundaries.findLastIndex(value => value <= target));
    progress = target > .955 ? 1 : moments[Math.min(6, chapter)];
  } else {
    progress += (target - progress) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - progress) < .000025) progress = target;
  }
  interfaceAt(motion.matches ? target : progress);
  world.draw(progress);
  if (!motion.matches && Math.abs(target - progress) > .000025) wake();
}
window.addEventListener('scroll', scrollProgress, { passive: true });
window.addEventListener('resize', () => { world?.resize(); scrollProgress(); }, { passive: true });
motion.addEventListener('change', () => { stage.classList.toggle('reduced-motion', motion.matches); scrollProgress(); });
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (visible) { previousTime = 0; wake(); } else if (frame) { cancelAnimationFrame(frame); frame = 0; }
}, { rootMargin: '50px' }).observe(section);

function randomGenerator(seed = 3917) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
const random = randomGenerator();
const bridgeBlend = z => smooth(2310, 2370, z) * (1 - smooth(2520, 2590, z));
const pathX = z => lerp(Math.sin(z * .0031) * 17 + Math.sin(z * .0068) * 6, Math.sin(2450 * .0031) * 17 + Math.sin(2450 * .0068) * 6, bridgeBlend(z));
const pathY = z => lerp(62 * Math.exp(-Math.pow((z - 2080) / 650, 2)) + 17 * Math.exp(-Math.pow((z - 2540) / 380, 2)), 60, bridgeBlend(z));
function groundHeight(x, z) {
  const d = Math.abs(x - pathX(z));
  const hillside = smooth(18, 235, d);
  const mountainZone = .55 + 1.85 * Math.exp(-Math.pow((z - 2050) / 660, 2));
  const rolling = Math.sin(x * .018 + z * .007) * 13 + Math.sin(x * .034 - z * .014) * 7 + Math.cos(x * .007 + z * .011) * 18;
  const valley = 43 * Math.exp(-Math.pow((z - 2450) / 110, 2)) * Math.exp(-Math.pow(d / 80, 2));
  let height = pathY(z) + hillside * (rolling + 25) * mountainZone * smooth(150, 560, z) - valley;
  const rockMeadow = Math.exp(-Math.pow((x + 76) / 92, 4) - Math.pow((z - 865) / 98, 4));
  const lakeValley = Math.exp(-Math.pow((x + 72) / 69, 6) - Math.pow((z - 1255) / 108, 6));
  height = lerp(height, pathY(z) + 1, rockMeadow);
  height = lerp(height, pathY(z) - 2, lakeValley);
  height *= 1 - smooth(3520, 3900, z);
  if (z > 3790) return Math.max(-24, -(z - 3790) * .075);
  return Math.max(-2, height);
}

function buildWorld() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, .2, 1700);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.fog = new THREE.Fog(0xc7d5c9, 180, 720);
  const ambient = new THREE.HemisphereLight(0xddeaf0, 0x777b58, 1.7);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffedd1, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -130; sun.shadow.camera.right = 130;
  sun.shadow.camera.top = 130; sun.shadow.camera.bottom = -130;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
  sun.shadow.normalBias = .6; sun.shadow.bias = -.0002;
  scene.add(sun, sun.target);
  const regions = [], animated = [], waterUniforms = [];
  const journeyUniform = { value: 0 };
  const materialCache = new Map();
  function material(colour, options = {}) {
    const key = String(colour) + JSON.stringify(options);
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color: colour, roughness: .86, ...options }));
    return materialCache.get(key);
  }
  function surfaceDetail(mat, style) {
    mat.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vSurface;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurface=position;');
      shader.fragmentShader = `varying vec3 vSurface;
        float mHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float mNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(mHash(i),mHash(i+vec3(1,0,0)),f.x),mix(mHash(i+vec3(0,1,0)),mHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(mHash(i+vec3(0,0,1)),mHash(i+vec3(1,0,1)),f.x),mix(mHash(i+vec3(0,1,1)),mHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        ` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float fleck=mNoise(vSurface*${style === 'stone' ? '1.6' : '28.'});
        float grain=mNoise(vSurface*${style === 'stone' ? '8.4' : '74.'});
        diffuseColor.rgb*=.72+fleck*.34+grain*.14;
        ${style === 'stone' ? 'diffuseColor.rgb*=.94+.10*sin(vSurface.y*.95+sin(vSurface.x*.17)*1.7);' : ''}`);
    };
    mat.customProgramCacheKey = () => 'movane-surface-' + style;
    return mat;
  }
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const sphereGeometry = new THREE.SphereGeometry(1, 20, 12);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
  function mesh(geometry, mat, parent, position, scale = [1, 1, 1]) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position); object.scale.set(...scale);
    object.castShadow = true; object.receiveShadow = true;
    parent.add(object); return object;
  }
  const box = (parent, position, scale, colour, options) => mesh(boxGeometry, material(colour, options), parent, position, scale);
  const sphere = (parent, position, scale, colour, options) => mesh(sphereGeometry, material(colour, options), parent, position, scale);
  function cylinder(parent, position, scale, colour, options) { return mesh(cylinderGeometry, material(colour, options), parent, position, scale); }
  function region(z, range = 700) { const group = new THREE.Group(); group.userData = { z, range }; regions.push(group); scene.add(group); return group; }
  function blobShadow(parent, x, y, z, sx, sz) {
    const shadow = mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x263324, transparent: true, opacity: .12, depthWrite: false }), parent, [x, y + .05, z], [sx, sz, 1]);
    shadow.rotation.x = -Math.PI / 2; shadow.castShadow = false;
  }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { topColour: { value: new THREE.Color('#94b6c7') }, bottomColour: { value: new THREE.Color('#f1d9b9') }, journey: journeyUniform },
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 topColour;uniform vec3 bottomColour;varying vec3 vDirection;void main(){float h=normalize(vDirection).y;vec3 col=mix(bottomColour,topColour,smoothstep(-.08,.68,h));gl_FragColor=vec4(col,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  }));
  scene.add(sky);
  function noiseTexture() {
    const size = 128, data = new Uint8Array(size * size * 4), rng = randomGenerator(410);
    for (let i = 0; i < size * size; i++) { const n = 176 + rng() * 75; data.set([n, n, n, 255], i * 4); }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(65, 160); texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
    return texture;
  }
  const terrainGeometry = new THREE.PlaneGeometry(900, 4380, 80, 540);
  terrainGeometry.rotateX(-Math.PI / 2); terrainGeometry.translate(0, 0, 1990);
  const positions = terrainGeometry.attributes.position;
  const colours = [];
  const grass = new THREE.Color('#697947'), tea = new THREE.Color('#52794b'), dry = new THREE.Color('#9c976a'), beach = new THREE.Color('#ddcfaf');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, groundHeight(x, z));
    const colour = grass.clone().lerp(tea, Math.exp(-Math.pow((z - 2070) / 580, 2)));
    colour.lerp(dry, smooth(2750, 3000, z) * (1 - smooth(3240, 3460, z)));
    colour.lerp(beach, smooth(3460, 3810, z));
    colour.multiplyScalar(.88 + .15 * Math.sin(x * .11 + z * .021));
    colours.push(colour.r, colour.g, colour.b);
  }
  terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3)); terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: noiseTexture() }));
  terrain.receiveShadow = true; scene.add(terrain);
  function ribbon(start, end, width, yOffset, mat) {
    const vertices = [], indices = [], uvs = [];
    const samples = Math.ceil((end - start) / 5);
    for (let i = 0; i <= samples; i++) {
      const z = lerp(start, end, i / samples), x = pathX(z), y = pathY(z) + yOffset;
      vertices.push(x - width / 2, y, z, x + width / 2, y, z); uvs.push(0, i / 6, 1, i / 6);
      if (i < samples) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const strip = new THREE.Mesh(geometry, mat); strip.receiveShadow = true; scene.add(strip); return strip;
  }
  ribbon(-190, 2180, 11, .18, material('#908d78'));
  ribbon(-190, 2180, 8, .25, material('#646a64'));
  ribbon(2680, 3680, 9, .18, material('#a79b7c'));
  ribbon(2680, 3550, 6.5, .24, material('#858674'));
  const dashGeometry = new THREE.BoxGeometry(.16, .015, 3.5);
  const dashes = new THREE.InstancedMesh(dashGeometry, material('#e6dfbd'), 275);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 275; i++) { const z = -120 + i * 8.2; dummy.position.set(pathX(z), pathY(z) + .29, z); dummy.rotation.y = Math.atan2(pathX(z + 2) - pathX(z - 2), 4); dummy.updateMatrix(); dashes.setMatrixAt(i, dummy.matrix); }
  scene.add(dashes);

  function makeForests() {
    const trunks = [], canopies = [], leafColours = [];
    const rng = randomGenerator(2382);
    for (let i = 0; i < 2900; i++) {
      const z = 140 + rng() * 3520;
      if (z > 1640 && z < 2170 && rng() > .13) continue;
      const x = pathX(z) + (rng() > .5 ? 1 : -1) * (24 + rng() * 315);
      if (z < 500 && Math.abs(x) < 90) continue;
      if ((x + 76) ** 2 / 70 ** 2 + (z - 865) ** 2 / 72 ** 2 < 1) continue;
      if ((x + 72) ** 2 / 67 ** 2 + (z - 1255) ** 2 / 108 ** 2 < 1) continue;
      const y = groundHeight(x, z), height = 7 + rng() * 13, spread = 3.0 + rng() * 3.8;
      trunks.push({ x, y: y + height * .38, z, sx: .45 + height * .035, sy: height * .76, sz: .5 });
      for (let c = 0; c < 5; c++) {
        canopies.push({ x: x + (rng() - .5) * spread, y: y + height * .8 + rng() * spread, z: z + (rng() - .5) * spread, sx: spread * (.7 + rng() * .3), sy: spread * (.62 + rng() * .4), sz: spread * (.7 + rng() * .4) });
        leafColours.push(new THREE.Color(z > 2820 && z < 3320 ? '#66734b' : '#3f6442').multiplyScalar(.75 + rng() * .5));
      }
    }
    const foliageGeometry = new THREE.SphereGeometry(1, 12, 8);
    const pos = foliageGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { const k = 1 + .09 * Math.sin(pos.getX(i) * 18 + pos.getY(i) * 23) * Math.cos(pos.getZ(i) * 22); pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k); }
    // Small leaf sprays break the canopy outline and give nearby foliage organic detail.
    const leafGeometry = new THREE.BufferGeometry();
    leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, -.48,.18,.36, 0,.08,1.2, 0,0,0, 0,.08,1.2, .48,.18,.36],3));
    leafGeometry.computeVertexNormals();
    const leafMaterial = material('#ffffff', { side: THREE.DoubleSide, emissive: '#466839', emissiveIntensity: .15 });
    // Spatial batches keep distant vegetation out of both the GPU and the shadow pass.
    for (let chunk = 0; chunk < 18; chunk++) {
      const g = region(chunk * 220 + 110, 550);
      const localTrunks = trunks.filter(t => Math.floor(t.z / 220) === chunk);
      const canopyIndices = canopies.map((t, i) => [t, i]).filter(([t]) => Math.floor(t.z / 220) === chunk);
      if (localTrunks.length) {
        const trunkMesh = new THREE.InstancedMesh(cylinderGeometry, material('#71664c'), localTrunks.length);
        localTrunks.forEach((t, i) => { dummy.position.set(t.x, t.y, t.z); dummy.scale.set(t.sx, t.sy, t.sz); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); trunkMesh.setMatrixAt(i, dummy.matrix); }); g.add(trunkMesh);
      }
      if (canopyIndices.length) {
        const foliage = new THREE.InstancedMesh(foliageGeometry, surfaceDetail(material('#ffffff'), 'leaves'), canopyIndices.length);
        canopyIndices.forEach(([t, colourIndex], i) => { dummy.position.set(t.x, t.y, t.z); dummy.scale.set(t.sx, t.sy, t.sz); dummy.rotation.set(0, i * .13, 0); dummy.updateMatrix(); foliage.setMatrixAt(i, dummy.matrix); foliage.setColorAt(i, leafColours[colourIndex]); }); g.add(foliage);
        const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, canopyIndices.length * 20);
        canopyIndices.forEach(([t, colourIndex], i) => {
          for (let j = 0; j < 20; j++) {
            const azimuth = j * 2.39996 + i, yy = 1 - 2 * (j + .5) / 20, radial = Math.sqrt(1 - yy * yy);
            dummy.position.set(t.x + Math.cos(azimuth) * radial * t.sx, t.y + yy * t.sy, t.z + Math.sin(azimuth) * radial * t.sz);
            dummy.rotation.set(.3 + yy, azimuth, Math.sin(j * 2.1) * .7); dummy.scale.setScalar(.35 + t.sx * .035); dummy.updateMatrix();
            leaves.setMatrixAt(i * 20 + j, dummy.matrix); leaves.setColorAt(i * 20 + j, leafColours[colourIndex]);
          }
        }); g.add(leaves);
      }
    }
  }
  makeForests();

  function airport() {
    const g = region(50, 480);
    box(g, [-32, .05, 40], [155, .1, 210], '#9d9e91');
    box(g, [-50, .2, 47], [72, .3, 36], '#dbd9c7');
    box(g, [-50, 10, 55], [68, 20, 23], '#e1ded0');
    box(g, [-50, 9, 42.8], [65, 15, .3], '#4d7780', { metalness: .3, roughness: .2 });
    for (let i = 0; i < 16; i++) {
      box(g, [-82 + i * 4.2, 9, 42.4], [.15, 16, .4], '#d2d4ca');
      box(g, [-82 + i * 4.2, 1.2, 34], [1.1, 2.4, 1.1], '#d3dadb');
    }
    for (let i = 0; i < 4; i++) box(g, [-50, 3 + i * 4, 42.3], [66, .18, .4], '#cbd2cb');
    const roof = box(g, [-50, 20.2, 50], [75, 1.1, 39], '#f1eddf'); roof.rotation.z = -.025;
    box(g, [-50, 6, 32], [70, .6, 15], '#f0eadd');
    for (const x of [-80, -61, -42, -23]) cylinder(g, [x, 3, 27], [.32, 6, .32], '#d9d9cd');
    const tower = cylinder(g, [-93, 21, 78], [3.1, 40, 3.1], '#d9dbd2');
    cylinder(g, [-93, 42, 78], [6.2, 6, 6.2], '#446b76', { metalness: .3, roughness: .3 });
    cylinder(g, [-93, 45.4, 78], [7.1, .6, 7.1], '#e5e4d7');
    const signCanvas = document.createElement('canvas'); signCanvas.width = 1024; signCanvas.height = 160;
    const ctx = signCanvas.getContext('2d'); ctx.fillStyle = '#102330'; ctx.fillRect(0, 0, 1024, 160); ctx.fillStyle = '#f6f5f0'; ctx.font = '500 70px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ARRIVALS · AYUBOWAN', 512, 106);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(39, 6.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) })); sign.position.set(-50, 16.5, 42); sign.rotation.y = Math.PI; g.add(sign);
    // A quiet arrival apron: a single aircraft, luggage, visitors, and pick-up bays.
    const plane = new THREE.Group(); plane.position.set(49, 3.9, 67); plane.rotation.y = -.22; g.add(plane);
    sphere(plane, [0, 0, 0], [1.8, 1.9, 14], '#f4f2e8', { roughness: .4, metalness: .12 });
    sphere(plane, [0, .75, 11.3], [1.48, .55, 2.15], '#344d59', { metalness: .35 });
    const wing = new THREE.Shape(); wing.moveTo(-1, -3); wing.lineTo(-17, -9); wing.lineTo(-18, -12); wing.lineTo(-1, -8); wing.closePath();
    const wingG = new THREE.ExtrudeGeometry(wing, { depth: .35, bevelEnabled: false });
    for (const side of [-1, 1]) { const w = mesh(wingG, material('#e1e1d5', { metalness: .2 }), plane, [0, -.25, 0]); w.rotation.x = Math.PI / 2; w.scale.x = side; const engine = cylinder(plane, [side * 5.3, -1.5, -2.9], [1.1, 4, 1.1], '#e6e5dc', { metalness: .2 }); engine.rotation.x = Math.PI / 2; }
    const tail = box(plane, [0, 3.6, -11.7], [.35, 7, 4], '#1e9c93'); tail.rotation.x = -.25;
    box(plane, [0, .5, -11.9], [10, .3, 3], '#d5dcd5');
    for (let i = 0; i < 10; i++) for (const side of [-1, 1]) sphere(plane, [side * 1.78, .4, 7.8 - i * 1.6], [.035, .22, .3], '#233f4c');
    for (let i = 0; i < 5; i++) {
      const x = -24 - i * 5, z = 22 + (i % 2) * 3;
      cylinder(g, [x, 1.15, z], [.22, 1.4, .22], i % 2 ? '#b9845a' : '#344c53'); sphere(g, [x, 2.0, z], [.28, .3, .28], '#b88f72');
      box(g, [x + .55, .4, z + .5], [.6, .8, .4], '#102330'); cylinder(g, [x + .55, 1.05, z + .5], [.03, .5, .03], '#a8b1ab');
    }
    box(g, [-10, 7, 114], [1, 14, 1], '#b6bcb0'); box(g, [10, 7, 114], [1, 14, 1], '#b6bcb0');
    box(g, [0, 13.3, 114], [21, 2.7, .6], '#102330');
    blobShadow(g, 49, .1, 67, 19, 16);
  }
  airport();

  const vehicle = new THREE.Group(); scene.add(vehicle);
  box(vehicle, [0, 1.4, 0], [2.8, 1.8, 5.5], '#276f77', { roughness: .35, metalness: .3 });
  box(vehicle, [0, 2.55, -.6], [2.65, 1.1, 3.75], '#326e77', { roughness: .4, metalness: .25 });
  box(vehicle, [0, 2.65, 1.32], [2.3, .72, .05], '#223d4c', { metalness: .3, roughness: .15 });
  box(vehicle, [0, 2.65, -2.49], [2.3, .72, .05], '#223d4c', { metalness: .3, roughness: .15 });
  for (const side of [-1, 1]) for (const z of [-1.7, 1.65]) { const wheel = cylinder(vehicle, [side * 1.45, .75, z], [.58, .3, .58], '#252c2d'); wheel.rotation.z = Math.PI / 2; }
  for (const side of [-1, 1]) { box(vehicle, [side * .83, 1.35, 2.78], [.5, .2, .05], '#e3e4d3', { emissive: '#a99f77', emissiveIntensity: .35 }); box(vehicle, [side * .83, 1.35, -2.78], [.48, .2, .06], '#9d5a49'); }

  // Landmark authoring is kept separate from camera motion: the world never swaps scenes.
  buildDestinations({ THREE, scene, region, box, sphere, cylinder, material, surfaceDetail, mesh, blobShadow, ribbon, pathX, pathY, groundHeight, dummy, animated, waterUniforms, journeyUniform });

  const look = new THREE.Vector3();
  function resize() {
    const width = stage.clientWidth, height = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 760 ? 1.15 : 1.5));
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = width < 760 ? 64 : 52; camera.updateProjectionMatrix();
  }
  function draw(p) {
    const rawZ = -88 + p * 3980;
    const z = rawZ > 3680 ? 3680 + (rawZ - 3680) * .32 : rawZ;
    const airportView = 1 - smooth(.012, .095, p);
    const bridgeView = smooth(2250, 2390, z) * (1 - smooth(2510, 2700, z));
    const rockView = smooth(580, 780, z) * (1 - smooth(950, 1110, z));
    const templeView = smooth(1070, 1230, z) * (1 - smooth(1350, 1500, z));
    const safariView = smooth(2930, 3100, z) * (1 - smooth(3220, 3350, z));
    const teaView = smooth(1550, 1740, z) * (1 - smooth(1990, 2150, z));
    const highland = Math.exp(-Math.pow((z - 2160) / 730, 2)), coast = smooth(3280, 3900, z);
    camera.position.set(pathX(z) + 12 * airportView + 70 * bridgeView + 24 * rockView + 19 * teaView, pathY(z) + 9 + 23 * bridgeView + 9 * rockView + 14 * teaView + 4 * safariView + 4 * coast, z);
    const ahead = z + 95;
    look.set(pathX(ahead) - 22 * airportView - 45 * rockView - 36 * templeView - 18 * safariView, pathY(ahead) + 8 + 30 * rockView - 10 * bridgeView, ahead);
    camera.lookAt(look);
    sky.position.copy(camera.position);
    const horizon = new THREE.Color('#d5d9c4').lerp(new THREE.Color('#beced5'), highland * .8).lerp(new THREE.Color('#e6c4a3'), coast);
    sky.material.uniforms.bottomColour.value.copy(horizon);
    sky.material.uniforms.topColour.value.set('#8baeba').lerp(new THREE.Color('#7c9dab'), highland * .7).lerp(new THREE.Color('#c9aba0'), coast * .85);
    scene.fog.color.copy(horizon); scene.fog.near = 160 - highland * 30; scene.fog.far = 680 - highland * 200 + coast * 250;
    sun.color.set('#ffe6bb').lerp(new THREE.Color('#eaf1f4'), highland * .65).lerp(new THREE.Color('#ffc98c'), coast);
    sun.position.set(camera.position.x - 80, camera.position.y + 110, z + 60); sun.target.position.set(pathX(z), pathY(z), z + 30);
    vehicle.visible = z < 2140 && p > .012;
    const vehicleZ = z + 24; vehicle.position.set(pathX(vehicleZ), pathY(vehicleZ) + .1, vehicleZ); vehicle.rotation.y = Math.atan2(pathX(vehicleZ + 2) - pathX(vehicleZ - 2), 4);
    journeyUniform.value = p;
    regions.forEach(g => { g.visible = g.userData.z > z - g.userData.range && g.userData.z < z + g.userData.range; });
    animated.forEach(fn => fn(p, z));
    renderer.render(scene, camera);
    canvas.dataset.renderedProgress = p.toFixed(5); canvas.dataset.cameraZ = z.toFixed(2); canvas.dataset.drawCalls = renderer.info.render.calls; canvas.dataset.triangles = renderer.info.render.triangles;
    canvas.dataset.sceneStage = labels[Math.max(0, Math.min(6, boundaries.findLastIndex(value => value <= p)))][0];
  }
  resize();
  return { draw, resize, renderer };
}

function buildDestinations(context) {
  const { THREE, scene, region, box, sphere, cylinder, material, surfaceDetail, mesh, blobShadow, ribbon, pathX, pathY, groundHeight, dummy, animated, journeyUniform } = context;
  const rng = randomGenerator(9271);

  function sea(parent, geometry, x, y, z, shore = 0) {
    const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      journey: journeyUniform, waterColour: { value: new THREE.Color('#457f82') }, shore: { value: shore },
    }]);
    uniforms.journey = journeyUniform;
    const surface = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      uniforms, fog: true, side: THREE.DoubleSide,
      vertexShader: `uniform float journey;varying vec3 vWorld;varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*.052+journey*65.)*.24+sin(p.y*.068-journey*44.)*.19;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 waterColour;uniform float journey;uniform float shore;varying vec3 vWorld;varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){float ripple=sin(vWorld.x*.15+vWorld.z*.20+journey*88.)*.5+.5;float glitter=pow(ripple,16.)*.20;vec3 col=waterColour+vec3(.13,.16,.15)*glitter;float wave=sin(vWorld.z*.32+journey*110.+sin(vWorld.x*.037)*1.5);float coast=shore>0.?exp(-abs(vWorld.z-shore-16.)*.032):0.;col=mix(col,vec3(.84,.88,.81),pow(max(0.,wave),12.)*coast*.65);gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
        }`,
    }));
    surface.rotation.x = -Math.PI / 2; surface.position.set(x, y, z); parent.add(surface); return surface;
  }

  function palms() {
    const records = [];
    for (let i = 0; i < 38; i++) {
      const z = 10 + rng() * 175, x = i < 10 ? -92 + i * 11 : (rng() > .5 ? -1 : 1) * (16 + rng() * 94);
      if (x < -20 && x > -84 && z > 30 && z < 88) continue;
      records.push({ x, z, y: groundHeight(x, z), h: 12 + rng() * 10, r: rng() * Math.PI * 2 });
    }
    for (let i = 0; i < 24; i++) { const z = 230 + i * 14; records.push({ x: pathX(z) + 23, z, y: groundHeight(pathX(z) + 23, z), h: 12 + rng() * 7, r: rng() * 6 }); }
    for (let i = 0; i < 110; i++) { const z = 3300 + rng() * 480, x = pathX(z) + (rng() > .5 ? 1 : -1) * (13 + rng() * 112); records.push({ x, z, y: groundHeight(x, z), h: 13 + rng() * 13, r: rng() * 6 }); }
    const vertices = [];
    const triangle = (a, b, c) => vertices.push(...a, ...b, ...c);
    for (let j = 0; j < 19; j++) {
      const t = (j + 1) / 20, x = t * 9, y = Math.sin(t * Math.PI) * 2.5 - t * t * 3.6;
      const span = Math.sin(t * Math.PI) * (1.1 - t * .25);
      for (const side of [-1, 1]) {
        triangle([x - .3, y, 0], [x + .52, y - .34, side * span], [x + .12, y, side * .05]);
        triangle([x - .3, y, 0], [x - .55, y - .5, side * span * .92], [x + .52, y - .34, side * span]);
      }
    }
    const frondGeometry = new THREE.BufferGeometry(); frondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); frondGeometry.computeVertexNormals();
    const palmMaterial = material('#416648', { side: THREE.DoubleSide, roughness: .9 });
    palmMaterial.onBeforeCompile = shader => { shader.uniforms.journey = journeyUniform; shader.vertexShader = 'uniform float journey;\n' + shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed=vec3(position);transformed.y+=sin(journey*32.+position.x*.4)*position.x*.055;'); };
    for (const [start, end] of [[0, 200], [220, 650], [3280, 3800]]) {
      const local = records.filter(p => p.z >= start && p.z <= end), g = region((start + end) / 2, end - start + 450);
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.26, .48, 1, 9, 8), material('#8a8064'), local.length);
      const leaves = new THREE.InstancedMesh(frondGeometry, palmMaterial, local.length * 9);
      local.forEach((p, i) => {
        dummy.position.set(p.x, p.y + p.h / 2, p.z); dummy.scale.set(1, p.h, 1); dummy.rotation.set(.06 * Math.sin(p.r), p.r, .055 * Math.cos(p.r)); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
        for (let j = 0; j < 9; j++) { dummy.position.set(p.x + Math.cos(p.r) * p.h * .035, p.y + p.h - .1, p.z); dummy.scale.set(.7 + p.h / 50, 1, .85); dummy.rotation.set((j % 3 - 1) * .12, p.r + j * Math.PI * 2 / 9, j < 3 ? .10 : -.12); dummy.updateMatrix(); leaves.setMatrixAt(i * 9 + j, dummy.matrix); }
      });
      trunks.castShadow = true; g.add(trunks, leaves);
    }
  }
  palms();

  function colombo() {
    const g = region(405, 510);
    sea(g, new THREE.PlaneGeometry(680, 820, 36, 36), 370, -1.8, 430);
    for (let i = 0; i < 21; i++) {
      const z = 220 + i * 19, x = -42 - rng() * 65, h = 13 + rng() * 46, width = 11 + rng() * 11;
      const y = groundHeight(x, z);
      box(g, [x, y + h / 2, z], [width, h, 13 + rng() * 8], i % 3 ? '#d0d3c4' : '#92a8a5');
      box(g, [x, y + h + .8, z], [width + .7, 1.2, 16], '#c1c9c1');
      for (let floor = 2; floor < h - 2; floor += 4) box(g, [x, y + floor, z - 7.05], [width - 1, 1.9, .16], '#52757c', { roughness: .35, metalness: .2 });
    }
    for (let i = 0; i < 16; i++) { const z = 220 + i * 21; box(g, [pathX(z) + 14, pathY(z) + .2, z], [12, .4, 22], '#c6c9b4'); }
    const lighthouse = cylinder(g, [78, 16, 452], [3, 32, 3], '#e3dfc9');
    cylinder(g, [78, 32.5, 452], [4, 3, 4], '#657b70');
  }
  colombo();

  function sigiriya() {
    const g = region(865, 690), centreX = -76, centreZ = 865, base = groundHeight(centreX, centreZ);
    const vertices = [], colours = [], indices = [], rings = 19, slices = 72, stone = new THREE.Color('#a67e58');
    for (let row = 0; row <= rings; row++) {
      const t = row / rings, radius = 42 - 10 * Math.pow(t, .3) + 4 * Math.sin(t * Math.PI);
      for (let col = 0; col <= slices; col++) {
        const angle = col / slices * Math.PI * 2, rough = 1 + .045 * Math.sin(angle * 11 + t * 4) + .025 * Math.sin(angle * 23 - t * 13);
        vertices.push(centreX + Math.cos(angle) * radius * rough, base + t * 79, centreZ + Math.sin(angle) * radius * .77 * rough);
        const c = stone.clone().multiplyScalar(.86 + .11 * Math.sin(t * 18) + .055 * Math.sin(angle * 18 + t * 40)); colours.push(c.r, c.g, c.b);
        if (row < rings && col < slices) { const a = row * (slices + 1) + col; indices.push(a, a + slices + 1, a + 1, a + 1, a + slices + 1, a + slices + 2); }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const rock = new THREE.Mesh(geometry, surfaceDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 'stone')); rock.castShadow = true; rock.receiveShadow = true; g.add(rock);
    const summit = cylinder(g, [centreX, base + 78.7, centreZ], [31.5, .7, 24], '#b19b74');
    for (let i = 0; i < 8; i++) { box(g, [centreX - 15 + i * 4.1, base + 79.9, centreZ + 4], [3.7, 1.8, 14], '#a77a5c'); box(g, [centreX - 14 + i * 4.1, base + 81, centreZ + 5], [3.2, .4, 12], '#b68d69'); }
    box(g, [centreX + 2, base + 79.4, centreZ - 9], [20, .8, 8], '#698b79');
    for (let i = 0; i < 7; i++) box(g, [centreX - 16 + i * 4, base + 81, centreZ - 16], [3, 3.2, 1.5], '#9b745b');
    for (let i = 0; i < 30; i++) { const y = base + 4 + i * 2.4; box(g, [centreX + 37 - i * .15, y, centreZ + 13 - i * .65], [2.7, .38, 2.2], '#8e8d78'); }
    blobShadow(g, centreX, base, centreZ, 46, 36);
  }
  sigiriya();

  function roof(parent, x, y, z, w, depth, height) {
    const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(0, height); shape.lineTo(w / 2, 0); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    const r = mesh(geometry, material('#99735d'), parent, [x, y, z - depth / 2]);
    box(parent, [x, y + .1, z], [w + 1.1, .25, depth + 1.2], '#a07f63'); return r;
  }
  function kandy() {
    const g = region(1260, 620);
    const shape = new THREE.Shape();
    for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, r = 1 + .075 * Math.sin(a * 3); const x = Math.cos(a) * 50 * r, y = Math.sin(a) * 84 * r; if (!i) shape.moveTo(x, y); else shape.lineTo(x, y); }
    const lake = sea(g, new THREE.ShapeGeometry(shape), -72, pathY(1255) - 1.2, 1255);
    const x = -84, z = 1340, y = groundHeight(x, z) + .2;
    box(g, [x, y + 4.4, z], [45, 8.8, 17], '#eee8d7'); roof(g, x, y + 8.8, z, 50, 21, 6);
    box(g, [x, y + 11.5, z], [24, 5, 13], '#eee9d7'); roof(g, x, y + 14, z, 30, 16, 4);
    for (let i = 0; i < 10; i++) {
      cylinder(g, [x - 20 + i * 4.5, y + 4.5, z - 10.1], [.23, 9, .23], '#e0decd');
      box(g, [x - 19 + i * 4.2, y + 4.8, z - 8.7], [2, 3.7, .12], '#556b66');
    }
    for (const side of [-1, 1]) { box(g, [x + side * 28, y + 5, z], [9, 10, 12], '#e7e1d0'); roof(g, x + side * 28, y + 10, z, 13, 15, 5); }
    for (let i = 0; i < 35; i++) { const a = i / 35 * Math.PI * 2, xx = -72 + Math.cos(a) * 54, zz = 1255 + Math.sin(a) * 89; cylinder(g, [xx, groundHeight(xx, zz) + 1.1, zz], [.16, 2.2, .16], '#dad9c6'); }
  }
  kandy();

  function teaEstates() {
    const leafGeometry = new THREE.SphereGeometry(1, 12, 8), colour = surfaceDetail(material('#4c8050'), 'leaves');
    for (let chunk = 0; chunk < 5; chunk++) {
      const g = region(1640 + chunk * 125, 440), records = [];
      for (const side of [-1, 1]) for (let row = 0; row < 18; row++) for (let col = 0; col < 22; col++) {
        const z = 1580 + chunk * 125 + col * 5.4 + Math.sin(row * .22) * 10;
        const x = pathX(z) + side * (19 + row * 5 + Math.sin(z * .009) * 4);
        records.push({ x: x + (rng() - .5) * .8, z: z + (rng() - .5), y: groundHeight(x, z) + .85 });
      }
      const bushes = new THREE.InstancedMesh(leafGeometry, colour, records.length);
      records.forEach((p, i) => { dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, i * .37, 0); dummy.scale.set(2.35, 1.4, 2.1); dummy.updateMatrix(); bushes.setMatrixAt(i, dummy.matrix); bushes.setColorAt(i, new THREE.Color('#ffffff').multiplyScalar(.85 + rng() * .3)); });
      g.add(bushes);
    }
    const g = region(1970, 440), x = pathX(1965) - 75, y = groundHeight(x, 1965);
    box(g, [x, y + 6, 1965], [36, 12, 17], '#e0dbc9'); roof(g, x, y + 12, 1965, 41, 22, 5);
    for (let i = 0; i < 9; i++) box(g, [x - 16 + i * 4, y + 7, 1956.4], [2, 4, .2], '#426666');
    cylinder(g, [x - 24, y + 16, 1975], [1.4, 32, 1.4], '#af9272');
  }
  teaEstates();

  function railway() {
    ribbon(2110, 2730, 4.5, .35, material('#797b70'));
    ribbon(2110, 2730, .15, .58, material('#b4beb8', { metalness: .7, roughness: .35 })).position.x = -1.1;
    ribbon(2110, 2730, .15, .58, material('#b4beb8', { metalness: .7, roughness: .35 })).position.x = 1.1;
    const g = region(2430, 570), sleeperGeometry = new THREE.BoxGeometry(3.1, .16, .3), sleepers = new THREE.InstancedMesh(sleeperGeometry, material('#6d695c'), 420);
    for (let i = 0; i < 420; i++) { const z = 2110 + i * 1.48; dummy.position.set(pathX(z), pathY(z) + .43, z); dummy.rotation.set(0, Math.atan2(pathX(z + 2) - pathX(z - 2), 4), 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); sleepers.setMatrixAt(i, dummy.matrix); } g.add(sleepers);
    const tunnelGroup = region(2220, 450), tx = pathX(2220), ty = pathY(2220);
    const tunnel = new THREE.Shape(); tunnel.moveTo(-16, -1); tunnel.lineTo(-16, 9); tunnel.absellipse(0, 9, 16, 16, Math.PI, 0, true); tunnel.lineTo(16, -1); tunnel.closePath();
    const hole = new THREE.Path(); hole.moveTo(-8, -1.1); hole.lineTo(-8, 7); hole.absellipse(0, 7, 8, 11, Math.PI, 0, true); hole.lineTo(8, -1.1); hole.closePath(); tunnel.holes.push(hole);
    const tunnelMesh = mesh(new THREE.ExtrudeGeometry(tunnel, { depth: 76, bevelEnabled: false, curveSegments: 28 }), material('#656a58'), tunnelGroup, [tx, ty, 2184]);
    for (const side of [-1, 1]) box(tunnelGroup, [tx + side * 7.3, ty + 3, 2222], [.1, .1, 69], '#cad1b9', { emissive: '#a5b8a3', emissiveIntensity: .35 });
    const bridgeGroup = region(2450, 580), bx = pathX(2450), by = 60;
    const archBand = new THREE.Shape();
    archBand.moveTo(-8, -.4); archBand.lineTo(8, -.4); archBand.lineTo(8, -45); archBand.lineTo(6, -45); archBand.lineTo(6, -22);
    archBand.absellipse(0, -22, 6, 14, 0, Math.PI, false); archBand.lineTo(-6, -45); archBand.lineTo(-8, -45); archBand.closePath();
    const archGeometry = new THREE.ExtrudeGeometry(archBand, { depth: 6, bevelEnabled: false, curveSegments: 24 });
    for (let i = 0; i < 9; i++) { const bridge = mesh(archGeometry, material('#a99b7c'), bridgeGroup, [bx + 3, by, 2450 - 64 + i * 16]); bridge.rotation.y = -Math.PI / 2; }
    box(bridgeGroup, [bx, by + .02, 2450], [8, .8, 154], '#b6a68a');
    for (const side of [-1, 1]) { box(bridgeGroup, [bx + side * 3.8, by + 1.1, 2450], [.3, 1.3, 154], '#b6a68a'); }
    const train = new THREE.Group(); g.add(train);
    const carriages = [], wheels = [];
    for (let car = 0; car < 4; car++) {
      const carriage = new THREE.Group(); train.add(carriage); carriages.push(carriage);
      box(carriage, [0, 2.65, 0], [3.3, 3.1, 15.5], '#347faa', { roughness: .55, metalness: .2 });
      const carriageRoof = cylinder(carriage, [0, 4.17, 0], [1.7, 15.5, .55], '#a2b9be'); carriageRoof.rotation.x = Math.PI / 2;
      box(carriage, [0, 1.25, 0], [3.1, .75, 15.6], '#33698b');
      for (const side of [-1, 1]) {
        for (let w = 0; w < 8; w++) box(carriage, [side * 1.66, 3.05, -6.1 + w * 1.7], [.035, 1.1, 1.05], '#284550', { roughness: .25, metalness: .3 });
        box(carriage, [side * 1.67, 3.9, 0], [.05, .16, 15.5], '#d5dfdb');
        for (const axle of [-5.2, 5.2]) { const wheel = cylinder(carriage, [side * 1.35, .65, axle], [.64, .32, .64], '#303a3c', { metalness: .35 }); wheel.rotation.z = Math.PI / 2; wheels.push(wheel); }
      }
      for (let vent = 0; vent < 5; vent++) box(carriage, [0, 4.8, -5.4 + vent * 2.5], [1, .15, .7], '#798f91');
      box(carriage, [0, 2.65, 7.8], [2.8, 2.5, .07], '#4a82a1');
    }
    animated.push((p, cameraZ) => {
      train.visible = cameraZ > 2120 && cameraZ < 2800;
      const front = clamp(cameraZ + 39, 2288, 2790);
      carriages.forEach((carriage, i) => { const z = front - i * 17; carriage.position.set(pathX(z), pathY(z) + .6, z); carriage.rotation.y = Math.atan2(pathX(z + 2) - pathX(z - 2), 4); });
      wheels.forEach(wheel => { wheel.rotation.x = p * 390; });
    });
  }
  railway();

  function ella() {
    const g = region(2670, 510), wx = -78, wz = 2700, y = groundHeight(wx, wz);
    const cliff = sphere(g, [wx, y + 15, wz], [27, 46, 20], '#8b8b6b');
    const falls = mesh(new THREE.PlaneGeometry(7, 59, 7, 25), material('#dbe1d1', { transparent: true, opacity: .84, side: THREE.DoubleSide, roughness: .25 }), g, [wx + 7, y + 23, wz - 18]); falls.rotation.y = Math.PI;
    const waterfallMaterial = falls.material;
    waterfallMaterial.onBeforeCompile = shader => { shader.uniforms.journey = journeyUniform; shader.vertexShader = 'uniform float journey;\n' + shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed=vec3(position);transformed.z+=sin(position.y*.8-journey*220.+position.x*3.)*.25;'); };
    sphere(g, [wx + 7, y - 6, wz - 18], [11, .4, 9], '#658c82');
    for (let i = 0; i < 6; i++) { const z = 2640 + i * 17, x = pathX(z) + 20; box(g, [x, groundHeight(x, z) + 2, z], [7, 4, 9], '#d6d3bc'); roof(g, x, groundHeight(x, z) + 4, z, 9, 11, 2.8); }
  }
  ella();

  function elephant(parent, x, z, size, yaw, tusks = false) {
    const group = new THREE.Group(); group.position.set(x, groundHeight(x, z), z); group.rotation.y = yaw; group.scale.setScalar(size); parent.add(group);
    const skin = '#777d6b';
    sphere(group, [0, 3.8, 0], [2.4, 2.9, 3.7], skin);
    sphere(group, [0, 5.0, 2.65], [1.5, 1.8, 1.6], skin);
    sphere(group, [0, 5.8, 2.85], [1.22, 1.2, 1.25], skin);
    for (const side of [-1, 1]) {
      const ear = sphere(group, [side * 1.3, 4.95, 2.65], [1.35, 1.8, .3], '#6f7867'); ear.rotation.y = side * .36; ear.rotation.z = side * -.15;
      sphere(group, [side * 1.1, 5.65, 3.55], [.075, .075, .075], '#263329');
    }
    const legs = [];
    for (const x of [-1.4, 1.4]) for (const z of [-2.2, 2.1]) {
      const leg = cylinder(group, [x, 1.8, z], [.68, 3.6, .75], skin); legs.push(leg);
      sphere(group, [x, .35, z + .12], [.76, .36, .8], '#697461');
    }
    const trunkCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 5.0, 3.65), new THREE.Vector3(0, 3.5, 4.0), new THREE.Vector3(.25, 1.8, 4.2), new THREE.Vector3(.5, .6, 4.0), new THREE.Vector3(.75, .5, 4.3)]);
    mesh(new THREE.TubeGeometry(trunkCurve, 32, .39, 12, false), material(skin), group, [0, 0, 0]);
    if (tusks) for (const side of [-1, 1]) { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(side * .7, 4.25, 3.8), new THREE.Vector3(side * .75, 3.5, 4.8), new THREE.Vector3(side * .85, 3.8, 5.5)]); mesh(new THREE.TubeGeometry(curve, 20, .12, 8, false), material('#c8c3a6'), group, [0, 0, 0]); }
    const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 4.1, -3.5), new THREE.Vector3(.2, 2.4, -3.95), new THREE.Vector3(.4, 1.4, -3.7)]);
    mesh(new THREE.TubeGeometry(tailCurve, 12, .09, 6, false), material('#66715e'), group, [0, 0, 0]);
    blobShadow(parent, x, groundHeight(x, z), z, size * 3.1, size * 4.4);
    animated.push(p => { group.position.x = x + Math.sin(p * 34) * 1.5; group.rotation.y = yaw + Math.sin(p * 26) * .035; legs.forEach((leg, i) => { leg.rotation.x = Math.sin(p * 46 + i * Math.PI) * .10; }); });
  }
  function safari() {
    const g = region(3120, 480);
    elephant(g, -31, 3150, 1.25, 1.3, true); elephant(g, -39, 3164, 1.1, 1.2); elephant(g, -35, 3171, .58, 1.15);
    for (let i = 0; i < 22; i++) {
      const z = 2940 + rng() * 370, x = (rng() > .5 ? 1 : -1) * (24 + rng() * 100), y = groundHeight(x, z);
      cylinder(g, [x, y + 5, z], [.45, 10, .45], '#7e7760');
      sphere(g, [x, y + 11, z], [9 + rng() * 4, 2.9, 7 + rng() * 3], '#6a7749');
    }
  }
  safari();

  function coast() {
    const g = region(3650, 900);
    sea(g, new THREE.PlaneGeometry(1700, 1400, 55, 70), 0, -.34, 4500, 3800);
    for (let i = 0; i < 7; i++) { const x = -48 - i * 8, z = 3450 + i * 33, y = groundHeight(x, z); box(g, [x, y + 2.4, z], [9, 4.8, 8], '#dddbc3'); roof(g, x, y + 4.8, z, 12, 11, 3); }
    const sunset = new THREE.Mesh(new THREE.SphereGeometry(26, 32, 20), new THREE.MeshBasicMaterial({ color: '#f5d5aa' })); sunset.position.set(-300, 74, 4400); g.add(sunset);
    const boat = new THREE.Group(); boat.position.set(48, -.2, 3880); boat.rotation.y = .5; g.add(boat);
    sphere(boat, [0, .1, 0], [1.6, .65, 5.1], '#bdad80'); box(boat, [0, .6, 0], [2.4, .16, 8.2], '#c7b992');
    animated.push(p => { boat.rotation.z = Math.sin(p * 42) * .035; boat.position.y = -.16 + Math.sin(p * 65) * .17; });
  }
  coast();

  function atmosphere() {
    const cloudMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { journey: journeyUniform },
      vertexShader: 'varying vec2 vUv;uniform float journey;void main(){vUv=uv;vec3 p=position;p.x+=sin(journey*6.+p.y*.01)*3.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: 'varying vec2 vUv;void main(){vec2 q=(vUv-.5)*2.;float d=dot(q*vec2(.9,1.3),q*vec2(.9,1.3));float n=sin(q.x*16.+sin(q.y*8.))*sin(q.y*13.+q.x*4.);float a=exp(-d*3.5)*(.18+n*.035);gl_FragColor=vec4(.84,.88,.84,a);}',
    });
    for (let i = 0; i < 12; i++) { const z = 1500 + i * 90, g = region(z, 430), cloud = new THREE.Mesh(new THREE.PlaneGeometry(210, 80), cloudMaterial); cloud.position.set((i % 2 ? -1 : 1) * 25, pathY(z) + 31 + (i % 3) * 8, z); g.add(cloud); }
    const birds = region(2600, 750);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute([-.9, .18, 0, 0, 0, .17, .9, .18, 0], 3));
    const flock = [];
    for (let i = 0; i < 8; i++) { const bird = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#405849', side: THREE.DoubleSide })); birds.add(bird); flock.push(bird); }
    animated.push(p => { flock.forEach((bird, i) => { bird.position.set(-35 + i * 4 + Math.sin(p * 12 + i) * 7, 123 + i % 3 * 3, 2510 + i * 7 + p * 40); bird.rotation.z = Math.sin(p * 105 + i) * .25; }); });
  }
  atmosphere();
}

try {
  world = buildWorld();
  stage.classList.toggle('reduced-motion', motion.matches);
  scrollProgress(); progress = target; interfaceAt(progress); world.draw(progress);
  stage.classList.add('cinema-ready'); canvas.dataset.renderState = 'ready';
  document.getElementById('world-status').textContent = '';
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); stage.classList.add('world-unavailable'); document.getElementById('world-status').textContent = 'Explore our destinations while the immersive journey is unavailable.'; });
  canvas.addEventListener('webglcontextrestored', () => { stage.classList.remove('world-unavailable'); world.resize(); wake(); });
} catch (error) {
  stage.classList.add('world-unavailable'); canvas.dataset.renderState = 'unavailable';
  document.getElementById('world-status').textContent = 'The immersive journey is unavailable in this browser. Explore our destinations below.';
  document.getElementById('start-journey').addEventListener('click', () => document.getElementById('destinations').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' }));
  console.error('Journey initialization failed:', error);
}
