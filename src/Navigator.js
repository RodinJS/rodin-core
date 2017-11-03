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