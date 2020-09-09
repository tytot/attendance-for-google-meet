const MDCRipple = mdc.ripple.MDCRipple
for (const button of document.getElementsByClassName('mdc-button')) {
    new MDCRipple(button)
}
// const iconButtonRipple = new MDCRipple(document.querySelector('#lang'));
// iconButtonRipple.unbounded = true;
// const MDCMenu = mdc.menu.MDCMenu
// const menu = new MDCMenu(document.querySelector('.mdc-menu'))
// menu.setFixedPosition(true)
// document.querySelector('#lang').addEventListener('click', function () {
//     menu.open = true
// })

const MDCDialog = mdc.dialog.MDCDialog
const resetDialog = new MDCDialog(document.querySelector('#reset-dialog'))
const clearDialog = new MDCDialog(document.querySelector('#clear-dialog'))

const MDCSnackbar = mdc.snackbar.MDCSnackbar
const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'))

const MDCSwitch = mdc.switchControl.MDCSwitch
const switchControl = new MDCSwitch(document.querySelector('.mdc-switch'))
const openButton = document.querySelector('#open')

let autoExport = false
chrome.storage.sync.get(['auto-export', 'spreadsheet-id'], function (result) {
    if (result['auto-export']) {
        switchControl.checked = true
        autoExport = true
    }

    const id = result['spreadsheet-id']
    if (id == undefined) {
        openButton.disabled = true
    } else {
        openButton.addEventListener('click', function () {
            const url = `https://docs.google.com/spreadsheets/d/${id}`
            chrome.tabs.create({ url: url })
        })
    }
})

document.querySelector('#docs').addEventListener('click', function () {
    chrome.tabs.create({
        url: 'https://github.com/tytot/attendance-for-google-meet#usage',
    })
})
document.querySelector('#contact').addEventListener('click', function () {
    chrome.tabs.create({
        url:
            'mailto:tyleradit@gmail.com?subject=Regarding%20the%20Attendance%20for%20Google%20Meet%20Chrome%20Extension',
    })
})
document.querySelector('#auto-export').addEventListener('click', function () {
    if (switchControl.checked !== autoExport) {
        autoExport = switchControl.checked
        chrome.storage.sync.set({ 'auto-export': switchControl.checked })
    }
})

const moreOptions = document.querySelector('#more-options')
const expandButton = document.querySelector('#expand')
expandButton.addEventListener('click', function () {
    if (moreOptions.hidden) {
        moreOptions.hidden = false
        expandButton.querySelector('.mdc-button__label').innerHTML =
            'Hide Advanced'
    } else {
        moreOptions.hidden = true
        expandButton.querySelector('.mdc-button__label').innerHTML =
            'Show Advanced'
    }
})

document.querySelector('#reset').addEventListener('click', function () {
    resetDialog.open()
})
document.querySelector('#confirm-reset').addEventListener('click', function () {
    chrome.storage.sync.remove('spreadsheet-id', function () {
        snackbar.labelText = 'Successfully reset default spreadsheet.'
        snackbar.open()
        openButton.disabled = true
    })
})

document.querySelector('#clear').addEventListener('click', function () {
    clearDialog.open()
})
document.querySelector('#confirm-clear').addEventListener('click', function () {
    chrome.storage.sync.get(null, function (result) {
        for (const key in result) {
            if (key !== 'spreadsheet-id') {
                chrome.storage.sync.remove(key)
            }
        }
        snackbar.labelText = 'Successfully cleared storage.'
        snackbar.open()
    })
})
