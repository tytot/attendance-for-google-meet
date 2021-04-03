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
                        ? 'An error occurred when exporting to Google Sheets™.'
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
                if (!this.created) {
                    chrome.notifications.create(
                        `a4gm-export-${this.context1}-${this.context2}-${this.timestamp}`,
                        options
                    )
                    this.created = true
                } else {
                    chrome.notifications.update(
                        `a4gm-export-${this.context1}-${this.context2}-${this.timestamp}`,
                        options
                    )
                }
            }
        }
    }
}
chrome.notifications.onButtonClicked.addListener((id) => {
    if (id.startsWith('a4gm-export-')) {
        chrome.storage.local.get('spreadsheet-id', function (result) {
            const id = result['spreadsheet-id']
            const url = `https://docs.google.com/spreadsheets/d/${id}`
            chrome.tabs.create({ url: url })
        })
    }
})

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.hasOwnProperty('url') && meetRegex.test(changeInfo.url)) {
        const code = codeRegex.exec(changeInfo.url)[0]
        meetTabs.set(tabId, code)
    }
})

chrome.tabs.onRemoved.addListener(function (tabId) {
    if (meetTabs.has(tabId)) {
        const code = meetTabs.get(tabId)
        meetTabs.delete(tabId)
        chrome.storage.local.get('auto-export', function (result) {
            if (result['auto-export']) {
                chrome.identity.getAuthToken(
                    { interactive: true },
                    function (token) {
                        if (token) {
                            tryExport(token, code)
                        }
                    }
                )
            }
        })
    }
})

chrome.tabs.query({ url: '*://meet.google.com/**-**-**' }, function (tabs) {
    for (const tab of tabs) {
        if (meetRegex.test(tab.url)) {
            const code = codeRegex.exec(tab.url)[0]
            meetTabs.set(tab.id, code)
        }
    }
})

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'update') {
        const pv = details.previousVersion
        if (pv === '1.0.3') {
            chrome.storage.local.get(null, function (data) {
                chrome.storage.sync.set(data)
                chrome.storage.local.clear()
            })
        } else if (pv.localeCompare('1.2.14') >= 0) {
            if (pv === '1.2.14') {
                chrome.storage.sync.get(null, function (data) {
                    chrome.storage.local.set(data)
                    chrome.storage.sync.clear()
                })
            }
            chrome.storage.local.set({ 'updates-dismissed': false })
        }
    } else if (details.reason === 'install') {
        chrome.storage.local.get(null, function (data) {
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
    }
})

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.data === 'instantiate') {
        chrome.tabs.executeScript(
            {
                file: 'js/attendance.js',
            },
            function (result) {
                sendResponse(result)
            }
        )
        return true
    } else if (message.data === 'open-url') {
        chrome.tabs.create({ url: message.url })
    } else if (message.data === 'check-active') {
        chrome.tabs.query({ active: true }, function (tabs) {
            let ready = false
            for (const tab of tabs) {
                if (tab.id === sender.tab.id) {
                    sendResponse({ ready: true })
                    ready = true
                }
            }
            if (!ready) {
                chrome.tabs.onActivated.addListener(function tabListener(
                    activeInfo
                ) {
                    if (activeInfo.tabId === sender.tab.id) {
                        chrome.tabs.onActivated.removeListener(tabListener)
                        sendResponse({ ready: true })
                    }
                })
            }
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

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (token == undefined) {
                new Notifier('Error', 'Authorization failure').post(port, {
                    done: true,
                    error: 'The user did not approve access.',
                    progress: 0,
                })
            } else if (msg.data === 'export') {
                tryExport(token, msg.code, port)
            } else if (msg.data === 'rename') {
                const code = msg.code
                chrome.storage.local.get(
                    'spreadsheet-id',
                    async function (result) {
                        const id = result['spreadsheet-id']
                        const oldClassName = msg.oldClassName
                        const newClassName = msg.newClassName

                        let requests = [deleteSheetMetadata(oldClassName)]
                        try {
                            const meta = await getMetaByKey(
                                oldClassName,
                                token,
                                id
                            )
                            const sheetId = meta.location.sheetId
                            requests = requests.concat(
                                updateSheetProperties(
                                    newClassName,
                                    code,
                                    sheetId,
                                    'title'
                                )
                            )
                            const data = await batchUpdate(
                                token,
                                requests,
                                id,
                                sheetId
                            )
                            Utils.log(
                                `Renamed sheet ${oldClassName} to ${newClassName}`
                            )
                            console.log(data)
                        } catch (error) {
                            console.log(error)
                        }
                    }
                )
            } else if (msg.data === 'delete-meta') {
                chrome.storage.local.get(
                    'spreadsheet-id',
                    async function (result) {
                        if (result.hasOwnProperty('spreadsheet-id')) {
                            const id = result['spreadsheet-id']
                            let requests = []
                            for (const code of msg.codes) {
                                requests.push(deleteCodeMetadata(code))
                            }
                            const data = await batchUpdate(token, requests, id)
                            Utils.log('Delete metadata response:')
                            console.log(data)
                        }
                    }
                )
            }
        })
    })
})

