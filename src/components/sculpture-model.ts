import * as THREE from "three";

/** An original split letterform. Each half has a shell, a lime core and a face. */
export function createLetterform() {
  const outline = new THREE.Shape();
  outline.moveTo(0, 0);
  outline.lineTo(1.04, 1.82);
  outline.lineTo(2.02, 1.82);
  outline.lineTo(.98, 0);
  outline.lineTo(2.02, -1.82);
  outline.lineTo(1.04, -1.82);
  outline.closePath();

  const plate = (depth: number, bevel: number) => {
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth, bevelEnabled: true, bevelSegments: 4, steps: 1,
      bevelSize: bevel, bevelThickness: bevel, curveSegments: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  };
  const shellGeometry = plate(.48, .09);
  const coreGeometry = plate(.075, .025);
  const faceGeometry = plate(.16, .085);
  const graphite = new THREE.MeshStandardMaterial({ color: 0x242824, metalness: .62, roughness: .38 });
  const aluminium = new THREE.MeshPhysicalMaterial({ color: 0xaeb7a8, metalness: .87, roughness: .31, anisotropy: .6, anisotropyRotation: Math.PI / 2 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x8f978d, metalness: .94, roughness: .22 });
  const lime = new THREE.MeshStandardMaterial({ color: 0xc5f146, metalness: .08, roughness: .44 });
  const root = new THREE.Group();
  const halves = [-1, 1].map((side) => {
    const group = new THREE.Group();
    group.scale.x = side;
    const shell = new THREE.Mesh(shellGeometry, [graphite, edge]);
    const core = new THREE.Mesh(coreGeometry, lime);
    const face = new THREE.Mesh(faceGeometry, [side === -1 ? aluminium : graphite, edge]);
    group.add(shell, core, face);
    root.add(group);
    return { side, group, shell, core, face };
  });
  return {
    root,
    pose(split: number, layers: number, turn: number) {
      for (const { side, group, shell, core, face } of halves) {
        group.position.x = side * (.025 + split * .33);
        group.rotation.y = side * turn;
        shell.position.z = -.20 - layers * .50;
        core.position.z = .18;
        face.position.z = .40 + layers * .50;
      }
    },
    dispose() {
      [shellGeometry, coreGeometry, faceGeometry].forEach(item => item.dispose());
      [graphite, aluminium, edge, lime].forEach(item => item.dispose());
    },
  };
}
