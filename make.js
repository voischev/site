#!/usr/bin/env node

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
let nav
let footer = { tag: 'footer', content: '© ' + new Date().getFullYear() }

posthtml()
    .use(function(tree) {
        tree.match(/!doctype/, node => (doctype = node))
        tree.match({ tag: 'head' }, node => (head = node))
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

const getTime = function(time) {
    const t = time.toISOString()
    return {
        tag: 'time',
        attrs: { datetime: t },
        content: t.substring(0,10),
    }
}

const makePage = function(mdPath) {
    const html = marked(readFileSync(mdPath).toString())
    const {
        mtime,
    } = statSync(mdPath)

    let title
    let description

    const result = posthtml()
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
                                getTime(mtime),
                                ' последнее изменение',
                            ],
                        },
                        footer,
                    ),
                },
            ]
        })
        .process(html, { sync: true })
        .html

    return result
}

const files = getFiles('./notes', [], /\.md$/)

for (let i = 0; i < files.length; i++) {
    const file = files[i]
    writeFileSync(dirname(file) + '/index.html', makePage(file))
}

console.log('Завершено')

