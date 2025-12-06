import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// --- Configuration ---
const COLORS = {
  bg: 0xe8e3d5,
  teal: 0xa9ddd3,
  black: 0x141414,
  white: 0xffffff,
  outline: 0x010101,
  gold: 0xe5c06e,
  darkGrey: 0x2a2a2a,
  highlight: 0x555555
};

const CATEGORIES = {
  PHYSICAL: 'Physical',
  DIGITAL: 'Digital',
  BRIDGE: 'Bridge',
  NONE: 'None'
};

const INFO_CONTENT = {
    HOUSE: {
        title: "Real Estate Tokenization",
        text: "Fractional ownership of residential and commercial properties. Earn yield from rental income distributed directly to your wallet."
    },
    FACTORY: {
        title: "Industrial Infrastructure",
        text: "Invest in heavy machinery and production facilities. High-capital assets made accessible via Rialo."
    },
    GOLD: {
        title: "Commodities & Metals",
        text: "100% asset-backed tokens representing physical gold and precious metals stored in audited vaults."
    },
    BRIDGE: {
        title: "The Rialo Protocol",
        text: "The secure gateway bridging off-chain assets to on-chain liquidity with full regulatory compliance."
    },
    AGENT: {
        title: "AI Agent Economy",
        text: "Autonomous agents monitoring markets, executing arbitrage, and optimizing portfolios 24/7."
    }
};

// --- STAGE DEFINITIONS ---
const STAGES = [
  {
    id: 'intro',
    title: 'The Disconnect',
    text: 'For too long, the physical world of assets and the digital world of liquidity have been separated by a chasm of inefficiency.',
    cameraPos: new THREE.Vector3(0, 30, 40),
    cameraLookAt: new THREE.Vector3(0, -5, 0), 
    activeGroups: [] as string[],
    allowOrbit: false
  },
  {
    id: 'rwa',
    title: 'Stage 1: Real World Foundation',
    text: 'It starts with tangible value. Real estate, gold, and industrial infrastructure form the bedrock of the global economy.',
    cameraPos: new THREE.Vector3(-15, 12, 15),
    cameraLookAt: new THREE.Vector3(-5, -4, 0),
    activeGroups: ['physical_base'],
    allowOrbit: false
  },
  {
    id: 'tokenization',
    title: 'Stage 2: Tokenization',
    text: 'Rialo digitizes these assets. We verify ownership and lock the asset, creating a compliant digital twin ready for the blockchain.',
    cameraPos: new THREE.Vector3(-10, 8, 10),
    cameraLookAt: new THREE.Vector3(-4, -4, 0),
    activeGroups: ['physical_base', 'physical_assets'],
    allowOrbit: false
  },
  {
    id: 'bridge',
    title: 'Stage 3: The Rialo Bridge',
    text: 'The Rialo Protocol acts as the bridge. A legally binding layer that ensures atomic settlement between the physical and digital realms.',
    cameraPos: new THREE.Vector3(0, 15, 20),
    cameraLookAt: new THREE.Vector3(0, -4, 0),
    activeGroups: ['physical_base', 'physical_assets', 'bridge'],
    allowOrbit: false
  },
  {
    id: 'digital',
    title: 'Stage 4: The Agent Economy',
    text: 'Assets enter the digital ecosystem. Here, AI Agents can autonomously trade and manage these assets with superhuman efficiency.',
    cameraPos: new THREE.Vector3(15, 12, 15),
    cameraLookAt: new THREE.Vector3(5, -4, 0),
    activeGroups: ['physical_base', 'physical_assets', 'bridge', 'digital_base', 'agents'],
    allowOrbit: false
  },
  {
    id: 'explore',
    title: 'Rialo: Coding the Real World',
    text: 'A unified economy where code governs real world value. Explore the ecosystem by clicking on the assets.',
    cameraPos: new THREE.Vector3(20, 20, 20),
    cameraLookAt: new THREE.Vector3(0, -5, 0),
    activeGroups: ['physical_base', 'physical_assets', 'bridge', 'digital_base', 'agents'],
    allowOrbit: true
  }
];

