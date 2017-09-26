import 'http://cdnjs.cloudflare.com/ajax/libs/three.js/87/three.min.js';
import 'rodinvendor/vendor.js';
import * as RODIN from 'rodin/core/index.js';

RODIN.start();

const box = new RODIN.Box();

RODIN.Scene.add(box);
box.position.set(0, 1.6, -2);
box.on(RODIN.CONST.UPDATE, () => {
    box.rotation.x += 0.001 * RODIN.Time.delta;
    box.rotation.y += 0.001 * RODIN.Time.delta;
});
