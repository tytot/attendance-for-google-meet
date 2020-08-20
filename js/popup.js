fetch('../README.md')
    .then((response) => response.text())
    .then((text) => {
        text = text.replace(/### \w+/g, replacer)
        text = text.replace(/---/g, '</details>')
        document.getElementById('markdown').innerHTML = marked(text)
    })

function replacer(match) {
    const title = match.substring(4)
    return `<details>
        <summary style="font-size: 1.25em; font-weight: bold;">${title}</summary>`
}