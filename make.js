#!/usr/bin/env node

const {
    execSync,
} = require('child_process')

const posthtml = require('posthtml')
const toc = require('posthtml-toc')
const marked = require('marked')
const {
    readdirSync,
    readFileSync,
    writeFileSync,
    statSync,
} = require('fs')
const {
    dirname,
} = require('path')

let doctype
let headOrig
let nav

const minihtml = function(tree) {
    tree.match(/^\n(\s+)?$/, node => {
        return ''
    })
}

posthtml()
    .use(function(tree) {
        tree.match(/!doctype/, node => (doctype = node))
        tree.match({ tag: 'head' }, node => (headOrig = node))
        tree.match({ tag: 'nav' }, node => (nav = node))
    })
    .process(readFileSync('./index.html').toString(), { sync: true })

const getFiles = function(dir, result = [], RE) {
    const files = readdirSync(dir)
    for (let i in files) {
        let name = dir + '/' + files[i]
        if (statSync(name).isDirectory()) {
            getFiles(name, result, RE)
        } else if (RE.test(name)) {
            result.push(name)
        }
    }
    return result
}

const getTime = function(file) {
    const time = execSync(`git log --format=%at -n 1 ${file}`).toString().replace('\n', '')
    const timeStart = execSync(`git log --reverse --format=%at ${file}|head -1`).toString().replace('\n', '')
    const now = time.length ? new Date(parseInt(time) * 1000) : new Date()
    const start = timeStart.length ? new Date(parseInt(timeStart) * 1000) : new Date()
    return [start, now]
}

const makeHead = function(tree, options = {}) {

    const head = Object.assign({}, headOrig)

    const {
        title,
        description,
        canonical,
        page,
        modifiedTime,
        publishedTime
    } = options

    const url = 'https://voischev.ru' + canonical

    tree.walk.bind(head)(function(node) {
        if (title === undefined) {
            throw new Error('Отсутствует заголовок: ' + page)
        }

        if (description === undefined) {
            throw new Error('Отсутствует описание: ' + page)
        }

        if (canonical === undefined) {
            throw new Error('Отсутствует каноническая ссылка: ' + page)
        }

        if (node.tag === 'title') {
            node.content = title
        }

        if (!node.attrs) {
            return node
        }

        if (node.attrs.rel === 'canonical') {
            node.attrs.href = url
        }

        if (node.attrs.property === 'twitter:title') {
            node.attrs.content = title
        }

        if (node.attrs.name === 'description' ||
            node.attrs.property === 'twitter:description') {
            node.attrs.content = description
        }

        return node
    })

    if (!modifiedTime && !publishedTime) {
        return head
    }

    head.content = head.content.concat([
        { tag: 'meta', attrs: { property: 'og:type', content: 'article' }},
        { tag: 'meta', attrs: { property: 'og:title', content: title }},
        { tag: 'meta', attrs: { property: 'og:description', content: description }},
        { tag: 'meta', attrs: { property: 'og:url', content: url }},
        { tag: 'meta', attrs: { property: 'article:autor', content: 'Иван Воищев' }},
        { tag: 'meta', attrs: { property: 'article:modified_time', content: modifiedTime }},
        { tag: 'meta', attrs: { property: 'article:published_time', content: publishedTime }},
    ])

    return head
}

const makePage = function(mdPath, cb) {
    const [startTime, time]  = getTime(mdPath)
    const publishedTime = startTime.toISOString()
    const modifiedTime = time.toISOString()
    const html = marked(readFileSync(mdPath).toString())
    const url = dirname(mdPath).substring(1) + '/'

    let title
    let description

    const page = posthtml()
        .use(function(tree) {
            tree.match({ tag: 'h1' }, function(node) {
                if (title) {
                    return node
                }

                title = node.content[0]
                return node
            })

            tree.match({ tag: 'p' }, function(node) {
                if (description) {
                    return node
                }

                description = node.content[0]
                return node
            })

            const head = makeHead(tree, {
                title,
                description,
                canonical: url,
                page: mdPath,
                modifiedTime,
                publishedTime,
            })

            return [
                doctype,
                {
                    tag: 'html',
                    attrs: { prefix: 'og:http://ogp.me/ns# article:http://ogp.me/ns/article#' },
                    content: [
                        head,
                        {
                            tag: 'body',
                            content: [].concat(
                                nav,
                                {
                                    tag: 'main',
                                    content: [
                                        {
                                            tag: 'article',
                                            content: tree,
                                        },
                                    ],
                                },
                            ),
                        },
                    ],
                },
            ]
        })
        .use(toc({
            title: 'Содержание',
        }))
        .use(minihtml)
        .process(html, { sync: true })
        .html

    cb({
        url,
        title,
        description,
        page,
        time,
    })
}

const makeCatalog = function(options = {}) {
    const {
        title,
        description,
        dir,
        canonical,
    } = options

    const sortFn = options.sortFn || function (a, b) {
        return b.date - a.date
    }

    const links = []
    const files = getFiles(dir, [], /\.md$/)

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        makePage(file, function(data = {}) {
            const {
                url,
                title,
                page,
                time,
            } = data

            writeFileSync('.' + url + 'index.html', page)

            links.push({
                url,
                title,
                time,
            })
        })
    }

    const result = posthtml()
        .use(function(tree) {

            const head = makeHead(tree, {
                title,
                description,
                canonical,
                page: dir,
            })

            return [
                doctype,
                head,
                {
                    tag: 'body',
                    content: [].concat(
                        nav,
                        {
                            tag: 'main',
                            content: {
                                tag: 'ul',
                                content: links.sort(sortFn).map(function(item) {
                                    return {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            attrs: {
                                                href: item.url,
                                            },
                                            content: item.title,
                                        },
                                    }
                                }),
                            },
                        },
                    ),
                },
            ]
        })
        .use(minihtml)
        .process([], { skipParse: true, sync: true })
        .html

    writeFileSync(dir + '/index.html', result)
}

makeCatalog({
    title: 'Заметки',
    description: 'Все заметки',
    dir: './t',
    canonical: '/t/',
})

makeCatalog({
    title: 'Инвестиции',
    description: 'Итоги инвестиций',
    dir: './invest',
    canonical: '/invest/',
    sortFn: function(a, b) {
        return +b.url.match(/\d+/) - +a.url.match(/\d+/)
    },
})

makeCatalog({
    title: 'Книги',
    description: 'Заметки из книг',
    dir: './knigi',
    canonical: '/knigi/',
})


console.log('Завершено')