// --- Scene Setup ---
const container = document.getElementById('root');
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.bg);
scene.fog = new THREE.Fog(COLORS.bg, 20, 60);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(STAGES[0].cameraPos);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.SoftShadowMap;
if (container) container.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(15, 25, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0001;
const d = 25;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// --- Materials ---
const matPhysical = new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.2 });
const matRoof = new THREE.MeshStandardMaterial({ color: COLORS.black, roughness: 0.5 });
const matGold = new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.1, metalness: 0.6 });
const matDigital = new THREE.MeshStandardMaterial({ color: COLORS.teal, roughness: 0.2, transparent: true, opacity: 0.9 });
const matDigitalDark = new THREE.MeshStandardMaterial({ color: COLORS.black, roughness: 0.2 });
const matBridge = new THREE.MeshStandardMaterial({ color: COLORS.teal, emissive: COLORS.teal, emissiveIntensity: 0.4 });
const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.outline, opacity: 0.2, transparent: true });

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const edgesGeo = new THREE.EdgesGeometry(boxGeo);

// --- Voxel Logic ---
interface Voxel {
    mesh: THREE.Mesh;
    group: string;
    baseY: number;
    delay: number;
}
const voxels: Voxel[] = [];

// Helper to clone material
function getMat(mat: THREE.Material) { return mat.clone(); }

function createVoxel(x: number, y: number, z: number, material: THREE.Material, parent: THREE.Object3D, group: string, info?: any) {
    const mesh = new THREE.Mesh(boxGeo, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(0, 0, 0); // Start invisible
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Outline
    const edges = new THREE.LineSegments(edgesGeo, lineMaterial);
    mesh.add(edges);
    
    if (info) {
        mesh.userData.info = info;
    }
    
    parent.add(mesh);
    
    // Wave effect delay
    const delay = Math.sqrt(x*x + z*z) * 0.05;

    voxels.push({
        mesh,
        group,
        baseY: y,
        delay
    });
    
    return mesh;
}

// --- World Generation ---
const worldGroup = new THREE.Group();
scene.add(worldGroup);

// 1. Physical Base
const physGroup = new THREE.Group();
worldGroup.add(physGroup);
for (let x = -9; x <= -2; x++) {
  for (let z = -5; z <= 5; z++) {
    createVoxel(x, 0, z, matPhysical, physGroup, 'physical_base');
  }
}

// 2. Physical Assets
// House
for(let x=-7; x<=-5; x++) {
  for(let z=-2; z<=0; z++) {
    createVoxel(x, 1, z, getMat(matPhysical), physGroup, 'physical_assets', INFO_CONTENT.HOUSE);
    createVoxel(x, 2, z, getMat(matPhysical), physGroup, 'physical_assets', INFO_CONTENT.HOUSE);
    createVoxel(x, 3, z, getMat(matRoof), physGroup, 'physical_assets', INFO_CONTENT.HOUSE);
  }
}
// Factory
createVoxel(-4, 1, 3, getMat(matRoof), physGroup, 'physical_assets', INFO_CONTENT.FACTORY);
createVoxel(-4, 2, 3, getMat(matRoof), physGroup, 'physical_assets', INFO_CONTENT.FACTORY);
createVoxel(-4, 3, 3, getMat(matRoof), physGroup, 'physical_assets', INFO_CONTENT.FACTORY); // Chimney
for(let x=-6; x<=-4; x++) {
  for(let z=2; z<=3; z++) {
      if(x===-4 && z===3) continue;
      createVoxel(x, 1, z, getMat(matPhysical), physGroup, 'physical_assets', INFO_CONTENT.FACTORY);
  }
}
// Gold
createVoxel(-3, 1, -3, getMat(matGold), physGroup, 'physical_assets', INFO_CONTENT.GOLD);
createVoxel(-3, 2, -3, getMat(matGold), physGroup, 'physical_assets', INFO_CONTENT.GOLD);
createVoxel(-2, 1, -3, getMat(matGold), physGroup, 'physical_assets', INFO_CONTENT.GOLD);

// 3. Bridge
const bridgeGroup = new THREE.Group();
worldGroup.add(bridgeGroup);
for(let x=-1; x<=1; x++) {
  for(let z=-2; z<=2; z++) {
      createVoxel(x, 0, z, matBridge, bridgeGroup, 'bridge');
  }
}
// Arch
const archCoords = [
    [0, 1, -1], [0, 2, -1], [0, 3, -1],
    [0, 3, 0], 
    [0, 3, 1], [0, 2, 1], [0, 1, 1]
];
archCoords.forEach(([x,y,z]) => createVoxel(x, y, z, getMat(matBridge), bridgeGroup, 'bridge', INFO_CONTENT.BRIDGE));


// 4. Digital Base & Agents
const digiGroup = new THREE.Group();
worldGroup.add(digiGroup);
for (let x = 2; x <= 9; x++) {
  for (let z = -5; z <= 5; z++) {
    if ((x + z) % 2 === 0 || Math.random() > 0.4) {
      createVoxel(x, 0, z, matDigitalDark, digiGroup, 'digital_base');
    }
  }
}
// Floating Agents
const agentLocs = [
    [4, 2, 2], [5, 2, 2], [4, 2, 3], // Cluster
    [7, 3, -2], [7, 4, -2], // Stack
    [6, 2, 0], [8, 3, 3]
];
const floatingAgents: { mesh: THREE.Mesh, baseY: number, speed: number, offset: number }[] = [];
agentLocs.forEach(([x,y,z]) => {
    const mesh = createVoxel(x, y, z, getMat(matDigital), digiGroup, 'agents', INFO_CONTENT.AGENT);
    floatingAgents.push({
        mesh,
        baseY: y,
        speed: 1 + Math.random(),
        offset: Math.random() * 10
    });
});


// --- State Management ---
let currentStageIndex = 0;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false;

// UI Refs
const uiTitle = document.getElementById('stage-title');
const uiText = document.getElementById('stage-description');
const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
const dotsContainer = document.getElementById('dots-container');
const detailModal = document.getElementById('detail-modal');

// Init Dots
STAGES.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (idx === 0) dot.classList.add('active');
    dotsContainer?.appendChild(dot);
});

function updateStage(index: number) {
    if (index < 0 || index >= STAGES.length) return;
    currentStageIndex = index;
    const stage = STAGES[index];

    // Update Text
    if (uiTitle) uiTitle.textContent = stage.title;
    if (uiText) uiText.textContent = stage.text;

    // Update Nav Buttons
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
        nextBtn.disabled = index === STAGES.length - 1;
        // Optionally change icon/text on last step
    }

    // Update Dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    // Controls
    controls.enabled = stage.allowOrbit;
    controls.autoRotate = stage.allowOrbit;
    controls.autoRotateSpeed = 1.0;
}

prevBtn?.addEventListener('click', () => updateStage(currentStageIndex - 1));
nextBtn?.addEventListener('click', () => updateStage(currentStageIndex + 1));

// Initial call
updateStage(0);


// --- Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObj: THREE.Mesh | null = null;
let originalEmissive = new THREE.Color();

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.style.left = e.clientX + 'px';
        tooltip.style.top = e.clientY + 'px';
    }
});

window.addEventListener('click', (e) => {
    if (hoveredObj && hoveredObj.userData.info && !detailModal?.classList.contains('active')) {
        const info = hoveredObj.userData.info;
        const mTitle = document.getElementById('modal-title');
        const mDesc = document.getElementById('modal-description');
        if (mTitle) mTitle.textContent = info.title;
        if (mDesc) mDesc.textContent = info.text;
        detailModal?.classList.remove('hidden');
        
        // Stop rotation while reading
        controls.autoRotate = false;
    }
});

