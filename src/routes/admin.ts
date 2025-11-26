import { Router } from 'express'
import prisma from '../libs/db.js'
import { isAdmin } from '../middlewares/auth.js'

const router = Router()

router.post('/author', isAdmin, async (req, res) => {
    try {
        const { name } = req.body

        if (!name) {
            return res.status(400).json({ message: 'Missing author name' })
        }

        const author = await prisma.author.create({
            data: { name },
        })

        res.status(200).json({
            id: author.id,
            name: author.name,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to create author' })
    }
})

router.put('/author', isAdmin, async (req, res) => {
    try {
        const { id, name } = req.body

        if (!id || !name) {
            return res.status(400).json({ message: 'Missing required parameters' })
        }

        const author = await prisma.author.update({
            where: { id, isDeleted: false },
            data: { name },
        })

        res.status(200).json({
            id: author.id,
            name: author.name,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to update author' })
    }
})

router.delete('/author', isAdmin, async (req, res) => {
    try {
        const { id } = req.body

        if (!id) {
            return res.status(400).json({ message: 'Missing author id' })
        }

        await prisma.author.update({
            where: { id },
            data: { isDeleted: true },
        })

        res.status(200).json({ message: '削除しました' })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to delete author' })
    }
})

router.post('/publisher', isAdmin, async (req, res) => {
    try {
        const { name } = req.body

        if (!name) {
            return res.status(400).json({ message: 'Missing publisher name' })
        }

        const publisher = await prisma.publisher.create({
            data: { name },
        })

        res.status(200).json({
            id: publisher.id,
            name: publisher.name,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to create publisher' })
    }
})

router.put('/publisher', isAdmin, async (req, res) => {
    try {
        const { id, name } = req.body

        if (!id || !name) {
            return res.status(400).json({ message: 'Missing required parameters' })
        }

        const publisher = await prisma.publisher.update({
            where: { id, isDeleted: false },
            data: { name },
        })

        res.status(200).json({
            id: publisher.id,
            name: publisher.name,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to update publisher' })
    }
})

router.delete('/publisher', isAdmin, async (req, res) => {
    try {
        const { id } = req.body

        if (!id) {
            return res.status(400).json({ message: 'Missing publisher id' })
        }

        await prisma.publisher.update({
            where: { id },
            data: { isDeleted: true },
        })

        res.status(200).json({ message: '削除しました' })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to delete publisher' })
    }
})

router.post('/book', isAdmin, async (req, res) => {
    try {
        const {
            isbn,
            title,
            author_id,
            publisher_id,
            publication_year,
            publication_month,
        } = req.body

        if (
            !isbn ||
            !title ||
            !author_id ||
            !publisher_id ||
            !publication_year ||
            !publication_month
        ) {
            return res.status(400).json({ message: 'Missing required parameters' })
        }

        const existingBook = await prisma.book.findUnique({
            where: { isbn: BigInt(isbn) },
        })

        if (existingBook) {
            return res.status(400).json({ message: 'Book with this ISBN already exists' })
        }

        await prisma.book.create({
            data: {
                isbn: BigInt(isbn),
                title,
                authorId: author_id,
                publisherId: publisher_id,
                publicationYear: publication_year,
                publicationMonth: publication_month,
            },
        })

        res.status(200).json({ message: '登録しました' })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to create book' })
    }
})

router.put('/book', isAdmin, async (req, res) => {
    try {
        const {
            isbn,
            title,
            author_id,
            publisher_id,
            publication_year,
            publication_month,
        } = req.body

        if (
            !isbn ||
            !title ||
            !author_id ||
            !publisher_id ||
            !publication_year ||
            !publication_month
        ) {
            return res.status(400).json({ message: 'Missing required parameters' })
        }

        const existingBook = await prisma.book.findUnique({
            where: { isbn: BigInt(isbn) },
        })

        if (!existingBook) {
            return res.status(400).json({ message: 'Book with this ISBN does not exist' })
        }

        await prisma.book.update({
            where: { isbn: BigInt(isbn) },
            data: {
                title,
                authorId: author_id,
                publisherId: publisher_id,
                publicationYear: publication_year,
                publicationMonth: publication_month,
            },
        })

        res.status(200).json({ message: '更新しました' })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to update book' })
    }
})

router.delete('/book', isAdmin, async (req, res) => {
    try {
        const { isbn } = req.body

        if (!isbn) {
            return res.status(400).json({ message: 'Missing ISBN' })
        }

        await prisma.book.update({
            where: { isbn: BigInt(isbn) },
            data: { isDeleted: true },
        })

        res.status(200).json({ message: '削除しました' })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Failed to delete book' })
    }
})

export default router