function tryExport(token, code, port, retry = false) {
    chrome.storage.local.get(['spreadsheet-id', code], async function (result) {
        const id = result['spreadsheet-id']
        if (result[code].hasOwnProperty('class')) {
            const className = result[code].class
            if (retry || !notifierMap.has(`${className}-${code}`)) {
                Utils.log('Attempting export...')
                Utils.log('Meet code: ' + code)
                if (id == undefined) {
                    createSpreadsheet(token, className, code, port, retry)
                } else {
                    updateSpreadsheet(token, className, code, id, port, retry)
                }
            }
        }
    })
}

async function createSpreadsheet(token, className, code, port, retry) {
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
    Utils.log('Creating new attendance spreadsheet...')

    const notifierKey = `${className}-${code}`
    if (!notifierMap.has(notifierKey)) {
        notifierMap.set(notifierKey, new Notifier(className, code))
    }
    const notifier = notifierMap.get(notifierKey)
    try {
        notifier.post(port, { progress: 0 })
        const newSpreadsheet = await (
            await fetch('https://sheets.googleapis.com/v4/spreadsheets', init)
        ).json()
        if (newSpreadsheet.spreadsheetId == undefined) {
            throw newSpreadsheet.error
        }
        notifier.post(port, { progress: 0.3 })
        Utils.log(
            `Successfully created Attendance spreadsheet with id ${newSpreadsheet.spreadsheetId}.`
        )
        chrome.storage.local.set({
            'spreadsheet-id': newSpreadsheet.spreadsheetId,
        })
        spreadsheetId = newSpreadsheet.spreadsheetId
        requests = requests.concat(
            updateSheetProperties(className, code, 0, '*')
        )
        requests = requests.concat(createHeaders(0))
        const icReqs = await initializeCells(code, 0)
        notifier.post(port, { progress: 0.6 })
        requests = requests.concat(icReqs)
        const data = await batchUpdate(token, requests, spreadsheetId, 0)
        notifier.post(port, { done: true, progress: 1 })
        notifierMap.delete(notifierKey)
        Utils.log('Initialize spreadsheet response:')
        console.log(data)
    } catch (error) {
        if (!retry && error.code === 401) {
            chrome.identity.removeCachedAuthToken(
                { token: token },
                function () {
                    Utils.log('Removed cached auth token.')
                    Utils.log('Retrying export...')
                    chrome.identity.getAuthToken(
                        { interactive: true },
                        function (newToken) {
                            tryExport(newToken, code, port, true)
                        }
                    )
                }
            )
        } else {
            notifier.post(port, {
                done: true,
                error: error.message,
                progress: 0,
            })
            notifierMap.delete(notifierKey)
        }
    }
}

async function updateSpreadsheet(
    token,
    className,
    code,
    spreadsheetId,
    port,
    retry = false
) {
    let requests = []
    Utils.log('Updating spreadsheet...')

    const notifierKey = `${className}-${code}`
    if (!notifierMap.has(notifierKey)) {
        notifierMap.set(notifierKey, new Notifier(className, code))
    }
    const notifier = notifierMap.get(notifierKey)
    try {
        notifier.post(port, { progress: 0 })
        const classMeta = await getMetaByKey(className, token, spreadsheetId)
        notifier.post(port, { progress: 0.15 })
        if (classMeta == null) {
            const spreadsheet = await getSpreadsheet(token, spreadsheetId)
            var sheetId = 0
            for (const sheet of spreadsheet.sheets) {
                newSheetId = sheet.properties.sheetId
                if (newSheetId > sheetId) {
                    sheetId = newSheetId
                }
            }
            sheetId++
            requests = requests.concat(addSheet(className, code, sheetId))
            requests = requests.concat(createHeaders(sheetId))
            Utils.log(
                `Creating new sheet for class ${className}, ID ${sheetId}`
            )
        } else {
            sheetId = classMeta.location.sheetId
        }
        const codeMeta = await getMetaByKey(
            `${code}§${sheetId}`,
            token,
            spreadsheetId
        )
        notifier.post(port, { progress: 0.3 })
        if (codeMeta == null) {
            var startRow = 1
            var icReqs = await initializeCells(code, sheetId)
        } else {
            startRow = codeMeta.location.dimensionRange.startIndex
            icReqs = await updateCells(
                token,
                code,
                spreadsheetId,
                sheetId,
                startRow
            )
        }
        notifier.post(port, { progress: 0.4 })
        requests = requests.concat(icReqs)
        let data = await batchUpdate(token, requests, spreadsheetId, sheetId)
        notifier.post(port, { progress: 0.65 })
        Utils.log('Update spreadsheet response:')
        console.log(data)
        const cgReqs = await collapseGroup(token, code, spreadsheetId, sheetId)
        notifier.post(port, { progress: 0.75 })
        if (cgReqs) {
            data = await batchUpdate(token, cgReqs, spreadsheetId, sheetId)
            Utils.log('Update metadata and groups response:')
            console.log(data)
        }
        notifier.post(port, { done: true, progress: 1 })
        notifierMap.delete(notifierKey)
    } catch (error) {
        if (!retry && error.status === 401) {
            chrome.identity.removeCachedAuthToken(
                { token: token },
                function () {
                    Utils.log('Removed cached auth token.')
                    Utils.log('Retrying export...')
                    chrome.identity.getAuthToken(
                        { interactive: true },
                        function (newToken) {
                            tryExport(newToken, code, port, true)
                        }
                    )
                }
            )
        } else {
            notifier.post(port, {
                done: true,
                error: error.message,
                progress: 0,
            })
            notifierMap.delete(notifierKey)
        }
    }
}
