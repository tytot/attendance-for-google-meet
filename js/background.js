'use strict'

const meetTabs = new Map()
const meetRegex = /https?:\/\/meet.google.com\/\w{3}-\w{4}-\w{3}/
const codeRegex = /\w{3}-\w{4}-\w{3}/

const notifierMap = new Map()

class Notifier {
    constructor(context1, context2) {
        this.context1 = context1
        this.context2 = context2
        this.timestamp = Date.now()
        this.created = false
    }
    post(port, message) {
        try {
            port.postMessage(message)
        } catch (error) {
            if (message.progress === 0 || message.progress === 1) {
                const options = {
                    type: message.error ? 'basic' : 'progress',
                    title: 'Attendance for Google Meet™',
                    message: message.error
                        ? 'An error occurred when communicating with Google Sheets™.'
                        : message.progress === 1
                        ? 'Successfully exported to Google Sheets™!'
                        : 'Exporting to Google Sheets™...',
                    contextMessage:
                        message.error || `${this.context1}: ${this.context2}`,
                    iconUrl: '../img/icons/icon48.png',
                    priority: 2,
                }
                if (!message.error) {
                    options.progress = message.progress * 100
                    if (message.progress === 1) {
                        options.buttons = [
                            {
                                title: 'OPEN',
                            },
                        ]
                    }
                }
                const label = `a4gm-export-${this.context1}-${this.context2}-${this.timestamp}`
                if (!this.created) {
                    chrome.notifications.create(label, options)
                    this.created = true
                } else {
                    chrome.notifications.update(label, options)
                }
            }
        }
    }
}
chrome.notifications.onButtonClicked.addListener((id) => {
    if (id.startsWith('a4gm-export-')) {
        chrome.storage.local.get('spreadsheet-id', (result) => {
            const id = result['spreadsheet-id']
            const url = `https://docs.google.com/spreadsheets/d/${id}`
            chrome.tabs.create({ url: url })
        })
    }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.hasOwnProperty('url') && meetRegex.test(changeInfo.url)) {
        const code = codeRegex.exec(changeInfo.url)[0]
        meetTabs.set(tabId, code)
    }
})

chrome.tabs.onRemoved.addListener((tabId) => {
    if (meetTabs.has(tabId)) {
        const code = meetTabs.get(tabId)
        meetTabs.delete(tabId)
        chrome.storage.local.get('auto-export', (result) => {
            if (result['auto-export']) {
                chrome.identity.getAuthToken({ interactive: true }, (token) => {
                    if (!chrome.runtime.lastError) {
                        tryExport(token, code)
                    }
                })
            }
        })
    }
})

chrome.tabs.query({ url: '*://meet.google.com/**-**-**' }, (tabs) => {
    for (const tab of tabs) {
        if (meetRegex.test(tab.url)) {
            const code = codeRegex.exec(tab.url)[0]
            meetTabs.set(tab.id, code)
        }
    }
})

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        const pv = details.previousVersion
        if (pv === '1.0.3') {
            chrome.storage.local.get(null, (data) => {
                chrome.storage.sync.set(data)
                chrome.storage.local.clear()
            })
        } else if (a4gm.utils.collator.compare(pv, '1.2.14') >= 0) {
            if (pv === '1.2.14') {
                chrome.storage.sync.get(null, (data) => {
                    chrome.storage.local.set(data)
                    chrome.storage.sync.clear()
                })
            }
            chrome.storage.local.set({ 'updates-dismissed': false })
        }
    }
    chrome.storage.local.get(null, (data) => {
        if (!data.hasOwnProperty('auto-export')) {
            chrome.storage.local.set({ 'auto-export': false })
        }
        if (!data.hasOwnProperty('show-popup')) {
            chrome.storage.local.set({ 'show-popup': true })
        }
        if (!data.hasOwnProperty('presence-threshold')) {
            chrome.storage.local.set({ 'presence-threshold': 0 })
        }
        if (!data.hasOwnProperty('reset-interval')) {
            chrome.storage.local.set({ 'reset-interval': 12 })
        }
    })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.data === 'instantiate') {
        chrome.scripting.executeScript(
            {
                files: ['js/views.js'],
                target: {
                    tabId: sender.tab.id
                }
            },
            (result) => {
                sendResponse(result)
            }
        )
        return true
    } else if (message.data === 'open-url') {
        chrome.tabs.create({ url: message.url })
    } else if (message.data === 'check-active') {
        chrome.tabs.query({ active: true }, (tabs) => {
            if (tabs.some((tab) => tab.id === sender.tab.id)) {
                return sendResponse({ ready: true })
            }
            chrome.tabs.onActivated.addListener(function tabListener(
                activeInfo
            ) {
                if (activeInfo.tabId === sender.tab.id) {
                    chrome.tabs.onActivated.removeListener(tabListener)
                    sendResponse({ ready: true })
                }
            })
        })
        return true
    } else if (message.data === 'delete-tab') {
        meetTabs.delete(sender.tab.id)
    } else if (message.data === 'refresh-meets') {
        meetTabs.forEach((value, key) => {
            chrome.tabs.reload(key)
        })
    }
})

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((msg) => {
        authenticate()
            .then((token) => {
                if (msg.data === 'export') {
                    tryExport(token, msg.code, port)
                } else if (msg.data === 'rename') {
                    rename(token, msg.code, msg.oldClassName, msg.newClassName)
                } else if (msg.data === 'delete-meta') {
                    deleteMeta(token, msg.codes)
                }
            })
            .catch((error) => {
                new Notifier('Error', 'Failed to authenticate').post(port, {
                    done: true,
                    error: error.message,
                    progress: 0,
                })
                console.error(error)
            })
    })
})

