import * as RODIN from 'rodin/main';

window.R = RODIN;
RODIN.start();
const box = new RODIN.Box(new THREE.MeshNormalMaterial());

RODIN.Scene.add(box);
box.position.set(0, 1.6, -2);
box.on(RODIN.CONST.UPDATE, () => {
    box.rotation.x += 0.001 * RODIN.Time.delta;
    box.rotation.y += 0.001 * RODIN.Time.delta;
});
