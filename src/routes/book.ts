import { Router } from 'express'
import prisma from '../libs/db.js'
import { isAuthenticated } from '../middlewares/auth.js'

const router = Router()

router.get('/list/:page?', async (req, res) => {
    try {
        const page = parseInt(req.params.page || '1')
        const perPage = 5
        const skip = (page - 1) * perPage

        const totalBooks = await prisma.book.count({
            where: { isDeleted: false },
        })

        const books = await prisma.book.findMany({
            where: { isDeleted: false },
            include: {
                author: {
                    select: { name: true },
                },
            },
            orderBy: [
                { publicationYear: 'desc' },
                { publicationMonth: 'desc' },
            ],
            skip,
            take: perPage,
        })

        const formattedBooks = books.map((book) => ({
            isbn: Number(book.isbn),
            title: book.title,
            author: {
                name: book.author.name,
            },
            publication_year_month: `${book.publicationYear}-${String(
                book.publicationMonth
            ).padStart(2, '0')}`,
        }))

        res.status(200).json({
            current: page,
            last_page: Math.ceil(totalBooks / perPage),
            books: formattedBooks,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch books' })
    }
})

router.get('/detail/:isbn', async (req, res) => {
    try {
        const isbn = BigInt(req.params.isbn)

        const book = await prisma.book.findUnique({
            where: { isbn, isDeleted: false },
            include: {
                author: {
                    select: { name: true },
                },
                publisher: {
                    select: { name: true },
                },
            },
        })

        if (!book) {
            return res.status(404).json({ message: '書籍が見つかりません' })
        }

        res.status(200).json({
            isbn: Number(book.isbn),
            title: book.title,
            author: {
                name: book.author.name,
            },
            publisher: {
                name: book.publisher.name,
            },
            publication_year_month: `${book.publicationYear}-${String(
                book.publicationMonth
            ).padStart(2, '0')}`,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch book details' })
    }
})

router.post('/rental', isAuthenticated, async (req, res) => {
    try {
        const { book_id } = req.body
        const userId = (req.user as any).id

        if (!book_id) {
            return res.status(400).json({ message: 'Missing book_id' })
        }

        const bookIsbn = BigInt(book_id)

        const book = await prisma.book.findUnique({
            where: { isbn: bookIsbn, isDeleted: false },
        })

        if (!book) {
            return res.status(404).json({ message: '書籍が存在しません' })
        }

        const existingRental = await prisma.rentalLog.findFirst({
            where: {
                bookIsbn,
                returnedDate: null,
            },
        })

        if (existingRental) {
            return res.status(409).json({ message: '既に貸出中です' })
        }

        const checkoutDate = new Date()
        const dueDate = new Date(checkoutDate)
        dueDate.setDate(dueDate.getDate() + 7)

        const rental = await prisma.rentalLog.create({
            data: {
                bookIsbn,
                userId,
                checkoutDate,
                dueDate,
            },
        })

        res.status(200).json({
            id: rental.id,
            checkout_date: rental.checkoutDate,
            due_date: rental.dueDate,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to rent book' })
    }
})

router.put('/return', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.body
        const userId = (req.user as any).id

        if (!id) {
            return res.status(400).json({ message: 'Missing rental id' })
        }

        const rental = await prisma.rentalLog.findUnique({
            where: { id },
        })

        if (!rental) {
            return res.status(404).json({ message: '存在しない貸出記録です' })
        }

        if (rental.userId !== userId) {
            return res.status(403).json({ message: '他のユーザの貸出書籍です' })
        }

        if (rental.returnedDate) {
            return res.status(400).json({ message: '既に返却済みです' })
        }

        const returnedDate = new Date()

        const updatedRental = await prisma.rentalLog.update({
            where: { id },
            data: { returnedDate },
        })

        res.status(200).json({
            id: updatedRental.id,
            returned_date: updatedRental.returnedDate,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to return book' })
    }
})

export default router