const API_CONFIG = {
    BASE_URL: 'https://serqata.runasp.net',
    
    getApiUrl: function(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return `${this.BASE_URL}/api/${cleanEndpoint}`;
    },
    
    getDomain: function() {
        return window.location.hostname;
    }
};

window.API_CONFIG = API_CONFIG;

