import * as ajax from "../third_party/rodin-sandbox/lib/ajax.js";
import * as path from "../third_party/rodin-sandbox/lib/path.js";
import {JSHandler} from "../third_party/rodin-sandbox/lib/JSHandler.js";
import * as semver from '../third_party/semver/semver.js';
import * as RodinPackage from './RodinPackage.js';
import {CustomWindow} from './Window.js';
import {watchFor} from "./watcher.js";

let cdn_url = 'https://cdn.rodin.io/';
const default_env = 'prod';

const getURL = (filename, urlMap = null) => {

    if (urlMap !== null) {
        for (let i in urlMap) {
            if (filename.startsWith(i)) {
                return path.join(urlMap[i], filename.substring(i.length));
            }
        }
    }

    if (path.getFile(window.location.href).indexOf(".") !== -1) {
        return path.join(path.getDirectory(window.location.href), filename);
    }

    return path.join(window.location.href, filename);
};

const getManifest = () => {
    return ajax.get(getURL('rodin_package.json')).then((data) => {

        const dependencyMap = {};

        const _resolveManifest = (pkg) => {
            // const pkg = JSON.parse(manifest);
            const env = pkg.env || default_env;
            console.log(`Running ${pkg.name}...`);

            const promises = [];

            for (let i in pkg.dependencies) {
                if(!pkg.dependencies.hasOwnProperty(i)) {
                    continue;
                }

                // todo: check for semver versions and do all the resolutions

                if (dependencyMap.hasOwnProperty(i)) {
                    continue;
                }

                let version = null;

                promises.push(ajax.get(path.join(cdn_url, i, 'meta.json')).then((meta) => {
                    try {
                        meta = JSON.parse(meta);
                    } catch (ex) {
                        // reject
                    }

                    version = pkg.dependencies[i];
                    const availableVersions = meta.v;

                    if (meta.semver) {
                        version = semver.maxSatisfying(availableVersions, version);
                    }

                    if (version === null || (!meta.semver && availableVersions.indexOf(version) === -1)) {
                        throw new Error(`Invalid version for ${cdn_url}, ${version}`);
                    }

                    return ajax.get(path.join(cdn_url, i, version, 'rodin_package.json'));

                }).then((data) => {
                    const pkg = RodinPackage.getEnv(JSON.parse(data), env);
                    dependencyMap[i] = path.join(cdn_url, i, version, pkg.main);
                    return _resolveManifest(pkg);
                }));
            }

            return Promise.all(promises);
        };
        const pkg = JSON.parse(data);
        cdn_url = pkg.___cdn_url || cdn_url;

        return _resolveManifest(pkg).then(() => {
            return Promise.resolve({dependencyMap, main: getURL(pkg.main || 'index.js', dependencyMap)});
        });
    });
};

// todo: fix this
const coreDependencies = [
    'https://cdn2.rodin.io/threejs/main/r88/bundle/three.min.js',
].map(x => ajax.get(x));

Promise.all(coreDependencies).then((data) => {
    const _window = runSandboxed(data[0], {});
    const _renderer = makeRenderer(_window.THREE);

    console.log('Rodin core ready');
    runExample(_renderer);
});

const bindTHREEJSRenderer = (_window, _renderer) => {

    watchFor('THREE.WebGLRenderer', _window, (_three) => {
        return class {
            constructor() {
                watchFor('render', this, (render) => {
                    return (...args) => {
                        _renderer.render(...args);
                    }
                });
            }

            setClearColor() {

            }

            setSize() {

            }

            getSize() {
                return _renderer.getSize();
            }

            setPixelRatio() {

            }

            getPixelRatio() {
                return _renderer.getPixelRatio();
            }

            getContext() {
                return _renderer.getContext();
            }

            get shadowMap() {
                return _renderer.shadowMap;
            }

            get domElement() {
                return window.document.createElement('p');
            }

            get clippingPlanes() {
                return _renderer.clippingPlanes;
            }

            set clippingPlanes(val) {
                _renderer.clippingPlanes = val;
            }

            get localClippingEnabled() {
                return _renderer.localClippingEnabled;
            }

            set localClippingEnabled(val) {
                _renderer.localClippingEnabled = val;
            }

            render(...args) {
                _renderer.render(...args);
            }
        };
    });
};

const runSandboxed = (source, _window = new CustomWindow()) => {
    const self = _window;
    // todo: find normal way to do it
    eval(`
    (function () {
        with (_window) {
            eval(source);
        }
    }).bind(_window)();
    `);

    return _window;
};

const makeRenderer = (_THREE) => {
    const renderer = new _THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: window.document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
    });

    renderer.setClearColor("#000000");
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";

    return renderer;
};

const runExample = (_renderer) => {
    getManifest().then((data) => {
        const extension = data.main.substring(data.main.lastIndexOf('.') + 1).toLowerCase();

        let _window = null;

        switch (extension) {
            case 'js':
                _window = new CustomWindow("");
                window._window = _window;

                eval(`
                    with(_window) new JSHandler(data.main, data.dependencyMap)
                `);

                break;

            case 'html':
                ajax.get(data.main).then(src => {
                    _window = new CustomWindow(src);
                    window._window = _window;
                    bindTHREEJSRenderer(_window, _renderer);
                    const scripts = _window.document.getElementsByTagName('script');
                    const promises = [];
                    for(let i = 0; i < scripts.length; i ++) {
                        if(!scripts[i].src) {
                            promises.push(new Promise((resolve, reject) => {resolve(scripts[i].innerHTML)}));
                            continue;
                        }

                        const srcPath = path.isAbsolute(scripts[i].src) ? scripts[i].src : path.join(path.getDirectory(data.main), scripts[i].src);
                        promises.push(ajax.get(srcPath));
                    }

                    return Promise.all(promises);
                }).then(scripts => {
                    for(let src of scripts) {
                        runSandboxed(src, _window);
                    }
                });

                break;

            default:
                throw new Error(`unknown file extension "${extension}"`)
        }
    });
};
