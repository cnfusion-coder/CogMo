import axios from "axios"


function apiUrl() {
    // if (process.env.NODE_ENV === 'development') {
    //     // return 'http://113.88.60.228:8000/'
    //     return 'http://localhost:8000/'
    // } else if (process.env.NODE_ENV === 'production') {
    //     return '/'
    // }
    return 'http://168.150.115.181:8000/'
}

/**
 * @typedef {Object} TokenHeader
 * @property {string | undefined} Authorization
 */

/**
 * @type {TokenHeader}
 */
let tokenHeader = {};

/**
 * @param {TokenHeader} newTokenHeader
 */
function setTokenHeader(newTokenHeader) {
    tokenHeader = newTokenHeader;
}

const baseServer = axios.create({
    baseURL: apiUrl(),
    timeout: 999999999,
    headers: {
        'Content-Type': 'application/json'
    }
});

baseServer.interceptors.request.use(config => {
    config.headers = {
        ...config.headers,
        ...tokenHeader
    };
    return config;
})

export {
    baseServer,
    setTokenHeader
}