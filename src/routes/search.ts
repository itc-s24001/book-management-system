import { Router } from 'express'
import prisma from '../libs/db.js'

const router = Router()

router.get('/author', async (req, res) => {
    try {
        const { keyword } = req.query  // クエリパラメータから取得

        if (!keyword || typeof keyword !== 'string') {
            return res.status(400).json({ message: 'Missing keyword' })
        }

        const authors = await prisma.author.findMany({
            where: {
                name: {
                    contains: keyword,
                },
                isDeleted: false,
            },
            select: {
                id: true,
                name: true,
            },
        })

        res.status(200).json({ authors })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to search authors' })
    }
})

router.get('/publisher', async (req, res) => {
    try {
        const { keyword } = req.body

        if (!keyword) {
            return res.status(400).json({ message: 'Missing keyword' })
        }

        const publishers = await prisma.publisher.findMany({
            where: {
                name: {
                    contains: keyword,
                },
                isDeleted: false,
            },
            select: {
                id: true,
                name: true,
            },
        })

        res.status(200).json({ publishers })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to search publishers' })
    }
})

export default router