function authenticate() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                resolve(token)
            }
        })
    })
}

function refreshToken(token, callback) {
    chrome.identity.removeCachedAuthToken({ token: token }, () => {
        a4gm.utils.log('Removed cached auth token.')
        chrome.identity.getAuthToken({ interactive: true }, callback)
    })
}

function rename(token, code, oldClassName, newClassName, retry = false) {
    chrome.storage.local.get('spreadsheet-id', async (result) => {
        a4gm.utils.log('Renaming class...')
        const id = result['spreadsheet-id']
        let requests = [deleteSheetMetadata(oldClassName)]
        try {
            const meta = await getMetaByKey(oldClassName, token, id)
            const sheetId = meta.location.sheetId
            requests = requests.concat(
                updateSheetProperties(newClassName, code, sheetId, 'title')
            )
            const data = await batchUpdate(token, requests, id, sheetId)
            a4gm.utils.log(`Renamed sheet ${oldClassName} to ${newClassName}`)
            console.log(data)
        } catch (error) {
            if (!retry && error.status === 401) {
                refreshToken(token, (newToken) => {
                    a4gm.utils.log('Retrying rename of class.')
                    rename(newToken, code, oldClassName, newClassName, true)
                })
            } else {
                new Notifier('Error', 'Failed to rename class').post(port, {
                    done: true,
                    error: error.message,
                    progress: 0,
                })
            }
            console.error(error)
        }
    })
}

function deleteMeta(token, codes, retry = false) {
    chrome.storage.local.get('spreadsheet-id', async (result) => {
        if (result.hasOwnProperty('spreadsheet-id')) {
            a4gm.utils.log('Deleting stale metadata...')
            const id = result['spreadsheet-id']
            let requests = []
            for (const code of codes) {
                requests.push(deleteCodeMetadata(code))
            }
            try {
                const data = await batchUpdate(token, requests, id)
                a4gm.utils.log('Delete metadata response:')
                console.log(data)
            } catch (error) {
                if (!retry && error.status === 401) {
                    refreshToken(token, (newToken) => {
                        a4gm.utils.log('Retrying deletion of stale metadata.')
                        deleteMeta(newToken, codes, true)
                    })
                } else {
                    new Notifier('Error', 'Failed to delete metadata').post(
                        port,
                        {
                            done: true,
                            error: error.message,
                            progress: 0,
                        }
                    )
                }
                console.error(error)
            }
        }
    })
}

function tryExport(token, code, port, retry = false) {
    chrome.storage.local.get(['spreadsheet-id', code], async (result) => {
        const id = result['spreadsheet-id']
        if (result[code].hasOwnProperty('class')) {
            const className = result[code].class
            if (retry || !notifierMap.has(`${className}-${code}`)) {
                a4gm.utils.log('Attempting export...')
                a4gm.utils.log('Meet code: ' + code)
                try {
                    if (id == undefined) {
                        createSpreadsheet(token, className, code, port)
                    } else {
                        updateSpreadsheet(token, className, code, id, port)
                    }
                } catch (error) {
                    if (!retry && error.status === 401) {
                        refreshToken(token, (newToken) => {
                            a4gm.utils.log('Retrying export.')
                            tryExport(newToken, code, port, true)
                        })
                    } else {
                        const notifier = notifierMap.get(`${className}-${code}`)
                        notifier.post(port, {
                            done: true,
                            error: error.message,
                            progress: 0,
                        })
                        notifierMap.delete(notifierKey)
                    }
                    console.error(error)
                }
            }
        }
    })
}

