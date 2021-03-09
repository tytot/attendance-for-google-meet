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
const exportSwitch = new MDCSwitch(
    document.querySelector('#auto-export .mdc-switch')
)
const popupSwitch = new MDCSwitch(
    document.querySelector('#show-popup .mdc-switch')
)

const MDCTextField = mdc.textField.MDCTextField
const intervalField = new MDCTextField(
    document.querySelector('.mdc-text-field')
)

document.getElementById('version').textContent = `Version ${
    chrome.runtime.getManifest().version
}`
const openButton = document.querySelector('#open')

let autoExport = false
let showPopup = false
let resetInterval = 12
chrome.storage.local.get(
    ['auto-export', 'show-popup', 'reset-interval', 'spreadsheet-id'],
    function (result) {
        if (result['auto-export']) {
            exportSwitch.checked = true
            autoExport = true
        }
        if (result['show-popup']) {
            popupSwitch.checked = true
            showPopup = true
        }
        if (result.hasOwnProperty('reset-interval')) {
            intervalField.value = result['reset-interval']
            resetInterval = result['reset-interval']
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
    }
)

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
    if (exportSwitch.checked !== autoExport) {
        autoExport = exportSwitch.checked
        chrome.storage.local.set({ 'auto-export': exportSwitch.checked })
    }
})
document.querySelector('#show-popup').addEventListener('click', function () {
    if (popupSwitch.checked !== showPopup) {
        showPopup = popupSwitch.checked
        chrome.storage.local.set({ 'show-popup': popupSwitch.checked })
    }
})
document
    .querySelector('#reset-interval')
    .addEventListener('input', function () {
        if (
            intervalField.value !== '' &&
            intervalField.value !== resetInterval
        ) {
            const tempInterval = parseFloat(intervalField.value)
            if (isNaN(tempInterval)) intervalField.value = resetInterval
            else {
                resetInterval = tempInterval
                chrome.storage.local.set({ 'reset-interval': resetInterval })
            }
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

const refreshButton = document.querySelector('#refresh')
refreshButton.addEventListener('click', function () {
    chrome.storage.local.get('last-token-refresh', function (result) {
        const unix = ~~(Date.now() / 1000)
        let valid = true
        if (result.hasOwnProperty('last-token-refresh')) {
            if (unix - result['last-token-refresh'] < 86400) {
                valid = false
            }
        }
        if (valid) {
            chrome.storage.local.set({ 'last-token-refresh': unix })
            refreshButton.disabled = true
            try {
                chrome.identity.getAuthToken(
                    { interactive: false },
                    function (token) {
                        chrome.identity.removeCachedAuthToken(
                            { token: token },
                            function () {
                                console.log(`Removed auth token ${token}.`)
                                snackbar.close()
                                snackbar.labelText =
                                    'Successfully refreshed auth token.'
                                snackbar.open()
                                refreshButton.disabled = false
                            }
                        )
                    }
                )
            } catch (error) {
                console.log(error)
                snackbar.close()
                snackbar.labelText =
                    'An error occurred while refreshing your auth token.'
                snackbar.open()
                refreshButton.disabled = false
            }
        } else {
            snackbar.close()
            snackbar.labelText =
                'Please wait until tomorrow to refresh your token again.'
            snackbar.open()
        }
    })
})

document.querySelector('#reset').addEventListener('click', function () {
    resetDialog.open()
})
document.querySelector('#confirm-reset').addEventListener('click', function () {
    chrome.storage.local.remove('spreadsheet-id', function () {
        snackbar.close()
        snackbar.labelText = 'Successfully unlinked spreadsheet.'
        snackbar.open()
        openButton.disabled = true
    })
})

document.querySelector('#clear').addEventListener('click', function () {
    clearDialog.open()
})
document.querySelector('#confirm-clear').addEventListener('click', function () {
    chrome.storage.local.get(null, function (result) {
        for (const key in result) {
            if (key !== 'spreadsheet-id') {
                chrome.storage.local.remove(key)
            }
        }
        chrome.storage.local.set({ 'reset-interval': 12 })
        snackbar.close()
        snackbar.labelText = 'Successfully cleared storage.'
        snackbar.open()
    })
})
