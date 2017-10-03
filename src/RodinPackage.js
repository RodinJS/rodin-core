export const getEnv = (rodinPackage, env) => {
    let envInfo = {};
    for (let i in rodinPackage.sources) {
        if (rodinPackage.sources[i].env === env) {
            envInfo = Object.assign(envInfo, rodinPackage.sources[i]);
            break;
        }
    }

    const res = Object.assign({}, rodinPackage);
    delete res.sources;
    const dependencies = Object.assign(res.dependencies || {}, envInfo.dependencies || {});
    Object.assign(res, envInfo);
    res.dependencies = dependencies;
    return res;
};