async function createSpreadsheet(token, className, code, port) {
    const body = {
        properties: {
            title: 'Attendance for Google Meet™',
            spreadsheetTheme: getSpreadsheetTheme(),
        },
    }
    const init = {
        method: 'POST',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }
    let spreadsheetId = null
    let requests = []
    a4gm.utils.log('Creating new attendance spreadsheet...')

    const notifierKey = `${className}-${code}`
    if (!notifierMap.has(notifierKey)) {
        notifierMap.set(notifierKey, new Notifier(className, code))
    }
    const notifier = notifierMap.get(notifierKey)
    notifier.post(port, { progress: 0 })
    const newSpreadsheet = await (
        await fetch('https://sheets.googleapis.com/v4/spreadsheets', init)
    ).json()
    if (newSpreadsheet.spreadsheetId == undefined) {
        throw newSpreadsheet.error
    }
    notifier.post(port, { progress: 0.3 })
    a4gm.utils.log(
        `Successfully created Attendance spreadsheet with id ${newSpreadsheet.spreadsheetId}.`
    )
    chrome.storage.local.set({
        'spreadsheet-id': newSpreadsheet.spreadsheetId,
    })
    spreadsheetId = newSpreadsheet.spreadsheetId
    requests = requests.concat(updateSheetProperties(className, code, 0, '*'))
    requests = requests.concat(createHeaders(0))
    const icReqs = await initializeCells(code, 0)
    notifier.post(port, { progress: 0.6 })
    requests = requests.concat(icReqs)
    const data = await batchUpdate(token, requests, spreadsheetId, 0)
    notifier.post(port, { done: true, progress: 1 })
    notifierMap.delete(notifierKey)
    a4gm.utils.log('Initialize spreadsheet response:')
    console.log(data)
}

async function updateSpreadsheet(token, className, code, spreadsheetId, port) {
    let requests = []
    a4gm.utils.log('Updating spreadsheet...')

    const notifierKey = `${className}-${code}`
    if (!notifierMap.has(notifierKey)) {
        notifierMap.set(notifierKey, new Notifier(className, code))
    }
    const notifier = notifierMap.get(notifierKey)
    notifier.post(port, { progress: 0 })
    const classMeta = await getMetaByKey(className, token, spreadsheetId)
    notifier.post(port, { progress: 0.15 })

    let sheetId
    if (classMeta == null) {
        const spreadsheet = await getSpreadsheet(token, spreadsheetId)
        sheetId =
            spreadsheet.sheets.reduce(
                (acc, sheet) => Math.max(acc, sheet.properties.sheetId),
                0
            ) + 1
        requests = requests.concat(addSheet(className, code, sheetId))
        requests = requests.concat(createHeaders(sheetId))
        a4gm.utils.log(`Creating new sheet for class ${className}, ID ${sheetId}`)
    } else {
        sheetId = classMeta.location.sheetId
    }
    const codeMeta = await getMetaByKey(
        `${code}§${sheetId}`,
        token,
        spreadsheetId
    )
    notifier.post(port, { progress: 0.3 })
    const startRow =
        codeMeta == null ? 1 : codeMeta.location.dimensionRange.startIndex
    const icReqs =
        codeMeta == null
            ? await initializeCells(code, sheetId)
            : await updateCells(token, code, spreadsheetId, sheetId, startRow)
    notifier.post(port, { progress: 0.4 })
    requests = requests.concat(icReqs)
    let data = await batchUpdate(token, requests, spreadsheetId, sheetId)
    notifier.post(port, { progress: 0.65 })
    a4gm.utils.log('Update spreadsheet response:')
    console.log(data)
    const cgReqs = await collapseGroup(token, code, spreadsheetId, sheetId)
    notifier.post(port, { progress: 0.75 })
    if (cgReqs) {
        data = await batchUpdate(token, cgReqs, spreadsheetId, sheetId)
        a4gm.utils.log('Update metadata and groups response:')
        console.log(data)
    }
    notifier.post(port, { done: true, progress: 1 })
    notifierMap.delete(notifierKey)
}
