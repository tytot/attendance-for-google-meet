// fetch('../README.md')
//     .then((response) => response.text())
//     .then((text) => {
//         text = text.replace(/(\r\n|\r|\n)## .+/g, replacer)
//         text = text.replace('\n</details>\n', '')
//         text += '\n\n</details>'
//         console.log(text)
//         document.getElementById('markdown').innerHTML = marked(text)
//     })

// function replacer(match) {
//     const title = match.substring(5)
//     return `
// </details>

// <details>
//     <summary style="font-size: 1.25em; font-weight: bold;">${title}</summary>`
// }

const MDCRipple = mdc.ripple.MDCRipple
for (const button of document.getElementsByClassName('mdc-button')) {
    new MDCRipple(button)
}

document.querySelector('#open').addEventListener('click', function () {
    chrome.storage.local.get('spreadsheet-id', function (result) {
        const id = result['spreadsheet-id']
        const url = `https://docs.google.com/spreadsheets/d/${id}`
        chrome.tabs.create({ url: url })
    })
})
document.querySelector('#docs').addEventListener('click', function () {
    chrome.tabs.create({
        url:
            'https://github.com/tytot/attendance-for-google-meet#usage',
    })
})
document.querySelector('#contact').addEventListener('click', function () {
    chrome.tabs.create({
        url:
            'mailto:tyleradit@gmail.com?subject=Regarding%20the%20Attendance%20for%20Google%20Meet%20Chrome%20Extension',
    })
})
