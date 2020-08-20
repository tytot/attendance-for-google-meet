fetch('../README.md')
    .then((response) => response.text())
    .then((text) => {
        document.getElementById('markdown').innerHTML = marked(text)
    })
