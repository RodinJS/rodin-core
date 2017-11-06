export const watchFor = (param, obj, cb) => {

    if (typeof param === 'string') {
        param = param.split('.');
    }

    if (obj[param[0]]) {
        if (param.length !== 1) {
            return watchFor(param.slice(1, param.length), obj[param[0]], cb);
        }
        if (cb) {
            return obj[param[0]] = cb(obj[param[0]]);
        }
        return;
    }

    const newParam = Symbol(param[0]);

    Object.defineProperty(obj, param[0], {
        set: (val) => {
            if (param.length !== 1) {
                watchFor(param.slice(1, param.length), val, cb);
            } else if (cb) {
                val = cb(val);
            }
            obj[newParam] = val;
        },
        get: () => {
            return obj[newParam];
        }
    });
};