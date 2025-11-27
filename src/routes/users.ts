import { Router } from 'express'
import argon2 from 'argon2'
import passport from '../middlewares/auth.js'
import prisma from '../libs/db.js'
import { isAuthenticated } from '../middlewares/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
    try {
        const { email, name, password } = req.body

        if (!email || !name || !password) {
            return res.status(400).json({ reason: 'Missing required parameters' })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return res.status(400).json({ reason: 'Email already exists' })
        }

        const hashedPassword = await argon2.hash(password)

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        })

        res.status(201).json({})
    } catch (error) {
        console.error(error)
        res.status(500).json({ reason: 'Registration failed' })
    }
})


router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' })
        }
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' })
        }

        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Login failed' })
            }
            return res.status(200).json({ message: 'ok' })
        })
    })(req, res, next)
})

router.get('/history', isAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as any).id

        const history = await prisma.rentalLog.findMany({
            where: { userId },
            include: {
                book: {
                    select: {
                        isbn: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                checkoutDate: 'desc',
            },
        })

        const formattedHistory = history.map((log) => ({
            id: log.id,
            book: {
                isbn: Number(log.book.isbn),
                name: log.book.title,
            },
            checkout_date: log.checkoutDate,
            due_date: log.dueDate,
            returned_date: log.returnedDate,
        }))

        res.status(200).json({ history: formattedHistory })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch history' })
    }
})

export default router