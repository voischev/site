function jsonp(url, options = { param: 'callback' }) {
    const { param } = options;
    return new Promise((resolve, reject) => {
        const id = `__${param + Date.now()}`;
        const script = document.createElement('script');

        function cleanup() {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window[id]
        }

        window[id] = (response) => {
            resolve(response);
            cleanup();
        };

        script.src = url + (~url.indexOf('?') ? '&' : '?') + param + '=' + id;
        script.onerror = () => {
            reject(new Error(`JSONP request to ${url} failed`));
            cleanup();
        };
        document.head.appendChild(script);
    });
};

