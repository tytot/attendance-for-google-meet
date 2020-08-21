fetch('../README.md')
    .then((response) => response.text())
    .then((text) => {
        text = text.replace(/(\r\n|\r|\n)## \w+/g, replacer)
        text = text.replace('\n</details>\n', '')
        text += '\n\n</details>'
        console.log(text)
        document.getElementById('markdown').innerHTML = marked(text)
    })

function replacer(match) {
    const title = match.substring(5)
    return `
</details>

<details>
    <summary style="font-size: 1.25em; font-weight: bold;">${title}</summary>`
}