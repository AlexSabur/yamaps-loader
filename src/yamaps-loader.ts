import set from 'lodash/set';

interface YandexQueryOptions {
    lang: 'ru_RU' | 'en_US';
    apiKey: string;
    coordorder?: 'latlong' | 'longlat';
    load?: string;
}

export default class YamapsLoader {

    host = '//api-maps.yandex.ru';

    version = '2.1';

    options: YandexQueryOptions = {
        lang: 'ru_RU',
        load: 'Map',
        apiKey: '<api-key>',
    };

    /**
     * @type {Promise<import('@types/yandex-maps')>}
     */
    promise: null | Promise<any> = null;

    setOptions(options: YandexQueryOptions) {
        this.options = options;
    }

    get scriptSrc(): string {
        const ret: string[] = [];

        Object.entries(this.options).forEach(
            //@ts-ignore
            (key, value) => ret.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        )

        return `${this.host}/${this.version}/?${ret.join('&')}`;
    }

    /**
     * @returns {Promise<import('@types/yandex-maps')>}
     */
    ready() {
        if (this.promise === null) {
            this.promise = new Promise((resolve, reject) => {
                const scriptElement = document.createElement('script');
                scriptElement.onload = resolve;
                scriptElement.onerror = reject;
                scriptElement.defer = true;
                scriptElement.type = 'text/javascript';
                scriptElement.src = this.scriptSrc;
                document.head.appendChild(scriptElement);
                //@ts-ignore
            }).then(() => new Promise((resolve) => ymaps.ready(resolve)));
        }

        return this.promise;
    }

    /**
     * @param {String[]} moduleNames Dot path to yandex map module
     * @returns {Promise<import('@types/yandex-maps')>}
     */
    async require(...moduleNames: string[]) {
        const ymaps = await this.ready();

        const modules = moduleNames.map((moduleName) => new Promise((resolve) => {
            //@ts-ignore
            ymaps.modules.require(moduleName, (el) => {
                //@ts-ignore
                set(ymaps, moduleName, el);
                resolve(ymaps);
            }, resolve);
        }));

        await Promise.all(modules);

        return ymaps;
    }
}
