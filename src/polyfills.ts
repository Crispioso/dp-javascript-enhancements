import polyfill from 'dynamic-polyfill';

/**
 * Polyfills that aren't included in Polyfill.io yet
 */
export class CustomPolyfills {
    
    static nodeListForEach() :void {
        if ((<any>window).NodeList && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = function (callback: Function, argument: any): void {
                argument = argument || window;
                for (var i: number = 0; i < this.length; i++) {
                    callback.call(argument, this[i], i, this);
                }
            };
        }
    }
} 


/**
 * Polyfills dynamically fetched from Polyfill.io
 */
interface polyfillOptions {
    fills: string[],
    minify?: boolean,
    rum?: boolean,
    afterFill: () => void
}

export const polyfills: Function = (initialiseJS: () => void) => {
    const options: polyfillOptions = {
        fills: [
            'Element.prototype.closest',
            'fetch',
            'Promise',
            'Object.assign'
        ],
        minify: false,
        rum: true,
        afterFill(): void {
            initialiseJS();
        }
    }
    polyfill(options)
}