class DynamicBrowseHistory {
    userHasHistoryPushState: boolean;

    constructor() {
        this.userHasHistoryPushState = false;
    }

    initialise(onPopState: Function): void {
        if (history.pushState) {
            this.userHasHistoryPushState = true;
        }
        window.onpopstate = (event: PopStateEvent): void => {
            onPopState(event);
        }
    }

    push(url: string, state?: object): void {
        if (!this.userHasHistoryPushState) {
            return;
        }
        if (!state) {
            state = {};
        }
        history.pushState({url: url, ...state}, "", url);
    }

    replace(url: string, state?: object): void {
        if (!this.userHasHistoryPushState) {
            return;
        }
        if (!state) {
            state = {};
        }
        history.replaceState({url: url, ...state}, "", url);
    }
}

export default new DynamicBrowseHistory();