document.getElementById('close-modal')?.addEventListener('click', () => {
    detailModal?.classList.add('hidden');
    if (STAGES[currentStageIndex].allowOrbit) {
        controls.autoRotate = true;
    }
});

// --- Animation Loop ---
const clock = new THREE.Clock();
const targetLookAt = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const dt = clock.getDelta(); 

    const currentStage = STAGES[currentStageIndex];

    // 1. Camera Animation
    if (!currentStage.allowOrbit) {
        // Smoothly interpolate position
        camera.position.lerp(currentStage.cameraPos, 0.04);
        
        // Smoothly interpolate lookAt target
        targetLookAt.lerp(currentStage.cameraLookAt, 0.04);
        controls.target.copy(targetLookAt);
    } else {
        // In orbit mode, we update orbit controls
        controls.update();
    }

    // 2. Voxel Animation (Visibility based on stage active groups)
    voxels.forEach(v => {
        const isActive = currentStage.activeGroups.includes(v.group);
        
        let targetScale = 0;
        if (isActive) targetScale = 1;
        
        const currentScale = v.mesh.scale.x;
        // Linear interpolate scale
        if (Math.abs(currentScale - targetScale) > 0.01) {
            const speed = 0.1;
            v.mesh.scale.setScalar(currentScale + (targetScale - currentScale) * speed);
        } else {
            v.mesh.scale.setScalar(targetScale);
        }
    });

    // 3. Floating Agents Animation
    if (currentStage.activeGroups.includes('agents')) {
        floatingAgents.forEach(agent => {
            if (agent.mesh.scale.x > 0.9) {
                agent.mesh.position.y = agent.baseY + Math.sin(time * agent.speed + agent.offset) * 0.2;
            }
        });
    }

    // 4. Raycasting / Interaction
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(worldGroup.children, true);
    
    // Reset previous hover
    // Check if we moved off the hovered object, OR if we are now hitting something else
    // We check if the intersected object is NOT the current hovered object
    // Also handle the edge case where we hit the outline (child) but hovered the parent
    let isSameObject = false;
    if (intersects.length && hoveredObj) {
        let hitObj = intersects[0].object;
        if (hitObj.type === 'LineSegments' && hitObj.parent) hitObj = hitObj.parent;
        if (hitObj === hoveredObj) isSameObject = true;
    }

    if (hoveredObj && !isSameObject) {
        if (hoveredObj.material instanceof THREE.MeshStandardMaterial) {
            hoveredObj.material.emissive.copy(originalEmissive);
        }
        hoveredObj = null;
        document.body.style.cursor = 'default';
        const tooltip = document.getElementById('tooltip');
        if(tooltip) tooltip.style.opacity = '0';
    }

    if (intersects.length) {
        let obj = intersects[0].object as THREE.Mesh;
        
        // Handle clicking on edges (LineSegments), bubble up to Box Mesh
        if (obj.type === 'LineSegments' && obj.parent) {
            obj = obj.parent as THREE.Mesh;
        }

        // Check if object has info AND is fully visible (scale ~ 1)
        // This enables interaction at ANY stage, provided the object is rendered
        if (obj.userData.info && obj.scale.x > 0.8) {
            if (obj !== hoveredObj) {
                hoveredObj = obj;
                if (obj.material instanceof THREE.MeshStandardMaterial) {
                    originalEmissive.copy(obj.material.emissive);
                    obj.material.emissive.setHex(COLORS.highlight);
                }
            }
            document.body.style.cursor = 'pointer';
            const tooltip = document.getElementById('tooltip');
            if(tooltip) {
                tooltip.textContent = "Click to Inspect";
                tooltip.style.opacity = '1';
            }
        }
    }

    // Always update controls if not manual (for damping)
    if (!currentStage.allowOrbit) {
        camera.lookAt(targetLookAt);
    }

    renderer.render(scene, camera);
}

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();