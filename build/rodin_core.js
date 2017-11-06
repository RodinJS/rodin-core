(function () {
	const _request = function () {
	    if (typeof XMLHttpRequest !== 'undefined') {
	        return new XMLHttpRequest();
	    }
	    const versions = [
	        "MSXML2.XmlHttp.6.0",
	        "MSXML2.XmlHttp.5.0",
	        "MSXML2.XmlHttp.4.0",
	        "MSXML2.XmlHttp.3.0",
	        "MSXML2.XmlHttp.2.0",
	        "Microsoft.XmlHttp"
	    ];

	    let xhr;
	    for (let i = 0; i < versions.length; i++) {
	        try {
	            xhr = new ActiveXObject(versions[i]);
	            break;
	        } catch (e) {
	        }
	    }
	    return xhr;
	};

	const _send = function (url, method, data = {}, async = true) {
	    return new Promise((resolve, reject) => {

	        const request = _request();
	        request.open(method, url, async);

	        request.addEventListener('load', (event) => {
	            const response = event.target.response;

	            if (request.status === 200 || request.status === 0) {
	                resolve(response);
	            } else {
	                reject(event);
	            }

	        }, false);

	        request.addEventListener('error', (event) => {
	            reject(event);
	        }, false);


	        if (method === 'POST') {
	            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	        }

	        request.send(data);
	    });
	};

	const get = function (url, data, async = true) {
	    const query = [];
	    for (let key in data) {
	        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
	    }
	    return _send(url + (query.length ? '?' + query.join('&') : ''), 'GET', null, async);
	};

	const post = function (url, data, callback, async) {
	    const query = [];
	    for (let key in data) {
	        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
	    }
	    return _send(url, 'POST', query.join('&'), async);
	};

	const isAbsolute = (path) => path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://');

	const join = (...args) => normalize(args.filter(i => i !== '').join('/'));

	const getDirectory = (path) => path.substring(0, path.lastIndexOf('/'));

	const getFile = (path) => path.substring(path.lastIndexOf('/'));

	const normalize = (path) => {
	    let absolutePrefix = '';
	    if (isAbsolute(path)) {
	        for (let i of ['/', 'http://', 'https://']) {
	            if (path.startsWith(i)) {
	                path = path.substring(i.length);
	                absolutePrefix = i;
	            }
	        }
	    }

	    const paths = path.split('/');
	    const res = [];
	    for (let i = 0; i < paths.length; i++) {
	        switch (paths[i]) {
	            case '.':
	            case '':
	                break;
	            case '..':
	                res.pop();
	                break;
	            default:
	                res.push(paths[i]);
	        }
	    }

	    return absolutePrefix + res.join('/');
	};

	/**
	 * EventEmitter extend from this class in order to add
	 * event emitter functionality like
	 * emit, addEventListener, on, once
	 */
	class EventEmitter {
		constructor() {
			/**
			 * event handlers map, with eventNames as keys, and handler functions Arrays as values {"update" : [func1, func2]}
			 * @type {Object}
			 */
			this.events = {};
		}

		/**
		 * Add listener(s) to Event(s).
		 * @param {string[]|string} eventNames - event name(s)
		 * @param {function} callback - callback function
		 */
		addEventListener(eventNames, callback) {
			if (!Array.isArray(eventNames)) {
				eventNames = [eventNames];
			}
			for (let i = 0; i < eventNames.length; i++) {
				let evt = eventNames[i];
				if (!this.events[evt]) {
					this.events[evt] = [];
				}
				this.events[evt].push(callback);
			}
		}

		/**
		 * Add listener(s) to Event(s). Alias to addEventListener()
		 * @param {string[]|string} eventNames - event name(s)
		 * @param {function} callback - callback function
		 */
		on(eventNames, callback) {
			this.addEventListener(eventNames, callback);
		}

		/**
		 * Adds listener(s) to Event(s) which only need to be called once.
		 * It will be called only the first time event is fired.
		 * @param {string[]|string} eventNames - event name(s)
		 * @param {function} callback - callback function
		 */
		once(eventNames, callback) {
			const tmp = () => {
				callback(...arguments);
				this.removeEventListener(eventNames, tmp);
			};

			this.addEventListener(eventNames, tmp);
		}

		/**
		 * Removes specific listener from Event.
		 * @param {string} eventName - event name
		 * @param {function} callback - callback function
		 *
		 * @returns {boolean} true if callback removed. else if callback not assigned
		 */
		removeEventListener(eventName, callback) {
			if (this.events[eventName] && this.events[eventName].indexOf(callback) !== -1) {
				this.events[eventName].splice(this.events[eventName].indexOf(callback), 1);
				return true;
			}

			return false;
		}

		/**
		 * Emits Event with params.
		 * @param {String} eventName
		 * @param {*} rodinEvent - a custom Event object
		 * @param {Array} args - arguments to be passed to the event callback
		 */
		emit(eventName, rodinEvent = {}, ...args) {
			if (this.events[eventName] && this.events[eventName].length > 0) {
				for (let f = 0; f < this.events[eventName].length; f++) {
					if (typeof this.events[eventName][f] === "function") {
						this.events[eventName][f].apply((rodinEvent && rodinEvent.target), [rodinEvent].concat(args));
					}
				}
			}
		}

		/**
		 * Emits event async
		 * @param {String} eventName
		 * @param {*} rodinEvent - a custom Event object
		 * @param {Array} args - arguments to be passed to the event callback
		 */
		emitAsync(eventName, rodinEvent, ...args) {
			const tmpTimeout = setTimeout(() => {
				this.emit(eventName, rodinEvent, ...args);
				clearTimeout(tmpTimeout);
			}, 0);
		}
	}

	const binarySearchIntervals = (intervals, index, right = false) => {
	    let low = 0;
	    let high = intervals.length - 1;
	    let mid = NaN;
	    while (low <= high) {
	        mid = Math.floor((low + high) / 2);
	        if (intervals[mid][0] <= index && index < intervals[mid][1]) return mid;
	        else if (intervals[mid][1] < index) low = mid + 1;
	        else high = mid - 1;
	    }

	    if (right) {
	        return low;
	    }

	    return -1;
	};

	const binarySearch = (array, index, left = false) => {
	    let low = 0;
	    let high = array.length - 1;
	    let mid = NaN;
	    while (low <= high) {
	        mid = Math.floor((low + high) / 2);
	        if (array[mid] === index) return mid;
	        else if (array[mid] < index) low = mid + 1;
	        else high = mid - 1;
	    }

	    if (left) {
	        return high;
	    }

	    return -1;
	};


	/**
	 * Finds the last element in the array which is not smaller than key
	 * @param array
	 * @param value
	 * @return {number}
	 */
	const binarySearchLowerBound = (array, value) => {
	    let low = 0;
	    let high = array.length - 1;
	    let mid;
	    while (low <= high) {
	        mid = (low + high) >> 1;
	        if (array[mid] === value) {
	            return mid;
	        }
	        else if (array[mid] < value) {
	            low = mid + 1;
	        }
	        else {
	            high = mid - 1;
	        }
	    }
	    return high;
	};

	/**
	 * Finds the first element in the array which is greater than key
	 * @param array
	 * @param value
	 * @return {number}
	 */
	const binarySearchUpperBound = (array, value) => {
	    let low = 0;
	    let high = array.length - 1;
	    let mid;
	    while (low <= high) {
	        mid = (low + high) >> 1;
	        if (array[mid] === value) {
	            return mid;
	        }
	        else if (array[mid] < value) {
	            low = mid + 1;
	        }
	        else {
	            high = mid - 1;
	        }
	    }
	    return low > array.length - 1 ? -1 : low;
	};


	// maybe use js log? idk need to check
	const getLog = (n) => {
	    let res = 1;
	    while ((1 << res) <= n) ++res;
	    return res;
	};

	const find = (source, needle, method = 'indexOf') => {
	    const res = [];
	    let cur = -1;

	    do {
	        cur = source[method](needle, cur + 1);
	        if (cur === -1)
	            break;
	        res.push([cur, needle]);
	    } while (true);

	    return res;
	};

	// for debugging
	const reshapeObject$1 = (object) => {
	    const len = object[Object.keys(object)[0]].length;
	    const ret = [];
	    for (let i = 0; i < len; i++) {
	        let col = {};
	        for (let key in object) {
	            col[key] = object[key][i];
	        }
	        ret.push(col);
	    }
	    return ret;
	};

	class Graph {
	    constructor(graph) {
	        this._graph = graph;
	        this._isAnalyzed = false;
	    }

	    analyze() {
	        const n = this._graph.length;
	        this._parentMap = new Array(n).fill(NaN);
	        this._dfsEnter = new Array(n);
	        this._dfsExit = new Array(n);

	        this._up = new Array(n);
	        this._log = getLog(n);

	        for (let i = 0; i < n; i++) {
	            for (let j = 0; j < this._graph[i].length; j++) {
	                this._parentMap[this._graph[i][j]] = i;
	            }
	        }

	        const log = getLog(n);
	        for (let i = 0; i < n; i++) {
	            this._up[i] = new Array(log + 1);
	        }

	        let timer = 0;
	        const dfs = (v, p = 0) => {
	            this._dfsEnter[v] = ++timer;
	            this._up[v][0] = p;
	            for (let i = 1; i <= log; ++i) {
	                this._up[v][i] = this._up[this._up[v][i - 1]][i - 1];
	            }
	            for (let i = 0; i < this._graph[v].length; ++i) {
	                const to = this._graph[v][i];
	                if (to != p) {
	                    dfs(to, v);
	                }
	            }
	            this._dfsExit[v] = ++timer;
	        };

	        dfs(0);

	        this._isAnalyzed = true;
	    }

	    isParent(a, b) {
	        return this._dfsEnter[a] <= this._dfsEnter[b] && this._dfsExit[a] >= this._dfsExit[b];
	    }

	    lca(a, b) {
	        if (this.isParent(a, b)) return a;
	        if (this.isParent(b, a)) return b;
	        for (let i = this._log; i >= 0; --i)
	            if (!this.isParent(this._up[a][i], b))
	                a = this._up[a][i];
	        return this._up[a][0];
	    }

	    getParent(a) {
	        return this._parentMap[a];
	    }

	    dfs(fcn, v = 0) {
	        fcn && fcn(v);
	        for (let i = 0; i < this._graph[v].length; ++i) {
	            this.dfs(fcn, this._graph[v][i]);
	        }
	    }
	}

	/**
	 * Class StaticAnalyzer
	 */
	class StaticAnalyzer {
	    constructor(source) {
	        this.source = source;
	        this._commentsAndStringsAnalyzed = false;
	        this._es6Scopes = null;
	        this._es5Scopes = null;
	        this._scopeData = [];

	        this._es6ScopeGraphData = null;
	        this._es5ScopeGraphData = null;

	        this._es5ScopeMap = [];

	        this._closingEs5ScopesSorted = [[], []];
	        this._closingEs6ScopesSorted = [[], []];

	        this._functionAndClassDeclarations = [[], [], []];

	        this._destructions = [];
	    }

	    static doEvalCheck(expr, direction = -1) {
	        try {
	            let a = 0, b = 0;
	            switch (direction) {
	                case -1:
	                    eval(`{a${expr}}`);
	                    break;
	                case 0:
	                    eval(`{a${expr}b}`);
	                    break;
	                case 1:
	                    eval(`{${expr}b}`);
	            }

	        } catch (e) {
	            return false;
	        }
	        return true;
	    };

	    checkIfExpressionIsOver(index) {
	        // todo: tidy this up, a lot of code repetition
	        let a = index;
	        let strArr = [];
	        const skipParams = {cci: null};
	        a = this.skipNonCode(a, skipParams, -1);
	        if (this.source.charCodeAt(a) === 46 /* '.'.charCodeAt(0) */ ||
	            this.source.charCodeAt(a) === 40 /* '('.charCodeAt(0) */ ||
	            this.source.charCodeAt(a) === 91 /* '['.charCodeAt(0) */) {
	            return false;
	        }

	        while (true) {
	            if (StaticAnalyzer.operatorChars.indexOf(this.source.charCodeAt(a)) === -1) {
	                let [s, e] = this.getWordFromIndex(a);
	                const subStr = this.source.substring(s, e);
	                if (StaticAnalyzer.operatorWords.indexOf(subStr) !== -1) {
	                    strArr.push(...subStr.split('').reverse());
	                    a = s - 1;
	                } else {
	                    break;
	                }
	            }
	            strArr.push(this.source.charAt(a));
	            a = this.skipNonCode(a - 1, skipParams, -1);
	        }
	        let operatorStr = strArr.reverse().join('');
	        strArr = [];

	        if (StaticAnalyzer.doEvalCheck(operatorStr)) {
	            skipParams.cci = null;
	            a = this.skipNonCode(index, skipParams);
	            if (this.source.charCodeAt(a) === 46 /* '.'.charCodeAt(0) */ ||
	                this.source.charCodeAt(a) === 40 /* '('.charCodeAt(0) */ ||
	                this.source.charCodeAt(a) === 91 /* '['.charCodeAt(0) */) {
	                return false;
	            }
	            while (true) {
	                if (StaticAnalyzer.operatorChars.indexOf(this.source.charCodeAt(a)) === -1) {
	                    let [s, e] = this.getWordFromIndex(a);
	                    const subStr = this.source.substring(s, e);
	                    if (StaticAnalyzer.operatorWords.indexOf(subStr) !== -1) {
	                        strArr.push(subStr);
	                        a = e;
	                    } else {
	                        break;
	                    }
	                }
	                strArr.push(this.source.charAt(a));
	                a = this.skipNonCode(a + 1, skipParams);
	            }

	            operatorStr += strArr.join('');
	            if (!StaticAnalyzer.doEvalCheck(operatorStr, 0)) {
	                return true;
	            }
	        }
	        return false;
	    };

	    analyzeCommentsAndStrings() {
	        const commentsAndStrings = [];
	        const commentAndStringTypes = [];
	        const instances = [];
	        const es6Scopes = [[], []];

	        const scopeGraph = [];

	        this._commentsAndStrings = commentsAndStrings;
	        this._commentsAndStringsTypes = commentAndStringTypes;
	        this._commentsAndStringsAnalyzed = true;
	        this._es6Scopes = es6Scopes;
	        this._es6ScopeGraphData = scopeGraph;


	        const s = {
	            anything: 0,
	            afterSlash: 1,
	            string: 2,
	            literalString: 3,
	            comment: 4,
	            multilineComment: 5,
	            regex: 6,
	            squareBracketsRegex: 7
	        };

	        const jsOneLiners = ['if', 'for', 'while'];
	        const charsBeforeRegex = ['=', '+', '-', '/', '*', '%', '(', '[', ';', ':', '{', '}', '\n', '\r', ',', '!', '&', '|', '^', '?', '>', '<'];
	        const wordsBeforeRegex = ['return', 'yield', 'typeof', 'case', 'do', 'else'];

	        const length = this.source.length;
	        let i = 0;
	        let state = s.anything;
	        let stringType = '"'.charCodeAt(0);
	        let inLiteralString = false;

	        let start = null;

	        let literalStringStackSize = 0;

	        const skipNonCode = (j) => {
	            let resI = commentsAndStrings.length - 1;
	            while (j >= 0 && (this.source.charCodeAt(j) <= 32 || (resI >= 0 && commentsAndStrings[resI][0] < j && commentsAndStrings[resI][1] > j))) {
	                j--;
	                if (resI >= 0 && commentsAndStrings[resI][0] < j && commentsAndStrings[resI][1] > j) {
	                    j = commentsAndStrings[resI][0] - 1;
	                    resI--;
	                }
	            }
	            return j;
	        };

	        const regexPrefixCheck = () => {
	            let j = skipNonCode(i - 2);

	            if (j < 0) {
	                return true;
	            }

	            if (this.source.charAt(j) === '+' && this.source.charAt(j - 1) === '+') {
	                return false;
	            }

	            if (this.source.charAt(j) === '-' && this.source.charAt(j - 1) === '-') {
	                return false;
	            }

	            if (charsBeforeRegex.indexOf(this.source.charAt(j)) === -1) {
	                let roundBrackets = false;
	                if (this.source.charCodeAt(j) === ')'.charCodeAt(0)) {
	                    roundBrackets = true;
	                    let bracketStack = 1;
	                    while (bracketStack) {
	                        j = skipNonCode(--j);
	                        if (this.source.charCodeAt(j) === '('.charCodeAt(0)) {
	                            bracketStack--;
	                        } else if (this.source.charCodeAt(j) === ')'.charCodeAt(0)) {
	                            bracketStack++;
	                        }
	                    }
	                    j--;
	                }
	                j = skipNonCode(j);

	                const wordEnd = j + 1;

	                while (j >= 0 && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(j)) === -1) {
	                    j--;
	                }
	                const wordStart = j + 1;

	                if (roundBrackets && jsOneLiners.indexOf(this.source.substring(wordStart, wordEnd)) !== -1) {
	                    return true;
	                } else if (!roundBrackets && wordsBeforeRegex.indexOf(this.source.substring(wordStart, wordEnd)) !== -1) {
	                    return true;
	                }

	                return false;
	            }
	            return true;
	        };

	        const saveResult = (end = i) => {
	            instances.push(this.source.substring(start, end + 1));
	            commentsAndStrings.push([start, end + 1]);
	            commentAndStringTypes.push(state);
	        };

	        while (i < length) {
	            const cur = this.source.charCodeAt(i);

	            switch (state) {
	                case s.anything:

	                    start = i;
	                    if (cur === 47 /* '/'.charCodeAt(0) */) {
	                        state = s.afterSlash;
	                    } else if (cur === 34 /* '"'.charCodeAt(0) */ || cur === 39 /* '\''.charCodeAt(0) */) {
	                        state = s.string;
	                        stringType = cur;
	                    } else if (cur === 96 /* '`'.charCodeAt(0) */) {
	                        literalStringStackSize++;
	                        state = s.literalString;
	                    } else if (inLiteralString && cur === 125 /* '}'.charCodeAt(0) */) {
	                        state = s.literalString;
	                        inLiteralString = false;
	                    }

	                    break;
	                case s.afterSlash:
	                    if (cur === 47 /* '/'.charCodeAt(0) */) {
	                        state = s.comment;
	                    } else if (cur === 42 /* '*'.charCodeAt(0) */) {
	                        state = s.multilineComment;
	                    } else if (regexPrefixCheck()) {
	                        state = s.regex;
	                        i -= 1;
	                    } else {
	                        state = s.anything;
	                        i -= 1;
	                    }
	                    break;
	                case s.comment:
	                    if (cur === 10 /* '\n'.charCodeAt(0) */ || i === length - 1) {
	                        saveResult();
	                        state = s.anything;
	                    }
	                    break;
	                case s.multilineComment:
	                    if (cur === 42 /* '*'.charCodeAt(0) */ && this.source.charCodeAt(i + 1) === 47 /* '/'.charCodeAt(0) */) {
	                        i++;
	                        saveResult(i);
	                        state = s.anything;
	                    }
	                    break;
	                case s.regex:

	                    if (cur === 92 /* '\\'.charCodeAt(0) */) {
	                        i++;
	                    } else if (cur === 10 /* '\n'.charCodeAt(0) */) {
	                        state = s.anything;
	                        i = start;
	                    } else if (cur === 91 /* '['.charCodeAt(0) */) {
	                        state = s.squareBracketsRegex;
	                    } else if (cur === 47 /* '/'.charCodeAt(0) */) {
	                        saveResult();
	                        state = s.anything;
	                    }
	                    break;
	                case s.squareBracketsRegex:
	                    if (cur === 92 /* '\\'.charCodeAt(0) */) {
	                        i++;
	                    } else if (cur === 93 /* ']'.charCodeAt(0) */) {
	                        state = s.regex;
	                    }
	                    break;
	                case s.string:
	                    if (cur === 92 /* '\\'.charCodeAt(0) */) {
	                        i++;
	                    } else if (cur === stringType) {
	                        saveResult();
	                        state = s.anything;
	                    }
	                    break;
	                case s.literalString:
	                    if (cur === 92 /* '\\'.charCodeAt(0) */) {
	                        i++;
	                    } else if (cur === 36 /* '$'.charCodeAt(0) */ && this.source.charCodeAt(i + 1) === 123 /* '{'.charCodeAt(0) */) {
	                        i++;
	                        saveResult();
	                        state = s.anything;
	                        inLiteralString = true;
	                    } else if (cur === 96 /* '`'.charCodeAt(0) */) {
	                        saveResult();
	                        literalStringStackSize--;
	                        if (literalStringStackSize) {
	                            inLiteralString = true;
	                        }
	                        state = s.anything;
	                    }
	                    break;
	            }
	            i++;
	        }
	    }

	    analyzeScopes() {
	        const n = this.source.length;
	        let i = 0;

	        const es6Scopes = this._es6Scopes;
	        const es6ScopeGraph = this._es6ScopeGraphData;
	        this._es5Scopes = [[], [], []];
	        const es5Scopes = this._es5Scopes;
	        this._es5ScopeGraphData = [];
	        const es5ScopeGraph = this._es5ScopeGraphData;

	        // 0 stands for the global scope
	        const scopeStack = [];
	        let scopeStackSize = 0;
	        this._scopeData.push();


	        const bracketStack = [];
	        const popBracketStack = (bracket) => {
	            const last = bracketStack[bracketStack.length - 1];
	            if (bracket !== last) {
	                if (last === -1) {
	                    saveScope(-2, StaticAnalyzer.scopeTypes.expression);
	                } else if (last === -3) {
	                    saveScope(-4, StaticAnalyzer.scopeTypes.singleStatement);
	                }
	            }
	            return bracketStack.pop();
	        };

	        const bracketMap = {
	            ['('.charCodeAt(0)]: ')'.charCodeAt(0),
	            ['['.charCodeAt(0)]: ']'.charCodeAt(0),
	            ['{'.charCodeAt(0)]: '}'.charCodeAt(0),
	            [')'.charCodeAt(0)]: '('.charCodeAt(0),
	            [']'.charCodeAt(0)]: '['.charCodeAt(0),
	            ['}'.charCodeAt(0)]: '{'.charCodeAt(0),
	            [-1]: -2,
	            [-2]: -1,
	            [-3]: -4,
	            [-4]: -3
	        };

	        let curCommentIndex = {cci: null};
	        const es5Functions = ['function', 'function*'];

	        /**
	         * checks if the there is a function or class at the given position
	         * if type is 0 checks only for function,
	         * if type is 1 checks only for class
	         * @param j
	         * @param type
	         * @return {*}
	         */
	        const checkIfClassOrFunction = (j, type = 0) => {
	            let scopeData = [StaticAnalyzer.scopeTypes.es6];
	            let closingRoundBracket = null, openingRoundBracket = null;

	            // only need to do this for functions, classes dont have ()
	            if (type === 0) {
	                closingRoundBracket = j + 1;
	                j = this.skipBrackets(j, StaticAnalyzer.cOBJ);
	                openingRoundBracket = ++j;

	                if (this._scopeData[scopeStack[scopeStackSize - 1]] &&
	                    this._scopeData[scopeStack[scopeStackSize - 1]][0] === StaticAnalyzer.scopeTypes.class) {
	                    let scopeType = StaticAnalyzer.scopeTypes.function;
	                    return [scopeType, [openingRoundBracket, closingRoundBracket]];
	                }
	            }


	            let tmpI = 0;
	            let fcnOrClassName;

	            while (tmpI < 2) {
	                j = this.skipNonCode(--j, StaticAnalyzer.cOBJ, -1);
	                const nextWord = this.getWordFromIndex(j);
	                const cur = this.source.substring(nextWord[0], nextWord[1]);
	                if (tmpI === 0)
	                    fcnOrClassName = cur;
	                j = nextWord[0];
	                if (type === 0 && es5Functions.indexOf(cur) !== -1) {
	                    let scopeType = StaticAnalyzer.scopeTypes.function;
	                    scopeData = [scopeType, [openingRoundBracket, closingRoundBracket]];
	                    break;
	                } else if (type === 1 && cur === 'class') {
	                    let scopeType = StaticAnalyzer.scopeTypes.class;
	                    scopeData = [scopeType];
	                    break;
	                }
	                tmpI++;
	            }

	            if (tmpI > 0 &&
	                (scopeData[0] === StaticAnalyzer.scopeTypes.class ||
	                    scopeData[0] === StaticAnalyzer.scopeTypes.function)) {
	                this._functionAndClassDeclarations[0].push(fcnOrClassName);
	                this._functionAndClassDeclarations[1].push(j);
	                this._functionAndClassDeclarations[2].push(type);
	            }

	            return scopeData;
	        };

	        //todo: one line arrow functions, for, if, while, do
	        const saveScope = (bracket, scopeType = StaticAnalyzer.scopeTypes.es6) => {
	            let scopeData = [StaticAnalyzer.scopeTypes.es6];

	            let isOpening = false;
	            let scopeStart = i;
	            let scopeEnd = i;
	            let j = i;
	            const skipParams = {cci: null};
	            let c = null;
	            // todo: make a debug flag for these things

	            switch (scopeType) {
	                case StaticAnalyzer.scopeTypes.es5:  // the global scope
	                    // make this a constant
	                    if (bracket === 11116666) {
	                        isOpening = true;
	                        scopeData = [scopeType];
	                    } else {
	                        isOpening = false;
	                    }

	                    break;
	                case StaticAnalyzer.scopeTypes.arrowFunction:
	                    i = this.skipNonCode(i + 2, StaticAnalyzer.cOBJ);
	                    curCommentIndex.cci = null;
	                    c = j - 1;
	                    c = this.skipNonCode(c, skipParams, -1); // add curCommentIndex
	                    let closingRoundBracket = c;
	                    let openingRoundBracket = null;

	                    // a=>{}
	                    if (this.source.charCodeAt(c) !== 41 /* ')'.charCodeAt(0) */) {
	                        closingRoundBracket++;
	                        c = this.getWordFromIndex(c)[0];
	                        // todo: figure out if this if j or j+1
	                        openingRoundBracket = c;
	                    } else {
	                        // (a,b,c)=>
	                        c = this.skipBrackets(c, skipParams);
	                        openingRoundBracket = c + 1;
	                    }
	                    scopeStart = openingRoundBracket;
	                    if (this.source.charCodeAt(i) !== 123 /* '{'.charCodeAt(0) */) {
	                        // revert back one character so things like ({}) will work
	                        i -= 2;
	                        curCommentIndex.cci = null;
	                        scopeType = scopeType | StaticAnalyzer.scopeTypes.expression;
	                        bracket = -1; // no bracket at all
	                    }

	                    scopeData = [scopeType, [openingRoundBracket, closingRoundBracket]];

	                    isOpening = true;
	                    break;
	                case StaticAnalyzer.scopeTypes.singleStatement:
	                case StaticAnalyzer.scopeTypes.expression:
	                    isOpening = false;
	                    scopeEnd = i - 1;

	                    // bracketStack.pop();
	                    break;
	                case StaticAnalyzer.scopeTypes.for:
	                    isOpening = true;
	                    scopeStart = i;
	                    i = this.skipNonCode(i + 3, skipParams);
	                    i = this.skipBrackets(i, skipParams);
	                    i = this.skipNonCode(++i, skipParams);

	                    // i++;

	                    if (this.source.charCodeAt(i) !== 123 /* '{'.charCodeAt(0) */) {
	                        // revert back one character so things like ({}) will work
	                        // not sure if -=2 or -=1
	                        i -= 2;
	                        scopeType = scopeType | StaticAnalyzer.scopeTypes.singleStatement;
	                        bracket = -3; // no bracket at all, but a statement instead of an expression
	                    }
	                    curCommentIndex.cci = null;
	                    scopeData = [scopeType];
	                    break;
	            }


	            if (bracket === 123 /* '{'.charCodeAt(0) */) {
	                isOpening = true;
	                j = this.skipNonCode(--j, StaticAnalyzer.cOBJ, -1);

	                // checking if the scope is a function
	                if (this.source.charCodeAt(j) === 41 /* ')'.charCodeAt(0) */) {
	                    scopeData = checkIfClassOrFunction(j, 0); // check for a function
	                    if (scopeData[1]) {
	                        scopeStart = scopeData[1][0];
	                    }
	                } else {
	                    scopeData = checkIfClassOrFunction(j, 1); // check for a class
	                }
	            }

	            if (bracket === 125 /* '}'.charCodeAt(0) */) {
	                isOpening = false;
	                if (this._scopeData[scopeStart[scopeStack.length - 1]] &&
	                    this._scopeData[scopeStart[scopeStack.length - 1]][0] === StaticAnalyzer.scopeTypes.destruction) {
	                    scopeType = StaticAnalyzer.scopeTypes.destruction;
	                    this._scopeData[scopeStack[scopeStackSize - 1]] = [scopeType];
	                } else {
	                    j = this.skipNonCode(++j, StaticAnalyzer.cOBJ);

	                    if (this.source.charCodeAt(j) === 61 /* '='.charCodeAt(0) */) {
	                        scopeType = StaticAnalyzer.scopeTypes.destruction;
	                        this._scopeData[scopeStack[scopeStackSize - 1]] = [scopeType];
	                        this._destructions.push(i);
	                    }
	                }
	            }

	            if (isOpening) {
	                bracketStack.push(bracket);

	                // add new scope we just found to the graph
	                es6ScopeGraph.push([]);
	                // check if there is a scope which contains it
	                if (scopeStackSize) {
	                    // push the current scope to its parent
	                    // note: es6Scopes[0].length without -1 because \
	                    // we haven't yet added the current one
	                    es6ScopeGraph[scopeStack[scopeStackSize - 1]].push(es6Scopes[0].length);
	                }
	                // add both beginning and ending of the scope we found
	                // the ending is NaN because we will fill it in later
	                es6Scopes[0].push(scopeStart);
	                es6Scopes[1].push(NaN);
	                // check if our array has enough space to add an element
	                if (scopeStack.length < scopeStackSize) {
	                    // if it does not use .push
	                    scopeStack.push(es6Scopes[0].length - 1);
	                }
	                else {
	                    // otherwise just set the element we need
	                    scopeStack[scopeStackSize] = es6Scopes[0].length - 1;
	                }
	                scopeStackSize++;
	                this._scopeData.push(scopeData);
	            } else {
	                // change the value we put as NaN earlier
	                es6Scopes[1][scopeStack[scopeStackSize - 1]] = scopeEnd;
	                this._closingEs6ScopesSorted[0].push(scopeEnd);
	                this._closingEs6ScopesSorted[1].push(scopeStack[scopeStackSize - 1]);

	                // todo: this definitely needs major refactoring
	                scopeStackSize--;
	                while (true) {
	                    const last = popBracketStack(bracketMap[bracket]);
	                    if (!last || !bracketStack.length || last > 0 || bracketStack[bracketStack.length - 1] > 0)
	                        break;
	                    saveScope(bracketStack[bracketStack.length - 1] - 1, StaticAnalyzer.scopeTypes.expression);
	                }
	            }
	        };

	        // open the global scope
	        saveScope(StaticAnalyzer.globalScopeBracket, StaticAnalyzer.scopeTypes.es5);


	        while (i < n) {
	            const cur = this.source.charCodeAt(i);

	            if (cur === 123 /* '{'.charCodeAt(0) */) {
	                saveScope(cur);
	            } else if (cur === 125 /* '}'.charCodeAt(0) */) {
	                saveScope(cur);
	            } else if (cur === 61 /* '='.charCodeAt(0) */ && this.source.charCodeAt(i + 1) === 62 /* '>'.charCodeAt(0) */) {
	                saveScope(cur, StaticAnalyzer.scopeTypes.arrowFunction);
	            } else if (StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i - 1)) !== -1 &&
	                StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 3)) !== -1 &&
	                this.source.substr(i, 3) === 'for') {
	                saveScope(cur, StaticAnalyzer.scopeTypes.for);
	            } else {
	                // arrow functions, e.g. a = (a,b,c,d)=>a+b+c+typeof d
	                if (bracketStack[bracketStack.length - 1] === -1) {
	                    if (cur === 59 /* ';'.charCodeAt(0) */ || cur === 44 /* ','.charCodeAt(0) */) {
	                        saveScope(-2, StaticAnalyzer.scopeTypes.expression);
	                    } else if (cur === '\n'.charCodeAt(0)) {
	                        if (this.checkIfExpressionIsOver(i)) {
	                            saveScope(-2, StaticAnalyzer.scopeTypes.expression);
	                        }
	                    }
	                }

	                // for loops e.g. for (let i=0;i<10;i++) console.log(i), i++, true, i--
	                if (bracketStack[bracketStack.length - 1] === -3) {
	                    if (cur === 59 /* ';'.charCodeAt(0) */) {
	                        saveScope(-4, StaticAnalyzer.scopeTypes.singleStatement);
	                    } else if (cur === 10 /* '\n'.charCodeAt(0) */) {
	                        if (this.checkIfExpressionIsOver(i)) {
	                            saveScope(-4, StaticAnalyzer.scopeTypes.singleStatement);
	                        }
	                    }
	                }

	                if (cur === 40 /* '('.charCodeAt(0) */ || cur === 91 /* '['.charCodeAt(0) */) {
	                    bracketStack.push(cur);
	                } else if (cur === 41 /* ')'.charCodeAt(0) */) {
	                    popBracketStack(41 /* ')'.charCodeAt(0) */);
	                } else if (cur === 93 /* ']'.charCodeAt(0) */) {
	                    popBracketStack(93 /* ']'.charCodeAt(0) */);

	                    const j = this.skipNonCode(i + 1, StaticAnalyzer.cOBJ);
	                    if (this.source.charCodeAt(j) === 61 /* '='.charCodeAt(0) */) {
	                        this._destructions.push(i);
	                    }
	                }
	            }

	            i = this.skipNonCode(++i, curCommentIndex, 1, true, true, false);
	        }

	        // close the global scope
	        saveScope(1, StaticAnalyzer.scopeTypes.es5);

	        {
	            const n = es6Scopes[0].length;
	            const scopeStack = [];
	            const allScopes = [];

	            // start numerating k(scope indexes) from 1, because 0 is the global scope
	            for (let i = 0, k = 0; i < n; i++) {
	                if (this._scopeData[i][0] >> 10) {
	                    continue;
	                }

	                es5Scopes[0].push(es6Scopes[0][i]);
	                es5Scopes[1].push(es6Scopes[1][i]);

	                es5Scopes[2].push(k);
	                allScopes.push([es6Scopes[0][i], k, 0]);
	                allScopes.push([es6Scopes[1][i], k, 1]);
	                k++;
	                this._es5ScopeMap.push(i);
	            }
	            allScopes.sort((a, b) => a[0] - b[0]);
	            const m = allScopes.length;

	            for (let i = 0; i < m; i++) {
	                if (!allScopes[i][2]) {
	                    es5ScopeGraph.push([]);
	                    if (scopeStack.length) {
	                        es5ScopeGraph[scopeStack[scopeStack.length - 1]].push(allScopes[i][1]);
	                    }
	                    scopeStack.push(allScopes[i][1]);

	                } else {
	                    this._closingEs5ScopesSorted[0].push(es5Scopes[1][allScopes[i][1]]);
	                    this._closingEs5ScopesSorted[1].push(allScopes[i][1]);
	                    scopeStack.pop();
	                }
	            }
	        }

	        this._es5ScopeGraph = new Graph(this._es5ScopeGraphData);
	        this._es6ScopeGraph = new Graph(this._es6ScopeGraphData);
	        this._es5ScopeGraph.analyze();
	        this._es6ScopeGraph.analyze();
	    }

	    isCommentOrString(index) {
	        if (!this._commentsAndStringsAnalyzed) {
	            // not analyzed
	            return false;
	        }

	        return binarySearchIntervals(this._commentsAndStrings, index) !== -1;
	    }

	    skipNonCode(j, params, direction = 1, skipComments = true, skipWhitespace = true, skipNewLine = true, skipStrings = true) {
	        const oldJ = j;
	        let curCommentIndex = params.cci;
	        if (curCommentIndex !== 0 && !curCommentIndex) {
	            curCommentIndex = binarySearchIntervals(this._commentsAndStrings, j, true);
	        }

	        while (j < this.source.length && j >= 0) {
	            if (((skipComments &&
	                    (this._commentsAndStringsTypes[curCommentIndex] === 4 || this._commentsAndStringsTypes[curCommentIndex] === 5)) ||
	                    (skipStrings &&
	                        (this._commentsAndStringsTypes[curCommentIndex] === 1 || this._commentsAndStringsTypes[curCommentIndex] === 2 || this._commentsAndStringsTypes[curCommentIndex] === 6))) &&
	                curCommentIndex >= 0 && curCommentIndex < this._commentsAndStrings.length &&
	                this._commentsAndStrings[curCommentIndex][0] <= j && j <= this._commentsAndStrings[curCommentIndex][1]) {

	                j = this._commentsAndStrings[curCommentIndex][direction === 1 ? 1 : 0];
	                if (direction === -1) {
	                    j--;
	                }

	                curCommentIndex += direction;
	                continue;
	            }

	            const curCharCode = this.source.charCodeAt(j);
	            if ((skipNewLine && curCharCode === 10) || (skipWhitespace && curCharCode <= 32 && curCharCode !== 10)) {
	                j += direction;
	                continue;
	            }

	            break;
	        }
	        if (params.hasOwnProperty('cci')) {
	            params.cci = curCommentIndex;
	        }
	        if (params.hasOwnProperty('skipped')) {
	            params.skipped = oldJ === j;
	        }

	        return j;
	    };

	    skipBrackets(j, params, forward = true, backward = true) {
	        let oldJ = j;
	        const bracket = this.source.charCodeAt(j);

	        let curCommentIndex = params.cci;
	        if (curCommentIndex !== 0 && !curCommentIndex) {
	            curCommentIndex = binarySearchIntervals(this._commentsAndStrings, j, true);
	        }

	        const isOpening = [123 /* '{'.charCodeAt(0) */, 40 /* '('.charCodeAt(0) */, 91 /* '['.charCodeAt(0) */].indexOf(bracket) !== -1;
	        const isClosing = [125 /* '}'.charCodeAt(0) */, 41 /* ')'.charCodeAt(0) */, 93 /* ']'.charCodeAt(0) */].indexOf(bracket) !== -1;

	        if (!isOpening && !isClosing)
	            return oldJ;

	        if (isOpening && !forward || isClosing && !backward)
	            return oldJ;

	        if (bracket === '{'.charCodeAt(0)) {
	            if (params.hasOwnProperty('cci')) {
	                params.cci = NaN;
	            }
	            return this._es6Scopes[1][this._es6Scopes[0].indexOf(j)];
	        } else if (bracket === '}'.charCodeAt(0)) {
	            if (params.hasOwnProperty('cci')) {
	                params.cci = NaN;
	            }
	            return this._es6Scopes[0][this._es6Scopes[1].indexOf(j)] - 1;
	        }

	        let reverseBracket;
	        if (bracket === 40 /* '('.charCodeAt(0) */)
	            reverseBracket = 41 /* ')'.charCodeAt(0) */;

	        if (bracket === 41 /* ')'.charCodeAt(0) */)
	            reverseBracket = 40 /* '('.charCodeAt(0) */;

	        if (bracket === 91 /* '['.charCodeAt(0) */)
	            reverseBracket = 93 /* ']'.charCodeAt(0) */;

	        if (bracket === 93 /* ']'.charCodeAt(0) */)
	            reverseBracket = 91 /* '['.charCodeAt(0) */;

	        let stack = 1;
	        const direction = isOpening ? 1 : -1;
	        j += direction;
	        while (j < this.source.length && j >= 0) {
	            j = this.skipNonCode(j, params, direction);

	            if (bracket === this.source.charCodeAt(j)) {
	                stack++;
	            } else if (reverseBracket === this.source.charCodeAt(j)) {
	                stack--;

	                if (stack === 0)
	                    return isOpening ? j : j - 1;
	            }

	            j += direction;
	        }

	        if (params.hasOwnProperty('cci')) {
	            params.cci = curCommentIndex;
	        }

	        if (params.hasOwnProperty('skipped')) {
	            params.skipped = oldJ === j;
	        }

	        return oldJ;
	    };

	    skipNonCodeAndScopes(j, params, direction = 1, skipComments = true, skipWhitespace = true, skipNewLine = true) {
	        const skipBracketsForward = direction === 1;

	        let currJ;
	        do {
	            currJ = j;
	            j = this.skipNonCode(j, params, direction, skipComments, skipWhitespace, skipNewLine);
	            j = this.skipBrackets(j, params, skipBracketsForward, !skipBracketsForward);
	        } while (currJ !== j && j >= 0 && j < this.source.length);

	        return j;
	    }

	    getWordFromIndex(i) {
	        if (StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i)) !== -1)
	            return [NaN, NaN];

	        if (this.isCommentOrString(i))
	            return [NaN, NaN];

	        let start = i;
	        let end = i;

	        let currChar = this.source.charCodeAt(end);
	        while (StaticAnalyzer.jsDelimiterChars.indexOf(currChar) === -1 && end < this.source.length) {
	            end++;
	            currChar = this.source.charCodeAt(end);
	        }

	        currChar = this.source.charCodeAt(start);
	        while (StaticAnalyzer.jsDelimiterChars.indexOf(currChar) === -1 && start >= 0) {
	            start--;
	            currChar = this.source.charCodeAt(start);
	        }

	        return [start + 1, end];
	    }

	    nextString(j, params = {}) {
	        let curCommentIndex = params.cci;
	        if (curCommentIndex !== 0 && !curCommentIndex) {
	            curCommentIndex = binarySearchIntervals(this._commentsAndStrings, j, true);
	        }

	        while (j < this.source.length) {
	            if (curCommentIndex >= 0 && curCommentIndex < this._commentsAndStrings.length &&
	                this._commentsAndStrings[curCommentIndex][0] <= j && j <= this._commentsAndStrings[curCommentIndex][1] &&
	                (this._commentsAndStringsTypes[curCommentIndex] === 4 || this._commentsAndStringsTypes[curCommentIndex] === 5)) {

	                j = this._commentsAndStrings[curCommentIndex][1];
	                curCommentIndex++;
	                continue;
	            }

	            if (this.source.charCodeAt(j) <= 32) {
	                j++;
	                continue;
	            }

	            break;
	        }

	        if (params.hasOwnProperty('cci')) {
	            params.cci = curCommentIndex;
	        }

	        return curCommentIndex;
	    };

	    isSubstringInArray(index, array, direction = 1) {
	        let i = 0;
	        let curLength = 0;
	        const len = array.length;
	        let cur = '';

	        while (i < len) {
	            if (curLength !== array[i].length) {
	                curLength = array[i].length;
	                if (direction === 1) {
	                    cur = this.source.substr(index, curLength);
	                } else {
	                    cur = this.source.substr(index - curLength + 1, curLength);
	                }
	            }

	            if (cur === array[i]) {
	                return cur;
	            }

	            i++;
	        }

	        return null;
	    }

	    findExports() {
	        const cciObject = {cci: NaN};
	        const exports = [];

	        const analyzeExport = (i, exportIndex) => {
	            cciObject.cci = NaN;
	            const exportBeginning = i;
	            i += 6;

	            const states = {
	                start: 0,
	                brackets: {
	                    anything: 10,
	                    var: 11,
	                    as: 12,
	                    label: 13
	                },
	                lcv: {
	                    anything: 61,
	                    var: 62,
	                    afterEqual: 63
	                },
	                fc: {
	                    anything: 40,
	                    var: 41
	                },
	                from: 50,
	                end: 100
	            };

	            const memory = {
	                currVar: new Array(1000),
	                currVarLength: 0,
	                currLabel: new Array(1000),
	                currLabelLength: 0,
	                exportType: '',
	                nonCodeSkipped: false,
	                from: null
	            };

	            const saveVar = () => {
	                const name = memory.currVar.join('');
	                const label = memory.currLabelLength > 0 ? memory.currLabel.join('') : name;

	                memory.currVar.fill(undefined);
	                memory.currLabel.fill(undefined);
	                memory.currVarLength = 0;
	                memory.currLabelLength = 0;

	                exports.push({
	                    exportIndex,
	                    exportBeginning,
	                    name,
	                    label,
	                    isBrackets: memory.exportType === 'brackets',
	                    isLet: memory.exportType === 'let',
	                    isConst: memory.exportType === 'const',
	                    isVar: memory.exportType === 'var',
	                    isClass: memory.exportType === 'class',
	                    isFunction: memory.exportType === 'function',
	                    isGeneratorFunction: memory.exportType === 'function*',
	                    isAll: memory.exportType === '*',
	                    isDefault: memory.exportType === 'default',
	                    from: memory.from
	                });
	            };

	            const collectResults = (end = i) => {
	                let i = exports.length;
	                while (--i >= 0 && exports[i].exportIndex === exportIndex) {
	                    exports[i].from = memory.from;
	                    exports[i].exportEnd = end;
	                }
	            };

	            let state = states.start;

	            while (i < this.source.length) {
	                let j;
	                j = this.skipNonCode(i, cciObject);
	                memory.nonCodeSkipped = i !== j;
	                i = j;

	                const currChar = this.source.charAt(i);
	                const currCharCode = this.source.charCodeAt(i);

	                switch (state) {
	                    /**
	                     * Checks export type
	                     */
	                    case states.start:
	                        if (123 /* '{'.charCodeAt(0) */ === currCharCode) {
	                            state = states.brackets.anything;
	                            break;
	                        }

	                        if (42 /* '*'.charCodeAt(0) */ === currCharCode) {
	                            memory.exportType = '*';
	                            state = states.from;
	                            saveVar();
	                            break;
	                        }

	                        if ('let' === this.source.substr(i, 3) && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 3)) !== -1) {
	                            memory.exportType = 'let';
	                            i += 2;
	                            state = states.lcv.anything;
	                            break;
	                        }

	                        if ('var' === this.source.substr(i, 3) && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 3)) !== -1) {
	                            memory.exportType = 'var';
	                            i += 2;
	                            state = states.lcv.anything;
	                            break;
	                        }

	                        if ('const' === this.source.substr(i, 5) && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 5)) !== -1) {
	                            memory.exportType = 'const';
	                            i += 4;
	                            state = states.lcv.anything;
	                            break;
	                        }

	                        if ('function' === this.source.substr(i, 8) && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 8)) !== -1) {
	                            memory.exportType = 'function';
	                            i += 7;
	                            let j;
	                            j = this.skipNonCode(i + 1, cciObject);
	                            if ('*'.charCodeAt(0) === this.source.charCodeAt(j)) {
	                                i = j;
	                                memory.exportType = 'function*';
	                            }

	                            state = states.fc.anything;
	                            break;
	                        }

	                        if ('class' === this.source.substr(i, 5) && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 5)) !== -1) {
	                            memory.exportType = 'class';
	                            i += 4;
	                            state = states.fc.anything;
	                            break;
	                        }

	                        if ('default' === this.source.substr(i, 7) && StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i + 7)) !== -1) {
	                            memory.exportType = 'default';
	                            state = states.end;
	                            saveVar();
	                            break;
	                        }

	                        break;

	                    /**
	                     * EXPORT TYPE Brackets
	                     */
	                    case states.brackets.anything:
	                        memory.exportType = 'brackets';
	                        i--;
	                        state = states.brackets.var;
	                        break;

	                    case states.brackets.var:
	                        i = this.skipNonCode(i, cciObject);

	                        if (memory.nonCodeSkipped && 'a'.charCodeAt(0) === this.source.charCodeAt(i) && 's'.charCodeAt(0) === this.source.charCodeAt(i + 1)) {
	                            i += 2;
	                            state = states.brackets.label;
	                            break;
	                        }

	                        if (','.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            i++;
	                            state = states.brackets.anything;
	                            break;
	                        }

	                        if ('}'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.from;
	                            break;
	                        }

	                        memory.currVar[memory.currVarLength++] = currChar;
	                        break;

	                    case states.brackets.label:
	                        i = this.skipNonCode(i, cciObject);

	                        if (','.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            i++;
	                            state = states.brackets.anything;
	                            break;
	                        }

	                        if ('}'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.from;
	                            break;
	                        }

	                        memory.currLabel[memory.currLabelLength++] = currChar;
	                        break;


	                    /**
	                     * EXPORT TYPE Let
	                     * EXPORT TYPE Const
	                     * EXPORT TYPE Var
	                     */
	                    case states.lcv.anything:
	                        i -= 1;
	                        state = states.lcv.var;
	                        break;

	                    case states.lcv.var:
	                        if ('='.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.lcv.afterEqual;
	                            break;
	                        }

	                        if (','.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.lcv.anything;
	                            break;
	                        }

	                        if (';'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.end;
	                            break;
	                        }

	                        memory.currVar[memory.currVarLength++] = currChar;
	                        break;

	                    case states.lcv.afterEqual:
	                        i = this.skipBrackets(i, cciObject);

	                        if (','.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            state = states.lcv.anything;
	                            break;
	                        }

	                        if (';'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            state = states.end;
	                            break;
	                        }

	                        break;

	                    /**
	                     * EXPORT TYPE Function
	                     */
	                    case states.fc.anything:
	                        i -= 1;
	                        state = states.fc.var;
	                        break;

	                    case states.fc.var:
	                        if (memory.nonCodeSkipped || '('.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.end;
	                            break;
	                        }

	                        memory.currVar[memory.currVarLength++] = currChar;
	                        break;

	                    /**
	                     * FROM
	                     */
	                    case states.from:
	                        if (this.source.substr(i, 4) === 'from') {
	                            i += 4;
	                            const url = this._commentsAndStrings[this.nextString(i, cciObject)];
	                            memory.from = this.source.substring(url[0] + 1, url[1] - 1);
	                            return collectResults(url[1]);
	                        }

	                    /**
	                     * Return results
	                     */
	                    case states.end:
	                        return collectResults();
	                }

	                i++;
	            }

	            return collectResults();
	        };

	        const rx = /(?:^|\s|\/|\)|\[|;|{|})(export)(?={|\s|\/)/gm;
	        let match;
	        let i = 0;
	        while ((match = rx.exec(this.source))) {
	            let curPos = match[0].indexOf('export') + match.index;
	            if (this.isCommentOrString(curPos)) {
	                continue;
	            }
	            analyzeExport(curPos, i++);
	        }

	        this.exports = exports;
	    }

	    findImports() {
	        const cciObject = {cci: NaN};
	        const imports = [];

	        const analyzeImport = (i, importIndex) => {
	            cciObject.cci = NaN;
	            const importBeginning = i;
	            i += 6;

	            const states = {
	                start: 0,
	                brackets: {
	                    anything: 10,
	                    var: 11,
	                    as: 12,
	                    label: 13
	                },
	                default: {
	                    anything: 61,
	                    var: 62
	                },
	                all: {
	                    anything: 71,
	                    var: 72
	                },
	                end: 100
	            };

	            const memory = {
	                currVar: new Array(1000),
	                currVarLength: 0,
	                currLabel: new Array(1000),
	                currLabelLength: 0,
	                importType: '',
	                nonCodeSkipped: false,
	                from: null,
	                isFirstStart: true
	            };

	            const saveVar = () => {
	                const name = memory.currVar.join('');
	                const label = memory.currLabelLength > 0 ? memory.currLabel.join('') : name;

	                memory.currVar.fill(undefined);
	                memory.currLabel.fill(undefined);
	                memory.currVarLength = 0;
	                memory.currLabelLength = 0;

	                imports.push({
	                    importIndex,
	                    importBeginning,
	                    importEnd: memory.importEnd,
	                    name,
	                    label,
	                    isBrackets: memory.importType === 'brackets',
	                    isDefault: memory.importType === 'default',
	                    isAll: memory.importType === '*',
	                    isES5: memory.importType === 'es5',
	                    from: memory.from
	                });
	            };

	            const collectResults = () => {
	                let i = imports.length;
	                while (--i >= 0 && imports[i].importIndex === importIndex) {
	                    imports[i].from = memory.from;
	                    imports[i].importEnd = memory.importEnd;
	                }
	            };

	            let state = states.start;

	            let checkES5Import = true;
	            while (i < this.source.length) {
	                let j;
	                j = this.skipNonCode(i, cciObject, 1, true, true, true, false);
	                memory.nonCodeSkipped = i !== j;
	                i = j;

	                if (checkES5Import) {
	                    const nextString = this._commentsAndStrings[this.nextString(i)];
	                    if (i === nextString[0]) {
	                        memory.importType = 'es5';
	                        memory.importEnd = nextString[1];
	                        memory.from = this.source.substring(nextString[0] + 1, nextString[1] - 1);
	                        saveVar();
	                        state = states.end;
	                    }
	                }

	                checkES5Import = false;

	                const currChar = this.source.charAt(i);
	                switch (state) {
	                    /**
	                     * Checks import type
	                     */
	                    case states.start:
	                        if ('{'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            state = states.brackets.anything;
	                            break;
	                        }

	                        if ('*'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            state = states.all.anything;
	                            break;
	                        }

	                        if (this.source.substr(i, 4) === 'from') {
	                            i += 4;
	                            const url = this._commentsAndStrings[this.nextString(i)];
	                            memory.importEnd = url[1];
	                            memory.from = this.source.substring(url[0] + 1, url[1] - 1);
	                            state = states.end;
	                            break;
	                        }

	                        memory.importType = 'default';
	                        state = states.default.anything;
	                        break;

	                    /**
	                     * IMPORT TYPE Brackets
	                     */
	                    case states.brackets.anything:
	                        memory.importType = 'brackets';
	                        i--;
	                        state = states.brackets.var;
	                        break;

	                    case states.brackets.var:
	                        if (memory.nonCodeSkipped && 'a'.charCodeAt(0) === this.source.charCodeAt(i) && 's'.charCodeAt(0) === this.source.charCodeAt(i + 1)) {
	                            i += 2;
	                            state = states.brackets.label;
	                            break;
	                        }

	                        if (','.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            i++;
	                            state = states.brackets.anything;
	                            break;
	                        }

	                        if ('}'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.start;
	                            break;
	                        }

	                        memory.currVar[memory.currVarLength++] = currChar;
	                        break;

	                    case states.brackets.label:
	                        i = this.skipNonCode(i, cciObject);

	                        if (','.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            i++;
	                            state = states.brackets.anything;
	                            break;
	                        }

	                        if ('}'.charCodeAt(0) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.start;
	                            break;
	                        }

	                        memory.currLabel[memory.currLabelLength++] = currChar;
	                        break;


	                    /**
	                     * IMPORT TYPE Default
	                     */
	                    case states.default.anything:
	                        i -= 2;
	                        state = states.default.var;
	                        break;

	                    case states.default.var:
	                        if (StaticAnalyzer.jsDelimiterChars.indexOf(this.source.charCodeAt(i)) !== -1) {
	                            saveVar();
	                            state = states.start;
	                            break;
	                        }

	                        if (memory.nonCodeSkipped) {
	                            saveVar();
	                            i -= 1;
	                            state = states.start;
	                            break;
	                        }

	                        memory.currVar[memory.currVarLength++] = currChar;
	                        break;

	                    /**
	                     * IMPORT TYPE * as obj
	                     */
	                    case states.all.anything:
	                        memory.importType = '*';
	                        i = this.skipNonCode(i, cciObject);
	                        if (this.source.substr(i, 2) === 'as') {
	                            i += 2;
	                            state = states.all.var;
	                            break;
	                        }

	                        break;

	                    case states.all.var:
	                        if (','.charCodeAt(i) === currChar.charCodeAt(0)) {
	                            saveVar();
	                            state = states.start;
	                            break;
	                        }

	                        if (memory.nonCodeSkipped) {
	                            saveVar();
	                            i -= 1;
	                            state = states.start;
	                            break;
	                        }

	                        memory.currVar[0] = 'a';
	                        memory.currVar[1] = 'l';
	                        memory.currVar[2] = 'l';
	                        memory.currVarLength = 3;
	                        memory.currLabel[memory.currLabelLength++] = currChar;
	                        break;

	                    /**
	                     * Return results
	                     */
	                    case states.end:
	                        return collectResults();
	                }

	                i++;
	            }

	            return collectResults();
	        };

	        const rx = /(?:^|\s|\/|\)|\[|;|{|})(import)(?={|\s|\/)/gm;
	        let match;
	        let i = 0;
	        while ((match = rx.exec(this.source))) {
	            let curPos = match[0].indexOf(match[1]) + match.index;
	            if (this.isCommentOrString(curPos) || this.findScope(curPos) !== 0) {
	                continue;
	            }

	            analyzeImport(curPos, i++);
	        }

	        this.imports = imports;
	    }

	    findScope(index, scopeType = StaticAnalyzer.scopeTypes.es6, ignoreDestruction = false) {

	        if (ignoreDestruction && scopeType === StaticAnalyzer.scopeTypes.es6) {
	            const destructionIndex = this.getDestructionIndex(index);
	            if (destructionIndex !== -1) {
	                index = this._destructionScopes[destructionIndex][0];
	            }
	        }

	        let opening = -1;
	        let closing = -1;

	        if (scopeType === StaticAnalyzer.scopeTypes.es6) {
	            opening = binarySearchLowerBound(this._es6Scopes[0], index);
	            closing = this._closingEs6ScopesSorted[1][binarySearchUpperBound(this._closingEs6ScopesSorted[0], index)];
	        } else {
	            opening = binarySearchLowerBound(this._es5Scopes[0], index);
	            closing = this._closingEs5ScopesSorted[1][binarySearchUpperBound(this._closingEs5ScopesSorted[0], index)];
	        }

	        if (opening < 0 || closing < 0) {
	            return 0;
	        }

	        if (scopeType === StaticAnalyzer.scopeTypes.es6) {
	            return this._es6ScopeGraph.lca(opening, closing);
	        }

	        return this._es5ScopeMap[this._es5ScopeGraph.lca(opening, closing)];
	    }

	    analyzeFunctionParams() {
	        this._functionParams = [[], []];
	        const n_scopes = this._scopeData.length;
	        let i = 0;

	        // opening brackets must be sorted
	        while (i < n_scopes) {
	            const scope_data = this._scopeData[i];
	            if (scope_data[1]) {
	                this._functionParams[0].push(scope_data[1][0]);
	                this._functionParams[1].push(scope_data[1][1]);
	            }
	            i++;
	        }
	    }

	    isFunctionParam(index) {
	        if (!this._functionParams) {
	            this.analyzeFunctionParams();
	        }

	        let leftmostOpeningIndex = binarySearch(this._functionParams[0], index, true);

	        do {
	            if (this._functionParams[0][leftmostOpeningIndex] <= index && index <= this._functionParams[1][leftmostOpeningIndex]) {
	                return true;
	            }
	            leftmostOpeningIndex--;
	        } while (leftmostOpeningIndex >= 0);

	        return false;
	    };

	    isAssignment(index) {
	        let skippedIndex = this.skipNonCode(index, StaticAnalyzer.cOBJ);

	        if (this.isSubstringInArray(skippedIndex, StaticAnalyzer.assignmentOperators)) {
	            return true;
	        }

	        if (this.isSubstringInArray(skippedIndex, StaticAnalyzer.unaryOperators)) {
	            return true;
	        }

	        skippedIndex = this.skipNonCode(index - 1, StaticAnalyzer.cOBJ, -1);
	        const substr = this.source.substr(skippedIndex - 2, 2);
	        return substr === '++' || substr === '--';
	    };

	    analyzeDestructionScopes() {
	        this._destructionScopes = [];

	        const n_destructions = this._destructions.length;
	        let i = 0;
	        while (i < n_destructions) {
	            let destructionEnd = this._destructions[i];
	            this._destructionScopes.push([this.skipBrackets(destructionEnd, StaticAnalyzer.cOBJ, false, true), destructionEnd]);
	            i++;
	        }
	    }

	    getDestructionIndex(index) {
	        if (!this._destructionScopes) {
	            this.analyzeDestructionScopes();
	        }

	        return binarySearchIntervals(this._destructionScopes, index);
	    }

	    findReferences(variable) {
	        const rx = new RegExp('(?:^|\\s|=|\\+|\\-|\\/|\\*|\\%|\\(|\\)|\\[|;|:|{|}|\\n|\\r|,|!|&|\\||\\^|\\?|>|<)('
	            + variable
	            + ')(?=\\s|$|=|\\+|\\.|\\-|\\/|\\*|\\%|\\(|\\)|\\[|\\]|;|:|{|}|\\n|\\r|,|!|&|\\||\\^|\\?|>|<)', 'gm');
	        let match;

	        // might be a bug if there is a = somethingsomethingfunction* x, we will mistake this for a definition
	        // probably need to check the other side too
	        const declarationTypes = ['var', 'let', 'const', 'class', 'function', 'function*'];
	        const declarationTypeScopes = [
	            StaticAnalyzer.scopeTypes.es5,
	            StaticAnalyzer.scopeTypes.es6,
	            StaticAnalyzer.scopeTypes.es6,
	            StaticAnalyzer.scopeTypes.es6,
	            StaticAnalyzer.scopeTypes.es5,
	            StaticAnalyzer.scopeTypes.es6
	        ];

	        const getDeclarationType = (index, scope = this.findScope(index), isOverride, params = {}) => {
	            if (this.isFunctionParam(index)) {
	                isOverride.value = false;
	                return 'param';
	            }

	            const destructionIndex = this.getDestructionIndex(index);
	            const endOfReference = destructionIndex !== -1 ? this._destructionScopes[destructionIndex][1] + 1 : this.getWordFromIndex(index)[1];
	            isOverride.value = this.isAssignment(endOfReference);
	            isOverride.index = endOfReference;

	            if (destructionIndex !== -1) {
	                index = this._destructionScopes[destructionIndex][0];
	            }

	            const scopeStart = scope === -1 ? 0 : this._es6Scopes[0][scope];
	            index = this.skipNonCode(index - 1, StaticAnalyzer.cOBJ, -1);

	            // multivariable case
	            if (this.source.charCodeAt(index) === 44 /* ','.charCodeAt(0) */) {
	                let beforeNewLine = false;

	                while (index > scopeStart) {
	                    const currCharCode = this.source.charCodeAt(index);

	                    if (currCharCode === 59 /* ';'.charCodeAt(0) */) {
	                        return null;
	                    }

	                    if (currCharCode === 10 && this.checkIfExpressionIsOver(index)) {
	                        return null;
	                    }

	                    let [start, end] = this.getWordFromIndex(index);
	                    if (!isNaN(start) && !isNaN(end)) {
	                        const word = this.source.substring(start, end);
	                        if (declarationTypes.indexOf(word) !== -1) {
	                            return word;
	                        }

	                        index = start;
	                    }

	                    beforeNewLine = currCharCode === 10; // '\n'.charCodeAt(0)
	                    index = this.skipNonCodeAndScopes(--index, StaticAnalyzer.cOBJ, -1, true, true, false);
	                }

	                if (index === scopeStart) {
	                    return null;
	                }
	            }

	            const declarationType = this.isSubstringInArray(index, declarationTypes, -1);

	            if (declarationType) {
	                params.start = index - declarationType.length;
	            }
	            return declarationType;
	        };

	        const references = [];
	        const isOverride = {value: false};

	        const isObject = (index) => {
	            let start = index;
	            let end = index;

	            const params = {cci: NaN};
	            while (start >= 0) {
	                const cur = this.source.charCodeAt(start);
	                if (StaticAnalyzer.jsDelimiterChars.indexOf(cur) !== -1) {
	                    if (cur === '.'.charCodeAt(0))
	                        return false;
	                    if (cur === ','.charCodeAt(0) || cur === '{'.charCodeAt(0))
	                        break;
	                    else
	                        return false;
	                }

	                start = this.skipNonCode(start - 1, params, -1);
	            }

	            while (end < this.source.length) {
	                const cur = this.source.charCodeAt(end);
	                if (StaticAnalyzer.jsDelimiterChars.indexOf(cur) !== -1) {
	                    if (cur === ':'.charCodeAt(0))
	                        break;
	                    else
	                        return false;
	                }
	                end = this.skipNonCode(end + 1, params);
	            }

	            return true;
	        };

	        const scopesToIgnore = new Int8Array(this._es6Scopes[0].length);
	        while ((match = rx.exec(this.source))) {
	            const index = match[0].indexOf(variable) + match.index;
	            if (!this.isCommentOrString(index) && !isObject(index)) {
	                const params = {start: -1};
	                const declaration = getDeclarationType(index, this.findScope(index), isOverride, params);
	                const scopeType = declarationTypeScopes[declarationTypes.indexOf(declaration)];
	                const scope = this.findScope(index, scopeType, true);

	                references.push({
	                    index,
	                    isOverride: Object.assign({}, isOverride),
	                    declaration,
	                    scope,
	                    scopeType,
	                    declarationStart: params.start
	                });

	                if (declaration && scope !== 0) {
	                    this._es6ScopeGraph.dfs(scope => {
	                        scopesToIgnore[scope] = 1;
	                    }, scope);
	                }
	            }
	        }

	        const ret = [];
	        for (let i = 0; i < references.length; i++) {
	            const ref = references[i];
	            if (scopesToIgnore[ref.scope]) {
	                continue;
	            }

	            ret.push(ref);
	        }
	        return ret;
	    }

	    // helper functions

	    visualizeCode(container) {
	        const spacePlaceHolder = String.fromCharCode(1000);
	        const newLinePlaceHolder = String.fromCharCode(1001);

	        const cur = this.source.replace(/\n/g, newLinePlaceHolder).replace(/\s/g, spacePlaceHolder);
	        let res = '';
	        const scopes = [...this._es6Scopes[0], ...this._es6Scopes[1]];

	        for (let i = 0; i < cur.length; i++) {
	            let c = cur.charAt(i).replace('<', "&lt;").replace('>', "&gt;");

	            if (this.isCommentOrString(i)) {
	                c = `<u><b>${c}</b></u>`;
	            }

	            if (scopes.indexOf(i) !== -1) {
	                if (c === spacePlaceHolder || c === newLinePlaceHolder) {
	                    c += `<span style="background-color: #ff0000; color: #fff">&nbsp</span>`;
	                } else {
	                    c = `<span style="background-color: #ff0000; color: #fff">${c}</span>`;
	                }

	            }

	            res += c;

	        }

	        container.innerHTML = res.replace(new RegExp(newLinePlaceHolder, 'g'), '<br>').replace(new RegExp(spacePlaceHolder, 'g'), '&nbsp;');
	    }

	    visualizeExports() {
	        console.table(reshapeObject(this.exports));
	    }

	    visualizeImports() {
	        console.table(this.imports);
	    }

	    printBrokenScopes() {
	        const res = [];
	        for (let i = 0; i < this._es6Scopes[0].length; i++)
	            if (isNaN(this._es6Scopes[1][i]))
	                res.push(this._es6Scopes[0][i]);
	        for (let i in res) {
	            console.log(this.source.substr(res[i], 100));
	        }
	    }

	    printFunctionArguments() {
	        const res = this._scopeData.filter(x => x[0] && (x[0] === StaticAnalyzer.scopeTypes.function || x[0] & StaticAnalyzer.scopeTypes.arrowFunction));
	        const arrRes = [];
	        for (let i in res) {
	            if (!isNaN(res[i][1][0]) && !isNaN(res[i][1][1])) {
	                arrRes.push(this.source.substring(res[i][1][0], res[i][1][1]));
	            }
	        }
	        return arrRes.join('\n');
	    }
	}

	StaticAnalyzer.cOBJ = {};
	StaticAnalyzer.jsDelimiterChars = ['=', '+', '-', '/', '*', '%', '(', ')', '[', ';', ':', '{', '}', '\n', '\r', ',', '!', '&', '|', '^', '?', ' '].map(x => x.charCodeAt(0));
	StaticAnalyzer.operatorChars = ['+', '-', '/', '*', '%', '>', '<', '&', '|', '^', '=', '?', ':', '~', '\n'].map(x => x.charCodeAt(0));
	StaticAnalyzer.operatorWords = ['instanceof', 'delete', 'typeof', 'void', 'in'];
	StaticAnalyzer.assignmentOperators = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=', '**=', '>>=', '<<=', '>>>='];
	StaticAnalyzer.unaryOperators = ['++', '--'];

	StaticAnalyzer.scopeTypes = {
	    es5: 0b00000000000,
	    es6: 0b10000000000,
	    singleStatement: 0b00100000000,
	    expression: 0b00010000000,
	    destruction: 0b11000000000,
	    function: 0b00000000010,
	    arrowFunction: 0b00000000100,
	    for: 0b10000001000,
	    if: 0b10000010000,
	    while: 0b10000100000,
	    do: 0b10001000000,
	    class: 0b10010000000
	};

	StaticAnalyzer.globalScopeBracket = 11116666;

	class StringTokenizer {
	    constructor(str) {
	        this.string = str;
	        this.changes = [];
	    }

	    add(index, token) {
	        this.changes.push({type: StringTokenizer.changeTypes.add, index: index, token: token});
	        return this;
	    }

	    addExportedVariable(label) {
	        this.add(-1, `_exports._${label} = void 0;\n`);
	        this.add(-1, `Object.defineProperty(_exports, '${label}', {
            enumerable: true,
            set: (value) => {     
                _exports._${label} = value;
                _exports.emit('valuechange', {newValue: value, label: '${label}'});
            },
            get: () => _exports._${label}
        })\n\n`);
	        this.add(-1, `_exports.__labels__.add('${label}')\n`);
	    }

	    remove(start, end) {
	        this.changes.push({type: StringTokenizer.changeTypes.remove, index: start, end: end});
	        return this;
	    }

	    replace(start, end, token) {
	        this.add(start, token);
	        this.remove(start, end);
	    }

	    apply() {

	        const tmp = [];

	        let curIndexOriginalString = 0;
	        this.changes.forEach((e, i) => {
	            e.originalIndex = i;
	        });

	        this.changes.sort((i, j) => {
	            if (i.index !== j.index) {
	                return i.index - j.index;
	            }

	            if (i.type !== j.type) {
	                return i.type - j.type
	            }

	            return i.originalIndex - j.originalIndex;
	        });

	        for (let i = 0; i < this.changes.length; i++) {
	            if (this.changes[i].type === StringTokenizer.changeTypes.add) {
	                tmp.push(this.string.substring(curIndexOriginalString, this.changes[i].index));
	                tmp.push(this.changes[i].token);
	                curIndexOriginalString = this.changes[i].index;
	            }

	            if (this.changes[i].type === StringTokenizer.changeTypes.remove) {
	                tmp.push(this.string.substring(curIndexOriginalString, this.changes[i].index));
	                curIndexOriginalString = this.changes[i].end;
	            }
	        }

	        tmp.push(this.string.substring(curIndexOriginalString));
	        return tmp.join('');
	    }
	}

	StringTokenizer.changeTypes = {
	    add: 1,
	    remove: 2
	};

	class File extends EventEmitter {
	    constructor(url) {
	        super();
	        this.url = url;
	        this.exports = {};
	        this.analyzer = null;
	        this.isReady = false;

	        this.exportedValues = new EventEmitter();
	        this.exportedValues.__labels__ = new Set();

	        this.dependencies = null;

	        this._isLoaded = false;
	        this._isAnalyzed = false;
	        this._isTranspiled = false;
	        this._isRun = false;
	    }

	    load() {
	        return get(this.url, {}).then((data) => {
	            this.source = data;
	            this._isLoaded = true;
	        });
	    }

	    analyze() {
	        return new Promise((resolve, reject) => {
	            this.analyzer = new StaticAnalyzer(this.source);
	            this.analyzer.analyzeCommentsAndStrings();
	            this.analyzer.analyzeScopes();
	            this.analyzer.analyzeFunctionParams();
	            this.analyzer.findImports();
	            this.analyzer.findExports();

	            this._isAnalyzed = true;
	            resolve();
	        });
	    }

	    transpile(args) {
	        return new Promise((resolve, reject) => {
	            const imports = this.analyzer.imports;
	            const exports = this.analyzer.exports;
	            const tokenizer = new StringTokenizer(this.source);

	            this.dependencies = Array.from(
	                new Set(
	                    this.analyzer.imports.concat(this.analyzer.exports.filter(i => !!i.from)).map(i => `${i.from}`)
	                )
	            );

	            const import_variables = imports.filter(i => !i.isES5).map(i => i.label).join(', ');

	            tokenizer.add(-1, `// ${this.url}\n`);
	            tokenizer.add(-1, `${args.loadImports}([${this.dependencies.map(i => `'${i}'`).join(', ')}],(function (_exports, _setters, ${import_variables}){\n`);
	            // todo: fix this later. no time now
	            tokenizer.add(-1, `
                for(let i in _setters) {
                    _setters[i].from.on('valuechange', evt => {
                        if(!_setters[i].imports[evt.label]) return;
                        let shouldEmit = eval(\`\${evt.label} !== evt.newValue\`);
                        eval(\`\${evt.label} = evt.newValue\`);          
                        if(shouldEmit && ${args.exportedValues}.hasOwnProperty(evt.label)) {
                            ${args.exportedValues}[evt.label] = evt.newValue;
                        }
                    })
                }
            `);

	            let curIndex = -1;
	            for (let i = 0; i < imports.length; i++) {
	                if (curIndex === imports[i].importIndex) continue;
	                tokenizer.add(imports[i].importBeginning, '/*');
	                tokenizer.add(imports[i].importEnd, '*/');
	                curIndex = imports[i].importIndex;
	            }

	            const processedNames = {};

	            curIndex = -1;
	            for (let i = 0; i < exports.length; i++) {
	                const exprt = exports[i];
	                if (exprt.from) {
	                    tokenizer.remove(exprt.exportBeginning, exprt.exportEnd);
	                    continue;
	                }

	                const name = exprt.name;
	                const label = exprt.label;

	                if (!processedNames[name]) {
	                    tokenizer.addExportedVariable(label);
	                } else {
	                    tokenizer.add(-1, `Object.defineProperty(_exports, '${label}', {
                        enumerable: true,
                        get: () => _exports.${processedNames[name]},
                    })`);
	                    tokenizer.add(-1, `\n_exports.on('${processedNames[name]}', value => _exports.emit('${label}', value))\n`);

	                    continue;
	                }

	                processedNames[name] = label;

	                let references = [];

	                if (!exprt.isDefault) {
	                    references = this.analyzer.findReferences(name);
	                }


	                if (curIndex !== exprt.exportIndex) {
	                    if (exprt.isLet || exprt.isVar || exprt.isConst) {
	                        tokenizer.remove(exprt.exportBeginning, exprt.exportBeginning + 6);
	                    } else if (exprt.isBrackets) {
	                        tokenizer.remove(exprt.exportBeginning, exprt.exportEnd);
	                    } else if (exprt.isFunction || exprt.isGeneratorFunction || exprt.isClass) {
	                        tokenizer.remove(exprt.exportBeginning, exprt.exportBeginning + 6);
	                    } else if (exprt.isDefault) {
	                        tokenizer.replace(exprt.exportBeginning, exprt.exportEnd + 6, `_exports.default = `);
	                    }
	                }

	                if (exprt.isBrackets && !exprt.from) {
	                    tokenizer.add(exprt.exportEnd, `\n_exports.${label} = ${name}\n`);
	                }

	                curIndex = exprt.exportIndex;

	                for (let j = 0; j < references.length; j++) {
	                    const ref = references[j];

	                    if (ref.declaration) {
	                        if (ref.declaration === 'function' || ref.declaration === 'function*') {
	                            tokenizer.add(-1, `_exports._${label} = ${name};\n`);
	                        } else if (ref.declaration === 'class') {
	                            tokenizer.add(ref.declarationStart, `_exports.${label} = `);
	                        } else if (ref.isOverride.value) {
	                            tokenizer.add(ref.isOverride.index + 1, `= _exports.${label} `);
	                        }
	                    } else if (!exprt.isBrackets || (ref.index < exprt.exportBeginning || ref.index >= exprt.exportEnd)) {
	                        tokenizer.replace(ref.index, ref.index + name.length, `_exports.${label}`);
	                    }
	                }
	            }

	            tokenizer.add(this.source.length, `\n}))`);

	            this.transpiledSource = tokenizer.apply();
	            // console.log(this.transpiledSource);
	            this._isTranspiled = true;
	            this.emit('transpiled', {});
	            resolve();
	        });
	    }
	}

	const getId = (object) => {
	    if (!object["__uid__"]) {
	        object["__uid__"] = Math.random();
	    }

	    return object["__uid__"];
	};


	class JSHandler extends EventEmitter {
	    constructor(url, urlMap = {}) {
	        super();

	        this.url = url;
	        this.files = {};
	        this.urlMap = urlMap;

	        this.evalHistory = new Set();

	        const startTime = Date.now();

	        this.loadDependencyTree('', url).then((file) => {
	            console.log('All files have been loaded');
	            console.log(`Loading toook ${Date.now() - startTime}`);
	            return this.eval('', file, new Set());
	        }).then(() => {
	            console.log('All files have been run');
	            console.log(`Overal took ${Date.now() - startTime}`);
	            console.log(`There are ${Object.keys(this.files).length} files`);
	        });
	    }


	    getAbsoluteUrl(from, url) {
	        if (isAbsolute(url)) {
	            return url;
	        }

	        if (this.urlMap !== null) {
	            for (let i in this.urlMap) {
	                if (url.startsWith(i)) {
	                    return join(this.urlMap[i], url.substring(i.length));
	                }
	            }
	        }

	        return join(getDirectory(from), url);
	    };

	    loadDependencyTree(from, url) {
	        return new Promise((resolve, reject) => {
	            const absoluteURL = this.getAbsoluteUrl(from, url);
	            if (this.files[absoluteURL]) {
	                resolve(this.files[absoluteURL]);
	                return;
	            }

	            this.handleUrl(from, url).then((file) => {

	                const promises = [];
	                for (let i = 0; i < file.dependencies.length; i++) {
	                    // const newImportHistory = new Set(importHistory);
	                    // newImportHistory.add(file.url);
	                    const dependency = file.dependencies[i];
	                    promises.push(this.loadDependencyTree(file.url, dependency));
	                }

	                Promise.all(promises).then(() => {
	                    resolve(file);
	                });
	            });
	        });
	    }

	    handleUrl(from, url) {
	        return new Promise((resolve, reject) => {
	            const absoluteURL = this.getAbsoluteUrl(from, url);
	            const file = new File(absoluteURL);
	            this.files[absoluteURL] = file;

	            file.load().then(() => {
	                return file.analyze();
	            }).then(() => {
	                return file.transpile({
	                    loadImports: 'make_imports_work_and_shit',
	                    exportedValues: 'file.exportedValues',
	                });
	            }).then(() => {
	                return resolve(file);
	            });
	        });
	    }


	    eval(from, file, importHistory) {
	        return new Promise((resolve, reject) => {
	            const make_imports_work_and_shit = (imports_array, runCode) => {
	                const forwards = [];
	                for (let i = 0; i < file.analyzer.exports.length; i++) {
	                    if (file.analyzer.exports[i].from) {
	                        forwards.push(file.analyzer.exports[i]);
	                    }
	                }

	                const checkIfAllIsDone = () => {

	                    const curImports = [];
	                    const setters = {};

	                    for (let i = 0; i < file.analyzer.imports.length; i++) {
	                        const curUrl = this.getAbsoluteUrl(file.url, file.analyzer.imports[i].from);

	                        if (file.analyzer.imports[i].isAll) {
	                            curImports.push(this.files[curUrl].exportedValues);
	                        } else if (file.analyzer.imports[i].isDefault) {
	                            curImports.push(this.files[curUrl].exportedValues.default);
	                        } else if (!file.analyzer.imports[i].isES5) {
	                            curImports.push(this.files[curUrl].exportedValues[file.analyzer.imports[i].name]);
	                            const key = getId(this.files[curUrl].exportedValues);
	                            if (!setters[key]) {
	                                setters[key] = {
	                                    from: this.files[curUrl].exportedValues,
	                                    imports: {}
	                                };
	                            }

	                            setters[key].imports[file.analyzer.imports[i].name] = file.analyzer.imports[i].label;
	                        }
	                    }

	                    file._isRun = true;
	                    runCode.bind(window)(file.exportedValues, setters, ...curImports);

	                    const forwardExport = (fromUrl, name, label) => {

	                        if (file.exportedValues.hasOwnProperty(label))
	                            return;

	                        file.exportedValues[`_${label}`] = void 0;
	                        Object.defineProperty(file.exportedValues, label, {
	                            enumerable: true,
	                            get: () => file.exportedValues[`_${label}`],
	                            set: (value) => {
	                                file.exportedValues[`_${label}`] = value;
	                                file.exportedValues.emit('valuechange', {newValue: value, label: label});
	                            }
	                        });
	                        file.exportedValues[label] = this.files[fromUrl].exportedValues[name];

	                        file.exportedValues.__labels__.add(label);
	                    };

	                    for (let i = 0; i < forwards.length; i++) {
	                        const fromUrl = this.getAbsoluteUrl(file.url, forwards[i].from);

	                        this.files[fromUrl].exportedValues.on('valuechange', evt => {
	                            if (file.exportedValues[evt.label] !== evt.newValue) {
	                                file.exportedValues[evt.label] = evt.newValue;
	                            }
	                        });

	                        if (forwards[i].isAll) {
	                            this.files[fromUrl].exportedValues.__labels__.forEach((name) => {
	                                forwardExport(fromUrl, name, name);
	                            });

	                            this.files[fromUrl].exportedValues.on('valuechange', evt => {
	                                if (!file.exportedValues.hasOwnProperty(evt.label)) {
	                                    forwardExport(fromUrl, evt.label, evt.label);
	                                }
	                            });
	                        } else {
	                            forwardExport(fromUrl, forwards[i].name, forwards[i].label);
	                        }
	                    }

	                    file.isReady = true;
	                    file.emit('ready', {});

	                    resolve();
	                };

	                let promises = [() => Promise.resolve()];
	                for (let i = 0; i < imports_array.length; i++) {
	                    const newImportHistory = new Set(importHistory);
	                    newImportHistory.add(file.url);
	                    const absoluteURL = this.getAbsoluteUrl(file.url, imports_array[i]);
	                    const cur = this.files[absoluteURL];
	                    promises.push(() => this.eval(file.url, cur, newImportHistory));
	                }

	                const _resolve = (i) => {
	                    if (i === promises.length) {
	                        checkIfAllIsDone();
	                        return;
	                    }

	                    promises[i]().then(() => {
	                        _resolve(++i);
	                    });
	                };

	                _resolve(0);
	            };

	            if (importHistory.has(file.url)) {
	                resolve();
	                return;
	            }

	            if (this.evalHistory.has(file.url)) {
	                resolve();
	                return;
	            }

	            try {
	                this.evalHistory.add(file.url);
	                eval(file.transpiledSource);
	            } catch (err) {
	                throw err;
	            }
	        });
	    }
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var semver = createCommonjsModule(function (module, exports) {
	exports = module.exports = SemVer;

	// The debug function is excluded entirely from the minified version.
	/* nomin */ var debug;
	/* nomin */ if (typeof process === 'object' &&
	    /* nomin */ process.env &&
	    /* nomin */ process.env.NODE_DEBUG &&
	    /* nomin */ /\bsemver\b/i.test(process.env.NODE_DEBUG))
	  /* nomin */ debug = function() {
	    /* nomin */ var args = Array.prototype.slice.call(arguments, 0);
	    /* nomin */ args.unshift('SEMVER');
	    /* nomin */ console.log.apply(console, args);
	    /* nomin */ };
	/* nomin */ else
	  /* nomin */ debug = function() {};

	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	exports.SEMVER_SPEC_VERSION = '2.0.0';

	var MAX_LENGTH = 256;
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

	// The actual regexps go on exports.re
	var re = exports.re = [];
	var src = exports.src = [];
	var R = 0;

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	var NUMERICIDENTIFIER = R++;
	src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
	var NUMERICIDENTIFIERLOOSE = R++;
	src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';


	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	var NONNUMERICIDENTIFIER = R++;
	src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';


	// ## Main Version
	// Three dot-separated numeric identifiers.

	var MAINVERSION = R++;
	src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')';

	var MAINVERSIONLOOSE = R++;
	src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.

	var PRERELEASEIDENTIFIER = R++;
	src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
	                            '|' + src[NONNUMERICIDENTIFIER] + ')';

	var PRERELEASEIDENTIFIERLOOSE = R++;
	src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
	                                 '|' + src[NONNUMERICIDENTIFIER] + ')';


	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	var PRERELEASE = R++;
	src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
	                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

	var PRERELEASELOOSE = R++;
	src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
	                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	var BUILDIDENTIFIER = R++;
	src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	var BUILD = R++;
	src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
	             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';


	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	var FULL = R++;
	var FULLPLAIN = 'v?' + src[MAINVERSION] +
	                src[PRERELEASE] + '?' +
	                src[BUILD] + '?';

	src[FULL] = '^' + FULLPLAIN + '$';

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
	                 src[PRERELEASELOOSE] + '?' +
	                 src[BUILD] + '?';

	var LOOSE = R++;
	src[LOOSE] = '^' + LOOSEPLAIN + '$';

	var GTLT = R++;
	src[GTLT] = '((?:<|>)?=?)';

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	var XRANGEIDENTIFIERLOOSE = R++;
	src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
	var XRANGEIDENTIFIER = R++;
	src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

	var XRANGEPLAIN = R++;
	src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:' + src[PRERELEASE] + ')?' +
	                   src[BUILD] + '?' +
	                   ')?)?';

	var XRANGEPLAINLOOSE = R++;
	src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:' + src[PRERELEASELOOSE] + ')?' +
	                        src[BUILD] + '?' +
	                        ')?)?';

	var XRANGE = R++;
	src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
	var XRANGELOOSE = R++;
	src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	var LONETILDE = R++;
	src[LONETILDE] = '(?:~>?)';

	var TILDETRIM = R++;
	src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
	re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
	var tildeTrimReplace = '$1~';

	var TILDE = R++;
	src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
	var TILDELOOSE = R++;
	src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	var LONECARET = R++;
	src[LONECARET] = '(?:\\^)';

	var CARETTRIM = R++;
	src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
	re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
	var caretTrimReplace = '$1^';

	var CARET = R++;
	src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
	var CARETLOOSE = R++;
	src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	var COMPARATORLOOSE = R++;
	src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
	var COMPARATOR = R++;
	src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';


	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	var COMPARATORTRIM = R++;
	src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
	                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

	// this one has to use the /g flag
	re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
	var comparatorTrimReplace = '$1$2$3';


	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	var HYPHENRANGE = R++;
	src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
	                   '\\s+-\\s+' +
	                   '(' + src[XRANGEPLAIN] + ')' +
	                   '\\s*$';

	var HYPHENRANGELOOSE = R++;
	src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s+-\\s+' +
	                        '(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s*$';

	// Star ranges basically just allow anything at all.
	var STAR = R++;
	src[STAR] = '(<|>)?=?\\s*\\*';

	// Compile to actual regexp objects.
	// All are flag-free, unless they were created above with a flag.
	for (var i = 0; i < R; i++) {
	  debug(i, src[i]);
	  if (!re[i])
	    re[i] = new RegExp(src[i]);
	}

	exports.parse = parse;
	function parse(version, loose) {
	  if (version instanceof SemVer)
	    return version;

	  if (typeof version !== 'string')
	    return null;

	  if (version.length > MAX_LENGTH)
	    return null;

	  var r = loose ? re[LOOSE] : re[FULL];
	  if (!r.test(version))
	    return null;

	  try {
	    return new SemVer(version, loose);
	  } catch (er) {
	    return null;
	  }
	}

	exports.valid = valid;
	function valid(version, loose) {
	  var v = parse(version, loose);
	  return v ? v.version : null;
	}


	exports.clean = clean;
	function clean(version, loose) {
	  var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
	  return s ? s.version : null;
	}

	exports.SemVer = SemVer;

	function SemVer(version, loose) {
	  if (version instanceof SemVer) {
	    if (version.loose === loose)
	      return version;
	    else
	      version = version.version;
	  } else if (typeof version !== 'string') {
	    throw new TypeError('Invalid Version: ' + version);
	  }

	  if (version.length > MAX_LENGTH)
	    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')

	  if (!(this instanceof SemVer))
	    return new SemVer(version, loose);

	  debug('SemVer', version, loose);
	  this.loose = loose;
	  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

	  if (!m)
	    throw new TypeError('Invalid Version: ' + version);

	  this.raw = version;

	  // these are actually numbers
	  this.major = +m[1];
	  this.minor = +m[2];
	  this.patch = +m[3];

	  if (this.major > MAX_SAFE_INTEGER || this.major < 0)
	    throw new TypeError('Invalid major version')

	  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
	    throw new TypeError('Invalid minor version')

	  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
	    throw new TypeError('Invalid patch version')

	  // numberify any prerelease numeric ids
	  if (!m[4])
	    this.prerelease = [];
	  else
	    this.prerelease = m[4].split('.').map(function(id) {
	      if (/^[0-9]+$/.test(id)) {
	        var num = +id;
	        if (num >= 0 && num < MAX_SAFE_INTEGER)
	          return num;
	      }
	      return id;
	    });

	  this.build = m[5] ? m[5].split('.') : [];
	  this.format();
	}

	SemVer.prototype.format = function() {
	  this.version = this.major + '.' + this.minor + '.' + this.patch;
	  if (this.prerelease.length)
	    this.version += '-' + this.prerelease.join('.');
	  return this.version;
	};

	SemVer.prototype.toString = function() {
	  return this.version;
	};

	SemVer.prototype.compare = function(other) {
	  debug('SemVer.compare', this.version, this.loose, other);
	  if (!(other instanceof SemVer))
	    other = new SemVer(other, this.loose);

	  return this.compareMain(other) || this.comparePre(other);
	};

	SemVer.prototype.compareMain = function(other) {
	  if (!(other instanceof SemVer))
	    other = new SemVer(other, this.loose);

	  return compareIdentifiers(this.major, other.major) ||
	         compareIdentifiers(this.minor, other.minor) ||
	         compareIdentifiers(this.patch, other.patch);
	};

	SemVer.prototype.comparePre = function(other) {
	  if (!(other instanceof SemVer))
	    other = new SemVer(other, this.loose);

	  // NOT having a prerelease is > having one
	  if (this.prerelease.length && !other.prerelease.length)
	    return -1;
	  else if (!this.prerelease.length && other.prerelease.length)
	    return 1;
	  else if (!this.prerelease.length && !other.prerelease.length)
	    return 0;

	  var i = 0;
	  do {
	    var a = this.prerelease[i];
	    var b = other.prerelease[i];
	    debug('prerelease compare', i, a, b);
	    if (a === undefined && b === undefined)
	      return 0;
	    else if (b === undefined)
	      return 1;
	    else if (a === undefined)
	      return -1;
	    else if (a === b)
	      continue;
	    else
	      return compareIdentifiers(a, b);
	  } while (++i);
	};

	// preminor will bump the version up to the next minor release, and immediately
	// down to pre-release. premajor and prepatch work the same way.
	SemVer.prototype.inc = function(release, identifier) {
	  switch (release) {
	    case 'premajor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor = 0;
	      this.major++;
	      this.inc('pre', identifier);
	      break;
	    case 'preminor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor++;
	      this.inc('pre', identifier);
	      break;
	    case 'prepatch':
	      // If this is already a prerelease, it will bump to the next version
	      // drop any prereleases that might already exist, since they are not
	      // relevant at this point.
	      this.prerelease.length = 0;
	      this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break;
	    // If the input is a non-prerelease version, this acts the same as
	    // prepatch.
	    case 'prerelease':
	      if (this.prerelease.length === 0)
	        this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break;

	    case 'major':
	      // If this is a pre-major version, bump up to the same major version.
	      // Otherwise increment major.
	      // 1.0.0-5 bumps to 1.0.0
	      // 1.1.0 bumps to 2.0.0
	      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
	        this.major++;
	      this.minor = 0;
	      this.patch = 0;
	      this.prerelease = [];
	      break;
	    case 'minor':
	      // If this is a pre-minor version, bump up to the same minor version.
	      // Otherwise increment minor.
	      // 1.2.0-5 bumps to 1.2.0
	      // 1.2.1 bumps to 1.3.0
	      if (this.patch !== 0 || this.prerelease.length === 0)
	        this.minor++;
	      this.patch = 0;
	      this.prerelease = [];
	      break;
	    case 'patch':
	      // If this is not a pre-release version, it will increment the patch.
	      // If it is a pre-release it will bump up to the same patch version.
	      // 1.2.0-5 patches to 1.2.0
	      // 1.2.0 patches to 1.2.1
	      if (this.prerelease.length === 0)
	        this.patch++;
	      this.prerelease = [];
	      break;
	    // This probably shouldn't be used publicly.
	    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
	    case 'pre':
	      if (this.prerelease.length === 0)
	        this.prerelease = [0];
	      else {
	        var i = this.prerelease.length;
	        while (--i >= 0) {
	          if (typeof this.prerelease[i] === 'number') {
	            this.prerelease[i]++;
	            i = -2;
	          }
	        }
	        if (i === -1) // didn't increment anything
	          this.prerelease.push(0);
	      }
	      if (identifier) {
	        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	        if (this.prerelease[0] === identifier) {
	          if (isNaN(this.prerelease[1]))
	            this.prerelease = [identifier, 0];
	        } else
	          this.prerelease = [identifier, 0];
	      }
	      break;

	    default:
	      throw new Error('invalid increment argument: ' + release);
	  }
	  this.format();
	  this.raw = this.version;
	  return this;
	};

	exports.inc = inc;
	function inc(version, release, loose, identifier) {
	  if (typeof(loose) === 'string') {
	    identifier = loose;
	    loose = undefined;
	  }

	  try {
	    return new SemVer(version, loose).inc(release, identifier).version;
	  } catch (er) {
	    return null;
	  }
	}

	exports.diff = diff;
	function diff(version1, version2) {
	  if (eq(version1, version2)) {
	    return null;
	  } else {
	    var v1 = parse(version1);
	    var v2 = parse(version2);
	    if (v1.prerelease.length || v2.prerelease.length) {
	      for (var key in v1) {
	        if (key === 'major' || key === 'minor' || key === 'patch') {
	          if (v1[key] !== v2[key]) {
	            return 'pre'+key;
	          }
	        }
	      }
	      return 'prerelease';
	    }
	    for (var key in v1) {
	      if (key === 'major' || key === 'minor' || key === 'patch') {
	        if (v1[key] !== v2[key]) {
	          return key;
	        }
	      }
	    }
	  }
	}

	exports.compareIdentifiers = compareIdentifiers;

	var numeric = /^[0-9]+$/;
	function compareIdentifiers(a, b) {
	  var anum = numeric.test(a);
	  var bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return (anum && !bnum) ? -1 :
	         (bnum && !anum) ? 1 :
	         a < b ? -1 :
	         a > b ? 1 :
	         0;
	}

	exports.rcompareIdentifiers = rcompareIdentifiers;
	function rcompareIdentifiers(a, b) {
	  return compareIdentifiers(b, a);
	}

	exports.major = major;
	function major(a, loose) {
	  return new SemVer(a, loose).major;
	}

	exports.minor = minor;
	function minor(a, loose) {
	  return new SemVer(a, loose).minor;
	}

	exports.patch = patch;
	function patch(a, loose) {
	  return new SemVer(a, loose).patch;
	}

	exports.compare = compare;
	function compare(a, b, loose) {
	  return new SemVer(a, loose).compare(new SemVer(b, loose));
	}

	exports.compareLoose = compareLoose;
	function compareLoose(a, b) {
	  return compare(a, b, true);
	}

	exports.rcompare = rcompare;
	function rcompare(a, b, loose) {
	  return compare(b, a, loose);
	}

	exports.sort = sort;
	function sort(list, loose) {
	  return list.sort(function(a, b) {
	    return exports.compare(a, b, loose);
	  });
	}

	exports.rsort = rsort;
	function rsort(list, loose) {
	  return list.sort(function(a, b) {
	    return exports.rcompare(a, b, loose);
	  });
	}

	exports.gt = gt;
	function gt(a, b, loose) {
	  return compare(a, b, loose) > 0;
	}

	exports.lt = lt;
	function lt(a, b, loose) {
	  return compare(a, b, loose) < 0;
	}

	exports.eq = eq;
	function eq(a, b, loose) {
	  return compare(a, b, loose) === 0;
	}

	exports.neq = neq;
	function neq(a, b, loose) {
	  return compare(a, b, loose) !== 0;
	}

	exports.gte = gte;
	function gte(a, b, loose) {
	  return compare(a, b, loose) >= 0;
	}

	exports.lte = lte;
	function lte(a, b, loose) {
	  return compare(a, b, loose) <= 0;
	}

	exports.cmp = cmp;
	function cmp(a, op, b, loose) {
	  var ret;
	  switch (op) {
	    case '===':
	      if (typeof a === 'object') a = a.version;
	      if (typeof b === 'object') b = b.version;
	      ret = a === b;
	      break;
	    case '!==':
	      if (typeof a === 'object') a = a.version;
	      if (typeof b === 'object') b = b.version;
	      ret = a !== b;
	      break;
	    case '': case '=': case '==': ret = eq(a, b, loose); break;
	    case '!=': ret = neq(a, b, loose); break;
	    case '>': ret = gt(a, b, loose); break;
	    case '>=': ret = gte(a, b, loose); break;
	    case '<': ret = lt(a, b, loose); break;
	    case '<=': ret = lte(a, b, loose); break;
	    default: throw new TypeError('Invalid operator: ' + op);
	  }
	  return ret;
	}

	exports.Comparator = Comparator;
	function Comparator(comp, loose) {
	  if (comp instanceof Comparator) {
	    if (comp.loose === loose)
	      return comp;
	    else
	      comp = comp.value;
	  }

	  if (!(this instanceof Comparator))
	    return new Comparator(comp, loose);

	  debug('comparator', comp, loose);
	  this.loose = loose;
	  this.parse(comp);

	  if (this.semver === ANY)
	    this.value = '';
	  else
	    this.value = this.operator + this.semver.version;

	  debug('comp', this);
	}

	var ANY = {};
	Comparator.prototype.parse = function(comp) {
	  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
	  var m = comp.match(r);

	  if (!m)
	    throw new TypeError('Invalid comparator: ' + comp);

	  this.operator = m[1];
	  if (this.operator === '=')
	    this.operator = '';

	  // if it literally is just '>' or '' then allow anything.
	  if (!m[2])
	    this.semver = ANY;
	  else
	    this.semver = new SemVer(m[2], this.loose);
	};

	Comparator.prototype.toString = function() {
	  return this.value;
	};

	Comparator.prototype.test = function(version) {
	  debug('Comparator.test', version, this.loose);

	  if (this.semver === ANY)
	    return true;

	  if (typeof version === 'string')
	    version = new SemVer(version, this.loose);

	  return cmp(version, this.operator, this.semver, this.loose);
	};

	Comparator.prototype.intersects = function(comp, loose) {
	  if (!(comp instanceof Comparator)) {
	    throw new TypeError('a Comparator is required');
	  }

	  var rangeTmp;

	  if (this.operator === '') {
	    rangeTmp = new Range(comp.value, loose);
	    return satisfies(this.value, rangeTmp, loose);
	  } else if (comp.operator === '') {
	    rangeTmp = new Range(this.value, loose);
	    return satisfies(comp.semver, rangeTmp, loose);
	  }

	  var sameDirectionIncreasing =
	    (this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '>=' || comp.operator === '>');
	  var sameDirectionDecreasing =
	    (this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '<=' || comp.operator === '<');
	  var sameSemVer = this.semver.version === comp.semver.version;
	  var differentDirectionsInclusive =
	    (this.operator === '>=' || this.operator === '<=') &&
	    (comp.operator === '>=' || comp.operator === '<=');
	  var oppositeDirectionsLessThan =
	    cmp(this.semver, '<', comp.semver, loose) &&
	    ((this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '<=' || comp.operator === '<'));
	  var oppositeDirectionsGreaterThan =
	    cmp(this.semver, '>', comp.semver, loose) &&
	    ((this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '>=' || comp.operator === '>'));

	  return sameDirectionIncreasing || sameDirectionDecreasing ||
	    (sameSemVer && differentDirectionsInclusive) ||
	    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
	};


	exports.Range = Range;
	function Range(range, loose) {
	  if (range instanceof Range) {
	    if (range.loose === loose) {
	      return range;
	    } else {
	      return new Range(range.raw, loose);
	    }
	  }

	  if (range instanceof Comparator) {
	    return new Range(range.value, loose);
	  }

	  if (!(this instanceof Range))
	    return new Range(range, loose);

	  this.loose = loose;

	  // First, split based on boolean or ||
	  this.raw = range;
	  this.set = range.split(/\s*\|\|\s*/).map(function(range) {
	    return this.parseRange(range.trim());
	  }, this).filter(function(c) {
	    // throw out any that are not relevant for whatever reason
	    return c.length;
	  });

	  if (!this.set.length) {
	    throw new TypeError('Invalid SemVer Range: ' + range);
	  }

	  this.format();
	}

	Range.prototype.format = function() {
	  this.range = this.set.map(function(comps) {
	    return comps.join(' ').trim();
	  }).join('||').trim();
	  return this.range;
	};

	Range.prototype.toString = function() {
	  return this.range;
	};

	Range.prototype.parseRange = function(range) {
	  var loose = this.loose;
	  range = range.trim();
	  debug('range', range, loose);
	  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
	  range = range.replace(hr, hyphenReplace);
	  debug('hyphen replace', range);
	  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
	  debug('comparator trim', range, re[COMPARATORTRIM]);

	  // `~ 1.2.3` => `~1.2.3`
	  range = range.replace(re[TILDETRIM], tildeTrimReplace);

	  // `^ 1.2.3` => `^1.2.3`
	  range = range.replace(re[CARETTRIM], caretTrimReplace);

	  // normalize spaces
	  range = range.split(/\s+/).join(' ');

	  // At this point, the range is completely trimmed and
	  // ready to be split into comparators.

	  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
	  var set = range.split(' ').map(function(comp) {
	    return parseComparator(comp, loose);
	  }).join(' ').split(/\s+/);
	  if (this.loose) {
	    // in loose mode, throw out any that are not valid comparators
	    set = set.filter(function(comp) {
	      return !!comp.match(compRe);
	    });
	  }
	  set = set.map(function(comp) {
	    return new Comparator(comp, loose);
	  });

	  return set;
	};

	Range.prototype.intersects = function(range, loose) {
	  if (!(range instanceof Range)) {
	    throw new TypeError('a Range is required');
	  }

	  return this.set.some(function(thisComparators) {
	    return thisComparators.every(function(thisComparator) {
	      return range.set.some(function(rangeComparators) {
	        return rangeComparators.every(function(rangeComparator) {
	          return thisComparator.intersects(rangeComparator, loose);
	        });
	      });
	    });
	  });
	};

	// Mostly just for testing and legacy API reasons
	exports.toComparators = toComparators;
	function toComparators(range, loose) {
	  return new Range(range, loose).set.map(function(comp) {
	    return comp.map(function(c) {
	      return c.value;
	    }).join(' ').trim().split(' ');
	  });
	}

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	function parseComparator(comp, loose) {
	  debug('comp', comp);
	  comp = replaceCarets(comp, loose);
	  debug('caret', comp);
	  comp = replaceTildes(comp, loose);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, loose);
	  debug('xrange', comp);
	  comp = replaceStars(comp, loose);
	  debug('stars', comp);
	  return comp;
	}

	function isX(id) {
	  return !id || id.toLowerCase() === 'x' || id === '*';
	}

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
	function replaceTildes(comp, loose) {
	  return comp.trim().split(/\s+/).map(function(comp) {
	    return replaceTilde(comp, loose);
	  }).join(' ');
	}

	function replaceTilde(comp, loose) {
	  var r = loose ? re[TILDELOOSE] : re[TILDE];
	  return comp.replace(r, function(_, M, m, p, pr) {
	    debug('tilde', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M))
	      ret = '';
	    else if (isX(m))
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    else if (isX(p))
	      // ~1.2 == >=1.2.0 <1.3.0
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    else if (pr) {
	      debug('replaceTilde pr', pr);
	      if (pr.charAt(0) !== '-')
	        pr = '-' + pr;
	      ret = '>=' + M + '.' + m + '.' + p + pr +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    } else
	      // ~1.2.3 == >=1.2.3 <1.3.0
	      ret = '>=' + M + '.' + m + '.' + p +
	            ' <' + M + '.' + (+m + 1) + '.0';

	    debug('tilde return', ret);
	    return ret;
	  });
	}

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
	// ^1.2.3 --> >=1.2.3 <2.0.0
	// ^1.2.0 --> >=1.2.0 <2.0.0
	function replaceCarets(comp, loose) {
	  return comp.trim().split(/\s+/).map(function(comp) {
	    return replaceCaret(comp, loose);
	  }).join(' ');
	}

	function replaceCaret(comp, loose) {
	  debug('caret', comp, loose);
	  var r = loose ? re[CARETLOOSE] : re[CARET];
	  return comp.replace(r, function(_, M, m, p, pr) {
	    debug('caret', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M))
	      ret = '';
	    else if (isX(m))
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    else if (isX(p)) {
	      if (M === '0')
	        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	      else
	        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (pr.charAt(0) !== '-')
	        pr = '-' + pr;
	      if (M === '0') {
	        if (m === '0')
	          ret = '>=' + M + '.' + m + '.' + p + pr +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        else
	          ret = '>=' + M + '.' + m + '.' + p + pr +
	                ' <' + M + '.' + (+m + 1) + '.0';
	      } else
	        ret = '>=' + M + '.' + m + '.' + p + pr +
	              ' <' + (+M + 1) + '.0.0';
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0')
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        else
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + (+m + 1) + '.0';
	      } else
	        ret = '>=' + M + '.' + m + '.' + p +
	              ' <' + (+M + 1) + '.0.0';
	    }

	    debug('caret return', ret);
	    return ret;
	  });
	}

	function replaceXRanges(comp, loose) {
	  debug('replaceXRanges', comp, loose);
	  return comp.split(/\s+/).map(function(comp) {
	    return replaceXRange(comp, loose);
	  }).join(' ');
	}

	function replaceXRange(comp, loose) {
	  comp = comp.trim();
	  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
	  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    var xM = isX(M);
	    var xm = xM || isX(m);
	    var xp = xm || isX(p);
	    var anyX = xp;

	    if (gtlt === '=' && anyX)
	      gtlt = '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // replace X with 0
	      if (xm)
	        m = 0;
	      if (xp)
	        p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        // >1.2.3 => >= 1.2.4
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else if (xp) {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm)
	          M = +M + 1;
	        else
	          m = +m + 1;
	      }

	      ret = gtlt + M + '.' + m + '.' + p;
	    } else if (xm) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (xp) {
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('xRange return', ret);

	    return ret;
	  });
	}

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	function replaceStars(comp, loose) {
	  debug('replaceStars', comp, loose);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp.trim().replace(re[STAR], '');
	}

	// This function is passed to string.replace(re[HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0
	function hyphenReplace($0,
	                       from, fM, fm, fp, fpr, fb,
	                       to, tM, tm, tp, tpr, tb) {

	  if (isX(fM))
	    from = '';
	  else if (isX(fm))
	    from = '>=' + fM + '.0.0';
	  else if (isX(fp))
	    from = '>=' + fM + '.' + fm + '.0';
	  else
	    from = '>=' + from;

	  if (isX(tM))
	    to = '';
	  else if (isX(tm))
	    to = '<' + (+tM + 1) + '.0.0';
	  else if (isX(tp))
	    to = '<' + tM + '.' + (+tm + 1) + '.0';
	  else if (tpr)
	    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
	  else
	    to = '<=' + to;

	  return (from + ' ' + to).trim();
	}


	// if ANY of the sets match ALL of its comparators, then pass
	Range.prototype.test = function(version) {
	  if (!version)
	    return false;

	  if (typeof version === 'string')
	    version = new SemVer(version, this.loose);

	  for (var i = 0; i < this.set.length; i++) {
	    if (testSet(this.set[i], version))
	      return true;
	  }
	  return false;
	};

	function testSet(set, version) {
	  for (var i = 0; i < set.length; i++) {
	    if (!set[i].test(version))
	      return false;
	  }

	  if (version.prerelease.length) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (var i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === ANY)
	        continue;

	      if (set[i].semver.prerelease.length > 0) {
	        var allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch)
	          return true;
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false;
	  }

	  return true;
	}

	exports.satisfies = satisfies;
	function satisfies(version, range, loose) {
	  try {
	    range = new Range(range, loose);
	  } catch (er) {
	    return false;
	  }
	  return range.test(version);
	}

	exports.maxSatisfying = maxSatisfying;
	function maxSatisfying(versions, range, loose) {
	  var max = null;
	  var maxSV = null;
	  try {
	    var rangeObj = new Range(range, loose);
	  } catch (er) {
	    return null;
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) { // satisfies(v, range, loose)
	      if (!max || maxSV.compare(v) === -1) { // compare(max, v, true)
	        max = v;
	        maxSV = new SemVer(max, loose);
	      }
	    }
	  });
	  return max;
	}

	exports.minSatisfying = minSatisfying;
	function minSatisfying(versions, range, loose) {
	  var min = null;
	  var minSV = null;
	  try {
	    var rangeObj = new Range(range, loose);
	  } catch (er) {
	    return null;
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) { // satisfies(v, range, loose)
	      if (!min || minSV.compare(v) === 1) { // compare(min, v, true)
	        min = v;
	        minSV = new SemVer(min, loose);
	      }
	    }
	  });
	  return min;
	}

	exports.validRange = validRange;
	function validRange(range, loose) {
	  try {
	    // Return '*' instead of '' so that truthiness works.
	    // This will throw if it's invalid anyway
	    return new Range(range, loose).range || '*';
	  } catch (er) {
	    return null;
	  }
	}

	// Determine if version is less than all the versions possible in the range
	exports.ltr = ltr;
	function ltr(version, range, loose) {
	  return outside(version, range, '<', loose);
	}

	// Determine if version is greater than all the versions possible in the range.
	exports.gtr = gtr;
	function gtr(version, range, loose) {
	  return outside(version, range, '>', loose);
	}

	exports.outside = outside;
	function outside(version, range, hilo, loose) {
	  version = new SemVer(version, loose);
	  range = new Range(range, loose);

	  var gtfn, ltefn, ltfn, comp, ecomp;
	  switch (hilo) {
	    case '>':
	      gtfn = gt;
	      ltefn = lte;
	      ltfn = lt;
	      comp = '>';
	      ecomp = '>=';
	      break;
	    case '<':
	      gtfn = lt;
	      ltefn = gte;
	      ltfn = gt;
	      comp = '<';
	      ecomp = '<=';
	      break;
	    default:
	      throw new TypeError('Must provide a hilo val of "<" or ">"');
	  }

	  // If it satisifes the range it is not outside
	  if (satisfies(version, range, loose)) {
	    return false;
	  }

	  // From now on, variable terms are as if we're in "gtr" mode.
	  // but note that everything is flipped for the "ltr" function.

	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    var high = null;
	    var low = null;

	    comparators.forEach(function(comparator) {
	      if (comparator.semver === ANY) {
	        comparator = new Comparator('>=0.0.0');
	      }
	      high = high || comparator;
	      low = low || comparator;
	      if (gtfn(comparator.semver, high.semver, loose)) {
	        high = comparator;
	      } else if (ltfn(comparator.semver, low.semver, loose)) {
	        low = comparator;
	      }
	    });

	    // If the edge version comparator has a operator then our version
	    // isn't outside it
	    if (high.operator === comp || high.operator === ecomp) {
	      return false;
	    }

	    // If the lowest version comparator has an operator and our version
	    // is less than it then it isn't higher than the range
	    if ((!low.operator || low.operator === comp) &&
	        ltefn(version, low.semver)) {
	      return false;
	    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
	      return false;
	    }
	  }
	  return true;
	}

	exports.prerelease = prerelease;
	function prerelease(version, loose) {
	  var parsed = parse(version, loose);
	  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null;
	}

	exports.intersects = intersects;
	function intersects(r1, r2, loose) {
	  r1 = new Range(r1, loose);
	  r2 = new Range(r2, loose);
	  return r1.intersects(r2)
	}
	});

	var semver_1 = semver.SEMVER_SPEC_VERSION;
	var semver_2 = semver.re;
	var semver_3 = semver.src;
	var semver_4 = semver.parse;
	var semver_5 = semver.valid;
	var semver_6 = semver.clean;
	var semver_7 = semver.SemVer;
	var semver_8 = semver.inc;
	var semver_9 = semver.diff;
	var semver_10 = semver.compareIdentifiers;
	var semver_11 = semver.rcompareIdentifiers;
	var semver_12 = semver.major;
	var semver_13 = semver.minor;
	var semver_14 = semver.patch;
	var semver_15 = semver.compare;
	var semver_16 = semver.compareLoose;
	var semver_17 = semver.rcompare;
	var semver_18 = semver.sort;
	var semver_19 = semver.rsort;
	var semver_20 = semver.gt;
	var semver_21 = semver.lt;
	var semver_22 = semver.eq;
	var semver_23 = semver.neq;
	var semver_24 = semver.gte;
	var semver_25 = semver.lte;
	var semver_26 = semver.cmp;
	var semver_27 = semver.Comparator;
	var semver_28 = semver.Range;
	var semver_29 = semver.toComparators;
	var semver_30 = semver.satisfies;
	var semver_31 = semver.maxSatisfying;
	var semver_32 = semver.minSatisfying;
	var semver_33 = semver.validRange;
	var semver_34 = semver.ltr;
	var semver_35 = semver.gtr;
	var semver_36 = semver.outside;
	var semver_37 = semver.prerelease;
	var semver_38 = semver.intersects;




	var semver$2 = Object.freeze({
		SEMVER_SPEC_VERSION: semver_1,
		re: semver_2,
		src: semver_3,
		parse: semver_4,
		valid: semver_5,
		clean: semver_6,
		SemVer: semver_7,
		inc: semver_8,
		diff: semver_9,
		compareIdentifiers: semver_10,
		rcompareIdentifiers: semver_11,
		major: semver_12,
		minor: semver_13,
		patch: semver_14,
		compare: semver_15,
		compareLoose: semver_16,
		rcompare: semver_17,
		sort: semver_18,
		rsort: semver_19,
		gt: semver_20,
		lt: semver_21,
		eq: semver_22,
		neq: semver_23,
		gte: semver_24,
		lte: semver_25,
		cmp: semver_26,
		Comparator: semver_27,
		Range: semver_28,
		toComparators: semver_29,
		satisfies: semver_30,
		maxSatisfying: semver_31,
		minSatisfying: semver_32,
		validRange: semver_33,
		ltr: semver_34,
		gtr: semver_35,
		outside: semver_36,
		prerelease: semver_37,
		intersects: semver_38,
		default: semver
	});

	const getEnv = (rodinPackage, env) => {
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

var RodinPackage = Object.freeze({
		getEnv: getEnv
	});

	class CustomNavigator {
	    constructor() {

	    }

	    get userAgent() {
	        return window.navigator.userAgent;
	    }

	    set userAgent(value) {
	        return value;
	    }
	}

	/*! (C) WebReflection Mit Style License */
	var polyfillWindowRegisterElement = (window=window,document=document,override=false)=>{(function(window,document,Object,REGISTER_ELEMENT){"use strict";if(!override&&REGISTER_ELEMENT in document)return;var EXPANDO_UID="__"+REGISTER_ELEMENT+(Math.random()*1e5>>0),ATTACHED="attached",DETACHED="detached",EXTENDS="extends",ADDITION="ADDITION",MODIFICATION="MODIFICATION",REMOVAL="REMOVAL",DOM_ATTR_MODIFIED="DOMAttrModified",DOM_CONTENT_LOADED="DOMContentLoaded",DOM_SUBTREE_MODIFIED="DOMSubtreeModified",PREFIX_TAG="<",PREFIX_IS="=",validName=/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/,invalidNames=["ANNOTATION-XML","COLOR-PROFILE","FONT-FACE","FONT-FACE-SRC","FONT-FACE-URI","FONT-FACE-FORMAT","FONT-FACE-NAME","MISSING-GLYPH"],types=[],protos=[],query="",documentElement=document.documentElement,indexOf=types.indexOf||function(v){for(var i=this.length;i--&&this[i]!==v;){}return i},OP=Object.prototype,hOP=OP.hasOwnProperty,iPO=OP.isPrototypeOf,defineProperty=Object.defineProperty,gOPD=Object.getOwnPropertyDescriptor,gOPN=Object.getOwnPropertyNames,gPO=Object.getPrototypeOf,sPO=Object.setPrototypeOf,hasProto=!!Object.__proto__,create=Object.create||function Bridge(proto){return proto?(Bridge.prototype=proto,new Bridge):this},setPrototype=sPO||(hasProto?function(o,p){o.__proto__=p;return o}:gOPN&&gOPD?function(){function setProperties(o,p){for(var key,names=gOPN(p),i=0,length=names.length;i<length;i++){key=names[i];if(!hOP.call(o,key)){defineProperty(o,key,gOPD(p,key));}}}return function(o,p){do{setProperties(o,p);}while((p=gPO(p))&&!iPO.call(p,o));return o}}():function(o,p){for(var key in p){o[key]=p[key];}return o}),MutationObserver=window.MutationObserver||window.WebKitMutationObserver,HTMLElementPrototype=(window.HTMLElement||window.Element||window.Node).prototype,IE8=!iPO.call(HTMLElementPrototype,documentElement),isValidNode=IE8?function(node){return node.nodeType===1}:function(node){return iPO.call(HTMLElementPrototype,node)},targets=IE8&&[],cloneNode=HTMLElementPrototype.cloneNode,setAttribute=HTMLElementPrototype.setAttribute,removeAttribute=HTMLElementPrototype.removeAttribute,createElement=document.createElement,attributesObserver=MutationObserver&&{attributes:true,characterData:true,attributeOldValue:true},DOMAttrModified=MutationObserver||function(e){doesNotSupportDOMAttrModified=false;documentElement.removeEventListener(DOM_ATTR_MODIFIED,DOMAttrModified);},asapQueue,rAF=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||function(fn){setTimeout(fn,10);},setListener=false,doesNotSupportDOMAttrModified=true,dropDomContentLoaded=true,notFromInnerHTMLHelper=true,onSubtreeModified,callDOMAttrModified,getAttributesMirror,observer,patchIfNotAlready,patch;if(sPO||hasProto){patchIfNotAlready=function(node,proto){if(!iPO.call(proto,node)){setupNode(node,proto);}};patch=setupNode;}else{patchIfNotAlready=function(node,proto){if(!node[EXPANDO_UID]){node[EXPANDO_UID]=Object(true);setupNode(node,proto);}};patch=patchIfNotAlready;}if(IE8){doesNotSupportDOMAttrModified=false;(function(){var descriptor=gOPD(HTMLElementPrototype,"addEventListener"),addEventListener=descriptor.value,patchedRemoveAttribute=function(name){var e=new CustomEvent(DOM_ATTR_MODIFIED,{bubbles:true});e.attrName=name;e.prevValue=this.getAttribute(name);e.newValue=null;e[REMOVAL]=e.attrChange=2;removeAttribute.call(this,name);this.dispatchEvent(e);},patchedSetAttribute=function(name,value){var had=this.hasAttribute(name),old=had&&this.getAttribute(name),e=new CustomEvent(DOM_ATTR_MODIFIED,{bubbles:true});setAttribute.call(this,name,value);e.attrName=name;e.prevValue=had?old:null;e.newValue=value;if(had){e[MODIFICATION]=e.attrChange=1;}else{e[ADDITION]=e.attrChange=0;}this.dispatchEvent(e);},onPropertyChange=function(e){var node=e.currentTarget,superSecret=node[EXPANDO_UID],propertyName=e.propertyName,event;if(superSecret.hasOwnProperty(propertyName)){superSecret=superSecret[propertyName];event=new CustomEvent(DOM_ATTR_MODIFIED,{bubbles:true});event.attrName=superSecret.name;event.prevValue=superSecret.value||null;event.newValue=superSecret.value=node[propertyName]||null;if(event.prevValue==null){event[ADDITION]=event.attrChange=0;}else{event[MODIFICATION]=event.attrChange=1;}node.dispatchEvent(event);}};descriptor.value=function(type,handler,capture){if(type===DOM_ATTR_MODIFIED&&this.attributeChangedCallback&&this.setAttribute!==patchedSetAttribute){this[EXPANDO_UID]={className:{name:"class",value:this.className}};this.setAttribute=patchedSetAttribute;this.removeAttribute=patchedRemoveAttribute;addEventListener.call(this,"propertychange",onPropertyChange);}addEventListener.call(this,type,handler,capture);};defineProperty(HTMLElementPrototype,"addEventListener",descriptor);})();}else if(!MutationObserver){documentElement.addEventListener(DOM_ATTR_MODIFIED,DOMAttrModified);documentElement.setAttribute(EXPANDO_UID,1);documentElement.removeAttribute(EXPANDO_UID);if(doesNotSupportDOMAttrModified){onSubtreeModified=function(e){var node=this,oldAttributes,newAttributes,key;if(node===e.target){oldAttributes=node[EXPANDO_UID];node[EXPANDO_UID]=newAttributes=getAttributesMirror(node);for(key in newAttributes){if(!(key in oldAttributes)){return callDOMAttrModified(0,node,key,oldAttributes[key],newAttributes[key],ADDITION)}else if(newAttributes[key]!==oldAttributes[key]){return callDOMAttrModified(1,node,key,oldAttributes[key],newAttributes[key],MODIFICATION)}}for(key in oldAttributes){if(!(key in newAttributes)){return callDOMAttrModified(2,node,key,oldAttributes[key],newAttributes[key],REMOVAL)}}}};callDOMAttrModified=function(attrChange,currentTarget,attrName,prevValue,newValue,action){var e={attrChange:attrChange,currentTarget:currentTarget,attrName:attrName,prevValue:prevValue,newValue:newValue};e[action]=attrChange;onDOMAttrModified(e);};getAttributesMirror=function(node){for(var attr,name,result={},attributes=node.attributes,i=0,length=attributes.length;i<length;i++){attr=attributes[i];name=attr.name;if(name!=="setAttribute"){result[name]=attr.value;}}return result};}}function loopAndVerify(list,action){for(var i=0,length=list.length;i<length;i++){verifyAndSetupAndAction(list[i],action);}}function loopAndSetup(list){for(var i=0,length=list.length,node;i<length;i++){node=list[i];patch(node,protos[getTypeIndex(node)]);}}function executeAction(action){return function(node){if(isValidNode(node)){verifyAndSetupAndAction(node,action);loopAndVerify(node.querySelectorAll(query),action);}}}function getTypeIndex(target){var is=target.getAttribute("is"),nodeName=target.nodeName.toUpperCase(),i=indexOf.call(types,is?PREFIX_IS+is.toUpperCase():PREFIX_TAG+nodeName);return is&&-1<i&&!isInQSA(nodeName,is)?-1:i}function isInQSA(name,type){return-1<query.indexOf(name+'[is="'+type+'"]')}function onDOMAttrModified(e){var node=e.currentTarget,attrChange=e.attrChange,attrName=e.attrName,target=e.target;if(notFromInnerHTMLHelper&&(!target||target===node)&&node.attributeChangedCallback&&attrName!=="style"&&e.prevValue!==e.newValue){node.attributeChangedCallback(attrName,attrChange===e[ADDITION]?null:e.prevValue,attrChange===e[REMOVAL]?null:e.newValue);}}function onDOMNode(action){var executor=executeAction(action);return function(e){asapQueue.push(executor,e.target);}}function onReadyStateChange(e){if(dropDomContentLoaded){dropDomContentLoaded=false;e.currentTarget.removeEventListener(DOM_CONTENT_LOADED,onReadyStateChange);}loopAndVerify((e.target||document).querySelectorAll(query),e.detail===DETACHED?DETACHED:ATTACHED);if(IE8)purge();}function patchedSetAttribute(name,value){var self=this;setAttribute.call(self,name,value);onSubtreeModified.call(self,{target:self});}function setupNode(node,proto){setPrototype(node,proto);if(observer){observer.observe(node,attributesObserver);}else{if(doesNotSupportDOMAttrModified){node.setAttribute=patchedSetAttribute;node[EXPANDO_UID]=getAttributesMirror(node);node.addEventListener(DOM_SUBTREE_MODIFIED,onSubtreeModified);}node.addEventListener(DOM_ATTR_MODIFIED,onDOMAttrModified);}if(node.createdCallback&&notFromInnerHTMLHelper){node.created=true;node.createdCallback();node.created=false;}}function purge(){for(var node,i=0,length=targets.length;i<length;i++){node=targets[i];if(!documentElement.contains(node)){length--;targets.splice(i--,1);verifyAndSetupAndAction(node,DETACHED);}}}function throwTypeError(type){throw new Error("A "+type+" type is already registered")}function verifyAndSetupAndAction(node,action){var fn,i=getTypeIndex(node);if(-1<i){patchIfNotAlready(node,protos[i]);i=0;if(action===ATTACHED&&!node[ATTACHED]){node[DETACHED]=false;node[ATTACHED]=true;i=1;if(IE8&&indexOf.call(targets,node)<0){targets.push(node);}}else if(action===DETACHED&&!node[DETACHED]){node[ATTACHED]=false;node[DETACHED]=true;i=1;}if(i&&(fn=node[action+"Callback"]))fn.call(node);}}document[REGISTER_ELEMENT]=function registerElement(type,options){upperType=type.toUpperCase();if(!setListener){setListener=true;if(MutationObserver){observer=function(attached,detached){function checkEmAll(list,callback){for(var i=0,length=list.length;i<length;callback(list[i++])){}}return new MutationObserver(function(records){for(var current,node,newValue,i=0,length=records.length;i<length;i++){current=records[i];if(current.type==="childList"){checkEmAll(current.addedNodes,attached);checkEmAll(current.removedNodes,detached);}else{node=current.target;if(notFromInnerHTMLHelper&&node.attributeChangedCallback&&current.attributeName!=="style"){newValue=node.getAttribute(current.attributeName);if(newValue!==current.oldValue){node.attributeChangedCallback(current.attributeName,current.oldValue,newValue);}}}}})}(executeAction(ATTACHED),executeAction(DETACHED));observer.observe(document,{childList:true,subtree:true});}else{asapQueue=[];rAF(function ASAP(){while(asapQueue.length){asapQueue.shift().call(null,asapQueue.shift());}rAF(ASAP);});document.addEventListener("DOMNodeInserted",onDOMNode(ATTACHED));document.addEventListener("DOMNodeRemoved",onDOMNode(DETACHED));}document.addEventListener(DOM_CONTENT_LOADED,onReadyStateChange);document.addEventListener("readystatechange",onReadyStateChange);document.createElement=function(localName,typeExtension){var node=createElement.apply(document,arguments),name=""+localName,i=indexOf.call(types,(typeExtension?PREFIX_IS:PREFIX_TAG)+(typeExtension||name).toUpperCase()),setup=-1<i;if(typeExtension){node.setAttribute("is",typeExtension=typeExtension.toLowerCase());if(setup){setup=isInQSA(name.toUpperCase(),typeExtension);}}notFromInnerHTMLHelper=!document.createElement.innerHTMLHelper;if(setup)patch(node,protos[i]);return node};HTMLElementPrototype.cloneNode=function(deep){var node=cloneNode.call(this,!!deep),i=getTypeIndex(node);if(-1<i)patch(node,protos[i]);if(deep)loopAndSetup(node.querySelectorAll(query));return node};}if(-2<indexOf.call(types,PREFIX_IS+upperType)+indexOf.call(types,PREFIX_TAG+upperType)){throwTypeError(type);}if(!validName.test(upperType)||-1<indexOf.call(invalidNames,upperType)){throw new Error("The type "+type+" is invalid")}var constructor=function(){return extending?document.createElement(nodeName,upperType):document.createElement(nodeName)},opt=options||OP,extending=hOP.call(opt,EXTENDS),nodeName=extending?options[EXTENDS].toUpperCase():upperType,upperType,i;if(extending&&-1<indexOf.call(types,PREFIX_TAG+nodeName)){throwTypeError(nodeName);}i=types.push((extending?PREFIX_IS:PREFIX_TAG)+upperType)-1;query=query.concat(query.length?",":"",extending?nodeName+'[is="'+type.toLowerCase()+'"]':nodeName);constructor.prototype=protos[i]=hOP.call(opt,"prototype")?opt.prototype:create(HTMLElementPrototype);loopAndVerify(document.querySelectorAll(query),ATTACHED);return constructor};})(window,document,Object,"registerElement");};

	class CustomWindow {
	    constructor(src) {
	        this.window = this;
	        this.self = this;
	        this.top = this;

	        this.events = {};

	        this.document = CustomWindow.parser.parseFromString(src, 'text/html');
	        polyfillWindowRegisterElement(window, this.document, true);

	        this.navigator = new CustomNavigator();

	        this.nativeEventHandlers = {};
	        this._initNativeEventHandlers();
	        this._startListenNativeEvents();
	    }

	    get innerWidth() {
	        return window.innerWidth;
	    }

	    get innerHeight() {
	        return window.innerHeight;
	    }

	    get XMLHttpRequest() {
	        return window.XMLHttpRequest;
	    }

	    get screen() {
	        return window.screen;
	    }

	    get HTMLElement() {
	        return window.HTMLElement;
	    }

	    get Element() {
	        return window.Element;
	    }

	    get Node() {
	        return window.Node;
	    }

	    // todo: replace this
	    get location() {
	        return window.location;
	    }

	    _initNativeEventHandlers() {
	        for (let i = 0; i < CustomWindow.nativeEventNames.length; i++) {
	            const eventName = CustomWindow.nativeEventNames[i];

	            this.nativeEventHandlers[eventName] = (evt) => {
	                this.dispatchEvent(evt);
	                evt = new evt.constructor(evt.type, evt);
	                const canvas = this.document.getElementsByTagName('canvas')[0];
	                canvas && canvas.dispatchEvent(evt);
	            };
	        }
	    }

	    _subscribeToNativeEvent(eventName) {
	        window.addEventListener(eventName, this.nativeEventHandlers[eventName]);
	    }

	    _unsubscribeFromNativeEvent(eventName) {
	        window.removeEventListener(eventName, this.nativeEventHandlers[eventName]);
	    }

	    _startListenNativeEvents() {
	        for (let eventName of CustomWindow.nativeEventNames) {
	            this._subscribeToNativeEvent(eventName);
	        }
	    }

	    _stopListenNativeEvents() {
	        for (let eventName of CustomWindow.nativeEventNames) {
	            this._unsubscribeFromNativeEvent(eventName);
	        }
	    }

	    alert() {
	        window.alert(...arguments);
	    }

	    requestAnimationFrame() {
	        window.requestAnimationFrame(...arguments);
	    }

	    addEventListener(eventName, callback) {
	        if (!this.events[eventName]) {
	            this.events[eventName] = [];
	        }

	        this.events[eventName].push(callback);
	    }

	    removeEventListener(eventName, callback) {
	        if (this.events[eventName] && this.events[eventName].indexOf(callback) !== -1) {
	            this.events[eventName].splice(this.events[eventName].indexOf(callback), 1);
	            return true;
	        }
	    }

	    dispatchEvent(event) {
	        const eventName = event.type;

	        if (this.events[eventName] && this.events[eventName].length > 0) {
	            for (let f = 0; f < this.events[eventName].length; f++) {
	                this.events[eventName][f](event);
	            }
	        }
	    }

	    dispose() {
	        this.requestAnimationFrame = () => {
	        };

	        this._stopListenNativeEvents();
	    }
	}

	CustomWindow.parser = new DOMParser(); // todo: esi lav canr class a. lazy init sarqel
	CustomWindow.nativeEventNames = [
	    "vrdisplaypresentchange",
	    "resize",
	    "orientationchange",
	    "keydown",
	    "mousemove",
	    "mousedown",
	    "mouseup",
	    "message",
	    "devicemotion",
	    "touchstart",
	    "touchmove",
	    "touchend",
	    "gamepadconnected",
	    "gamepaddisconnected",
	    "keyup",
	    "blur",
	    "focus",
	    "load",
	    "vrdisplayactivate",
	    "vrdisplaydeactivate",
	    "vrdisplaydisconnect",
	    "vrdisplaypointerrestricted",
	    "vrdisplaypointerunrestricted",
	    "vrdisplayconnect"
	];

	const watchFor = (param, obj, cb) => {

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

	window.RodinPackage = RodinPackage;
	window.semver = semver$2;

	let cdn_url = 'https://cdn.rodin.io/';
	const default_env = 'prod';

	const getURL = (filename, urlMap = null) => {

	    if (urlMap !== null) {
	        for (let i in urlMap) {
	            if (filename.startsWith(i)) {
	                return join(urlMap[i], filename.substring(i.length));
	            }
	        }
	    }

	    if (getFile(window.location.href).indexOf(".") !== -1) {
	        return join(getDirectory(window.location.href), filename);
	    }

	    return join(window.location.href, filename);
	};

	const getManifest = () => {
	    return get(getURL('rodin_package.json')).then((data) => {

	        const dependencyMap = {};

	        const _resolveManifest = (pkg) => {
	            // const pkg = JSON.parse(manifest);
	            const env = pkg.env || default_env;
	            console.log(`Running ${pkg.name}...`);

	            const promises = [];

	            for (let i in pkg.dependencies) {
	                // todo: check for semver versions and do all the resolutions

	                if (dependencyMap.hasOwnProperty(i)) {
	                    continue;
	                }
	                let version = null;

	                promises.push(get(join(cdn_url, i, 'meta.json')).then((meta) => {
	                    try {
	                        meta = JSON.parse(meta);
	                    } catch (ex) {
	                        // reject
	                    }

	                    version = pkg.dependencies[i];
	                    const availableVersions = meta.v;

	                    if (meta.semver) {
	                        version = semver_31(availableVersions, version);
	                    }
	                    if (version === null || (!meta.semver && availableVersions.indexOf(version) === -1)) {
	                        throw new Error(`Invalid version for ${cdn_url}, ${version}`);
	                    }


	                    return get(join(cdn_url, i, version, 'rodin_package.json'));

	                }).then((data) => {
	                    const pkg = getEnv(JSON.parse(data), env);
	                    dependencyMap[i] = join(cdn_url, i, version, pkg.main);
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
	    'https://cdn2.rodin.io/threejs/main/latest/bundle/three.min.js',
	].map(x => get(x));

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
	                        // console.log('render');
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
	                get(data.main).then(src => {
	                    _window = new CustomWindow(src);
	                    window._window = _window;
	                    bindTHREEJSRenderer(_window, _renderer);
	                    const scripts = _window.document.getElementsByTagName('script');
	                    const promises = [];
	                    for(let i = 0; i < scripts.length; i ++) {
	                        promises.push(get(scripts[i].src));
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

}());
