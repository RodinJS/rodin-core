import * as RODIN from 'rodin/main';

RODIN.start();

const box = new RODIN.Box();

RODIN.Scene.add(box);
box.position.set(0, 1.6, -2);
box.on(RODIN.CONST.UPDATE, () => {
    box.rotation.x += 0.001 * RODIN.Time.delta;
    box.rotation.y += 0.001 * RODIN.Time.delta;
});
