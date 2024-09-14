const ERROR_CODE = {
    BAD_REQUEST: {
        status: 400,
        message: 'Bad Request'
    },
    UNAUTHORIZED: {
        status: 401,
        message: 'Unauthorized'
    },
    FORBIDDEN: {
        status: 403,
        message: 'Forbidden'
    },
    NOT_FOUND: {
        status: 404,
        message: 'Not Found'
    },
    METHOD_NOT_ALLOWED: {
        status: 405,
        message: 'Method Not Allowed'
    },
    INTERNAL_SERVER_ERROR: {
        status: 500,
        message: 'Internal Server Error'
    },
    BAD_GATEWAY: {
        status: 502,
        message: 'Bad Gateway'
    },
    SERVICE_UNAVAILABLE: {
        status: 503,
        message: 'Service Unavailable'
    },
    GATEWAY_TIMEOUT: {
        status: 504,
        message: 'Gateway Timeout'

    }
}

module.exports = {
    ERROR_CODE,
}