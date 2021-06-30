'use strict'
{
    const MDCRipple = mdc.ripple.MDCRipple
    for (const button of document.getElementsByClassName('mdc-button')) {
        MDCRipple.attachTo(button)
    }
    const MDCIconButtonToggle = mdc.iconButton.MDCIconButtonToggle

    const MDCDialog = mdc.dialog.MDCDialog
    const resetDialog = new MDCDialog(document.getElementById('reset-dialog'))
    const clearDialog = new MDCDialog(document.getElementById('clear-dialog'))

    const MDCSnackbar = mdc.snackbar.MDCSnackbar
    const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'))

    const MDCSwitch = mdc.switchControl.MDCSwitch
    const exportSwitch = new MDCSwitch(
        document.querySelector('#auto-export .mdc-switch')
    )
    // const popupSwitch = new MDCSwitch(
    //     document.querySelector('#show-popup .mdc-switch')
    // )

    const MDCTextField = mdc.textField.MDCTextField
    const thresholdField = new MDCTextField(
        document.querySelector('#presence-threshold .mdc-text-field')
    )
    const intervalField = new MDCTextField(
        document.querySelector('#reset-interval .mdc-text-field')
    )

    document.getElementById('version').textContent = `Version ${
        chrome.runtime.getManifest().version
    }`
    const openButton = document.getElementById('open')

    let presenceThreshold = 0
    let resetInterval = 12
    chrome.storage.local.get(
        [
            'auto-export',
            // 'show-popup',
            'presence-threshold',
            'reset-interval',
            'spreadsheet-id',
        ],
        (result) => {
            if (result.hasOwnProperty('auto-export')) {
                exportSwitch.checked = result['auto-export']
            } else {
                exportSwitch.checked = false
                chrome.storage.local.set({ 'auto-export': false })
            }
            // if (result.hasOwnProperty('show-popup')) {
            //     popupSwitch.checked = result['show-popup']
            // } else {
            //     popupSwitch.checked = true
            //     chrome.storage.local.set({ 'show-popup': true })
            // }
            if (result.hasOwnProperty('presence-threshold')) {
                thresholdField.value = result['presence-threshold']
                presenceThreshold = result['presence-threshold']
            } else {
                thresholdField.value = 0
                chrome.storage.local.set({ 'presence-threshold': 0 })
            }
            if (result.hasOwnProperty('reset-interval')) {
                intervalField.value = result['reset-interval']
                resetInterval = result['reset-interval']
            } else {
                intervalField.value = 12
                chrome.storage.local.set({ 'reset-interval': 12 })
            }

            const id = result['spreadsheet-id']
            if (id == undefined) {
                openButton.disabled = true
            } else {
                openButton.addEventListener('click', () => {
                    const url = `https://docs.google.com/spreadsheets/d/${id}`
                    chrome.tabs.create({ url: url })
                })
            }
        }
    )

    document.getElementById('docs').addEventListener('click', () => {
        chrome.tabs.create({
            url: 'https://github.com/tytot/attendance-for-google-meet#usage',
        })
    })
    document.getElementById('contact').addEventListener('click', () => {
        chrome.tabs.create({
            url:
                'mailto:tyleradit@gmail.com?subject=Regarding%20the%20Attendance%20for%20Google%20Meet%20Chrome%20Extension',
        })
    })
    for (const butt of document.getElementsByClassName('help')) {
        const iconToggle = new MDCIconButtonToggle(butt)
        iconToggle.listen('MDCIconButtonToggle:change', (event) => {
            const description = butt.parentElement.querySelector('.description')
            if (event.detail.isOn) {
                description.classList.remove('collapsed')
            } else {
                description.classList.add('collapsed')
            }
        })
    }
    document.getElementById('auto-export').addEventListener('click', () => {
        chrome.storage.local.set({ 'auto-export': exportSwitch.checked })
    })
    // document.getElementById('show-popup').addEventListener('click', () => {
    //     chrome.storage.local.set({ 'show-popup': popupSwitch.checked })
    // })
    document
        .getElementById('presence-threshold')
        .addEventListener('input', () => {
            if (
                thresholdField.value !== '' &&
                thresholdField.value !== presenceThreshold
            ) {
                const tempThreshold = parseFloat(thresholdField.value)
                if (isNaN(tempThreshold))
                    thresholdField.value = presenceThreshold
                else {
                    presenceThreshold = tempThreshold
                    chrome.storage.local.set({
                        'presence-threshold': presenceThreshold,
                    })
                }
            }
        })
    document.getElementById('reset-interval').addEventListener('input', () => {
        if (
            intervalField.value !== '' &&
            intervalField.value !== resetInterval
        ) {
            const tempInterval = parseFloat(intervalField.value)
            if (isNaN(tempInterval)) intervalField.value = resetInterval
            else {
                resetInterval = tempInterval
                chrome.storage.local.set({
                    'reset-interval': resetInterval,
                })
            }
        }
    })

    const moreOptions = document.getElementById('more-options')
    const expandButton = document.getElementById('expand')
    expandButton.addEventListener('click', () => {
        if (moreOptions.classList.contains('collapsed')) {
            moreOptions.classList.remove('collapsed')
            expandButton.querySelector('.mdc-button__label').innerHTML =
                'Hide Advanced'
        } else {
            moreOptions.classList.add('collapsed')
            expandButton.querySelector('.mdc-button__label').innerHTML =
                'Show Advanced'
        }
    })

    const resetAuthButton = document.getElementById('reset-auth')
    resetAuthButton.addEventListener('click', () => {
        resetAuthButton.disabled = true
        chrome.identity.clearAllCachedAuthTokens(() => {
            snackbar.close()
            snackbar.labelText =
                'Successfully reset authentication flow.'
            snackbar.open()
            resetAuthButton.disabled = false
        })
    })

    document.getElementById('reset').addEventListener('click', () => {
        resetDialog.open()
    })
    document.getElementById('confirm-reset').addEventListener('click', () => {
        chrome.storage.local.remove('spreadsheet-id', () => {
            snackbar.close()
            snackbar.labelText = 'Successfully unlinked spreadsheet.'
            snackbar.open()
            openButton.disabled = true
        })
    })

    document.getElementById('clear').addEventListener('click', () => {
        clearDialog.open()
    })
    document.getElementById('confirm-clear').addEventListener('click', () => {
        chrome.storage.local.get(null, (result) => {
            for (const key in result) {
                if (key !== 'spreadsheet-id') {
                    chrome.storage.local.remove(key)
                }
            }
            exportSwitch.checked = false
            // popupSwitch.checked = true
            thresholdField.value = 0
            intervalField.value = 12
            chrome.storage.local.set({ 'auto-export': false })
            // chrome.storage.local.set({ 'show-popup': true })
            chrome.storage.local.set({ 'presence-threshold': 0 })
            chrome.storage.local.set({ 'reset-interval': 12 })

            snackbar.close()
            snackbar.labelText = 'Successfully cleared storage.'
            snackbar.open()

            chrome.runtime.sendMessage({
                data: 'refresh-meets',
            })
        })
    })
}
