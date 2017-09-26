import * as ajax from "../third_party/rodin-sandbox/lib/ajax.js";
import * as path from "../third_party/rodin-sandbox/lib/path.js";
import {JSHandler} from "../third_party/rodin-sandbox/lib/JSHandler.js";


const getURL = (filename, urlMap = null) => {

    if (urlMap !== null) {
        const url = path.normalize(filename);
        console.log(filename, url);
        const urlBeginning = filename.substring(0, url.indexOf('/'));
        if (urlMap.hasOwnProperty(urlBeginning)) {
            return path.join(urlMap[urlBeginning], url.substring(url.indexOf('/')));
        }
    }

    if (path.getFile(window.location.href).indexOf(".") !== -1) {
        return path.join(path.getDirectory(window.location.href), filename);
    }
    return path.join(window.location.href, filename);
};

const getManifest = () => {

    return ajax.get(getURL('rodin_package.json')).then((data) => {
        const pkg = JSON.parse(data);
        console.log(`Running ${pkg.name}...`);
        const dependencyMap = {};

        for (let i in pkg.dependencies) {
            // todo: check for semver versions and do all the resolutions
            dependencyMap[i] = pkg.dependencies[i][0];
        }
        return Promise.resolve({dependencyMap, main: getURL(pkg.main, dependencyMap)});
    });
};

getManifest().then((data) => {
    new JSHandler(data.main, data.dependencyMap);
});