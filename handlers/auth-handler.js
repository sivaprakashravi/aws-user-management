
const atob = require('atob');

const unixToTime = (unixTime) => {
    return new Date(unixTime * 1000).getTime();
}

const self = module.exports = {
    decode: (token) => {
        var base64Url = token.split('.')[1];
        var base64 = decodeURIComponent(atob(base64Url).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(base64);
    },
    ValidateToken: (token) => {
        const decoded = token ? self.decode(token) : {};
        return ({
            "auth_time": decoded.auth_time,
            "exp": decoded.exp,
            "iat": decoded.iat,
            "username": decoded.username,
            "sub":decoded.sub,
            "valid": (decoded && unixToTime(decoded.exp) > new Date().getTime())
        });
    }
};

return self;