export const ResponseError = (res, statusCode, message) => {
    if (!statusCode) {
        statusCode = 500
    }
    if (!message) {
        message = 'something went wrong.'
    }

    res.status(statusCode)
    res.send({ ErrorMessage: message })
}
