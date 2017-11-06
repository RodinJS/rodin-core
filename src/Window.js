import {CustomNavigator} from "./Navigator.js";
import polyfillWindowRegisterElement from '../third_party/document-register-element/build/document-register-element.esmodule.js';

export class CustomWindow {
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
                this.events[eventName][f](event)
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