import { ResponseError } from './ResponseError.js'

export const CheckAuth = (req, res, next) => {
    if (req.cookies.userId) {
        next()
    } else {
        ResponseError(res, 401, 'Unauthorized request.')
    }
}
