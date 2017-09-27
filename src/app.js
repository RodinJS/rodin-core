import * as ajax from "../third_party/rodin-sandbox/lib/ajax.js";
import * as path from "../third_party/rodin-sandbox/lib/path.js";
import {JSHandler} from "../third_party/rodin-sandbox/lib/JSHandler.js";
import * as semver from '../third_party/semver/semver.js';

window.semver = semver;


const cdn_url = 'http://192.168.0.207:4321';

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

        const _resolveManifest = (manifest) => {
            const pkg = JSON.parse(manifest);

            console.log(`Running ${pkg.name}...`);

            const promises = [];

            for (let i in pkg.dependencies) {
                // todo: check for semver versions and do all the resolutions

                if (dependencyMap.hasOwnProperty(i)) {
                    continue;
                }

                promises.push(ajax.get(path.join(cdn_url, i, 'meta.json')).then((meta) => {
                    try {
                        meta = JSON.parse(meta);
                    } catch (ex) {
                        // reject
                    }

                    let version = pkg.dependencies[i];

                    if (meta.semver) {
                        version = semver.maxSatisfying(meta.v, version);
                    }
                    if (version === null || (!meta.semver && meta.v.indexOf(version) === -1)) {
                        throw new Error(`Invalid version for ${cdn_url}, ${version}`);
                    }

                    dependencyMap[i] = path.join(cdn_url, i, version, 'source/index.js');
                    return ajax.get(path.join(cdn_url, i, version, 'source/rodin_package.json'));

                }).then((data) => {
                    return _resolveManifest(data);
                }));
            }

            return Promise.all(promises);
        };

        return _resolveManifest(data).then(() => {
            console.log(dependencyMap);
            return Promise.resolve({dependencyMap, main: getURL("index.js", dependencyMap)});
        });

    });
};

getManifest().then((data) => {
    new JSHandler(data.main, data.dependencyMap);
});