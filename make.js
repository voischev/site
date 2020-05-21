#!/usr/bin/env node

const {
    execSync,
} = require('child_process')

const posthtml = require('posthtml')
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
let head
let nav

const minihtml = function(tree) {
    tree.match(/^\n(\s+)?$/, node => {
        return ''
    })
}

posthtml()
    .use(function(tree) {
        tree.match(/!doctype/, node => (doctype = node))
        tree.match({ tag: 'head' }, node => (head = node))
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

const getDate = function(file) {
    const time = execSync('git log --format="%at" -n 1 ' + file).toString().replace('\n', '')
    return time.length ? new Date(parseInt(time) * 1000) : new Date()
}

const makeHead = function(tree, options = {}) {
    const {
        title,
        description,
        canonical,
        page,
    } = options

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
            node.attrs.href = 'https://voischev.ru' + canonical
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
}

const makePage = function(mdPath, cb) {
    const date = getDate(mdPath)
    const isoDate = date.toISOString()
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

            makeHead(tree, {
                title,
                description,
                canonical: url,
                page: mdPath,
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
                            content: [
                                {
                                    tag: 'article',
                                    content: tree,
                                },
                                {
                                    tag: 'div',
                                    content: [
                                        {
                                            tag: 'time',
                                            attrs: { datetime: isoDate },
                                            content: isoDate.substring(0,10),
                                        },
                                        ' последнее изменение',
                                    ],
                                },
                            ],
                        },
                    ),
                },
            ]
        })
        .use(minihtml)
        .process(html, { sync: true })
        .html

    cb({
        url,
        title,
        description,
        page,
        date,
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
                date,
            } = data

            writeFileSync('.' + url + 'index.html', page)

            links.push({
                url,
                title,
                date,
            })
        })
    }

    const result = posthtml()
        .use(function(tree) {

            makeHead(tree, {
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

