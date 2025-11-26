import prisma from '../src/libs/db.js'
import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseCSV(content: string): Array<Record<string, string>> {
    const lines = content.trim().split('\n')
    if (lines.length === 0) {
        return []
    }

    const headers = lines[0].split(',').map(h => h.trim())

    return lines.slice(1).map(line => {
        const values: string[] = []
        let currentValue = ''
        let insideQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                insideQuotes = !insideQuotes
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim())
                currentValue = ''
            } else {
                currentValue += char
            }
        }
        values.push(currentValue.trim())

        const obj: Record<string, string> = {}
        headers.forEach((header, index) => {
            obj[header] = values[index]?.replace(/^"|"$/g, '') || ''
        })
        return obj
    })
}

async function importAuthors(filePath: string): Promise<number> {
    console.log('\n📖 著者をインポート中...')

    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  ファイルが見つかりません: ${filePath}`)
        return 0
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const authors = parseCSV(content)

    let count = 0
    for (const author of authors) {
        if (!author.id || !author.name) {
            console.log(`  ⚠️  スキップ: 必須項目が不足しています`)
            continue
        }

        await prisma.author.upsert({
            where: {id: author.id},
            update: {name: author.name},
            create: {
                id: author.id,
                name: author.name,
            },
        })
        console.log(`  ✓ ${author.name}`)
        count++
    }

    return count
}

async function importPublishers(filePath: string): Promise<number> {
    console.log('\n🏢 出版社をインポート中...')

    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  ファイルが見つかりません: ${filePath}`)
        return 0
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const publishers = parseCSV(content)

    let count = 0
    for (const publisher of publishers) {
        if (!publisher.id || !publisher.name) {
            console.log(`  ⚠️  スキップ: 必須項目が不足しています`)
            continue
        }

        await prisma.publisher.upsert({
            where: {id: publisher.id},
            update: {name: publisher.name},
            create: {
                id: publisher.id,
                name: publisher.name,
            },
        })
        console.log(`  ✓ ${publisher.name}`)
        count++
    }

    return count
}

async function importBooks(filePath: string): Promise<number> {
    console.log('\n📚 書籍をインポート中...')

    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  ファイルが見つかりません: ${filePath}`)
        return 0
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const books = parseCSV(content)

    let count = 0
    for (const book of books) {
        if (!book.isbn || !book.title || !book.author_id || !book.publisher_id ||
            !book.publication_year || !book.publication_month) {
            console.log(`  ⚠️  スキップ: 必須項目が不足しています (${book.title || 'タイトル不明'})`)
            continue
        }

        try {
            const isbn = BigInt(book.isbn)
            const publicationYear = parseInt(book.publication_year)
            const publicationMonth = parseInt(book.publication_month)

            if (publicationMonth < 1 || publicationMonth > 12) {
                console.log(`  ⚠️  スキップ: 無効な月 (${book.title})`)
                continue
            }

            await prisma.book.upsert({
                where: {isbn},
                update: {
                    title: book.title,
                    authorId: book.author_id,
                    publisherId: book.publisher_id,
                    publicationYear,
                    publicationMonth,
                },
                create: {
                    isbn,
                    title: book.title,
                    authorId: book.author_id,
                    publisherId: book.publisher_id,
                    publicationYear,
                    publicationMonth,
                },
            })
            console.log(`  ✓ ${book.title}`)
            count++
        } catch (error) {
            console.log(`  ❌ エラー: ${book.title} - ${error}`)
        }
    }

    return count
}

async function main() {
    console.log('='.repeat(60))
    console.log('CSVファイルからデータをインポート')
    console.log('='.repeat(60))

    const dataDir = process.argv[2] || path.join(__dirname, '../data/csv')

    console.log(`\nデータディレクトリ: ${dataDir}`)

    if (!fs.existsSync(dataDir)) {
        console.error(`\n❌ エラー: ディレクトリが見つかりません: ${dataDir}`)
        process.exit(1)
    }

    const authorFile = path.join(dataDir, 'author.csv')
    const publisherFile = path.join(dataDir, 'publisher.csv')
    const bookFile = path.join(dataDir, 'book.csv')

    let totalAuthors = 0
    let totalPublishers = 0
    let totalBooks = 0

    try {
        totalAuthors = await importAuthors(authorFile)
        totalPublishers = await importPublishers(publisherFile)
        totalBooks = await importBooks(bookFile)

        console.log('\n' + '='.repeat(60))
        console.log('✅ インポートが完了しました！')
        console.log('='.repeat(60))
        console.log(`   著者: ${totalAuthors}件`)
        console.log(`   出版社: ${totalPublishers}件`)
        console.log(`   書籍: ${totalBooks}件`)
        console.log('='.repeat(60))

    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error)
        process.exit(1)
    }
}

main()
    .catch(e => {
        console.error('❌ 予期しないエラー:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })