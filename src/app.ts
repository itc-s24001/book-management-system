import createError from 'http-errors'
import express, { NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import session from 'express-session'
import { createClient } from 'redis'
import RedisStore from 'connect-redis'
import passport from './middlewares/auth.js'

import userRouter from './routes/users'
import bookRouter from './routes/book.js'
import adminRouter from './routes/admin.js'
import searchRouter from './routes/search.js'

const app = express()

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
})
redisClient.connect().catch(console.error)

const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'book-management:',
})

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(
    session({
        store: redisStore,
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    })
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/user', userRouter)
app.use('/book', bookRouter)
app.use('/admin', adminRouter)
app.use('/search', searchRouter)

app.use(async (req: Request, res: Response, next: NextFunction) => {
    throw createError(404)
})

app.use(
    async (err: unknown, req: Request, res: Response, next: NextFunction) => {
        const status = hasProperty(err, 'status') ? Number(err.status) : 500
        const message =
            hasProperty(err, 'message') && err.message
                ? err.message
                : 'Internal Server Error'

        res.status(status).json({ message })
    }
)

function hasProperty<K extends string>(
    x: unknown,
    ...name: K[]
): x is { [M in K]: unknown } {
    return x instanceof Object && name.every((prop) => prop in x)
}

export default app