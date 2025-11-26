import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import argon2 from 'argon2'
import prisma from '../libs/db.js'
import { Request, Response, NextFunction } from 'express'

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await prisma.user.findFirst({
                    where: { email, isDeleted: false },
                })

                if (!user) {
                    return done(null, false, { message: 'Invalid credentials' })
                }

                const isValid = await argon2.verify(user.password, password)
                if (!isValid) {
                    return done(null, false, { message: 'Invalid credentials' })
                }

                return done(null, user)
            } catch (error) {
                return done(error)
            }
        }
    )
)


passport.serializeUser((user: any, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id, isDeleted: false },
        })
        done(null, user)
    } catch (error) {
        done(error)
    }
})

export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).json({ message: 'Unauthorized' })
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
        return next()
    }
    res.status(403).json({ message: 'Forbidden' })
}

export default passport