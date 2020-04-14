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
} = require('path');

let doctype
let head
let metrika
let nav
let footer = { tag: 'footer', content: '© ' + new Date().getFullYear() }

posthtml()
    .use(function(tree) {
        tree.match(/!doctype/, node => (doctype = node))
        tree.match({ tag: 'head' }, node => (head = node))
        tree.match({ tag: 'nav' }, node => (nav = node))
        tree.match({ tag: 'img', attrs: { src: /mc.yandex.ru\/watch/ }}, node => (metrika = node))
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
    return new Date(parseInt(execSync('git log --format="%at" -n 1 ' + file).toString().replace('\n', '')) * 1000)
}

const makeHead = function(tree, options = {}) {
    const {
        title,
        description,
    } = options

    tree.walk.bind(head)(function(node) {
        if (title === undefined) {
            throw new Error('Отсутствует заголовок: ' + mdPath)
        }

        if (node.tag === 'title') {
            node.content = title
        }

        if (!node.attrs) {
            return node
        }

        if (node.attrs.property === 'og:title' ||
            node.attrs.property === 'twitter:title') {
            node.attrs.content = title
        }

        if (node.attrs.name === 'description' ||
            node.attrs.property === 'og:description' ||
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

            makeHead(tree, { title, description })

            return [
                doctype,
                head,
                {
                    tag: 'body',
                    content: [].concat(
                        nav,
                        {
                            tag: 'main',
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
                        footer,
                        metrika,
                    ),
                },
            ]
        })
        .process(html, { sync: true })
        .html

    cb({
        url: dirname(mdPath).substring(1) + '/',
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
        links,
    } = options

    const result = posthtml()
        .use(function(tree) {

            makeHead(tree, { title, description })

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
                                content: links.sort((a, b,) => (b.date - a.date)).map(function(item) {
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
                        footer,
                        metrika,
                    ),
                },
            ]
        })
        .process([], { skipParse:true, sync: true })
        .html

    return result
}

const tLinks = []
const files = getFiles('./t', [], /\.md$/)

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

        tLinks.push({
            url,
            title,
            date,
        })
    })
}

writeFileSync('./t/index.html', makeCatalog({
    title: 'Заметки',
    description: 'Все заметки',
    links: tLinks,
}))

console.log('Завершено')

