const meetTabs = new Map()
const meetRegex = /https?:\/\/meet.google.com\/\w{3}-\w{4}-\w{3}/
const codeRegex = /\w{3}-\w{4}-\w{3}/

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
        console.log(tabId)
        chrome.storage.sync.get('auto-export', function (result) {
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

chrome.tabs.query(
    { url: '*://meet.google.com/**-**-**' },
    function (tabs) {
        for (const tab of tabs) {
            if (meetRegex.test(tab.url)) {
                const code = codeRegex.exec(tab.url)[0]
                meetTabs.set(tab.id, code)
            }
        }
    }
)

chrome.runtime.onInstalled.addListener(function (details) {
    chrome.storage.local.get(null, function (data) {
        if (details.reason === 'update') {
            const pv = details.previousVersion
            if (
                pv === '1.0.3' ||
                pv === '1.0.2' ||
                pv === '1.0.1' ||
                pv === '1.0.0'
            ) {
                chrome.storage.sync.set(data)
                chrome.storage.local.clear()
            }
        }
        if (!data.hasOwnProperty('auto-export')) {
            chrome.storage.sync.set({ 'auto-export': false })
        }
        if (!data.hasOwnProperty('show-popup')) {
            chrome.storage.sync.set({ 'show-popup': true })
        }
        if (!data.hasOwnProperty('reset-interval')) {
            chrome.storage.sync.set({ 'reset-interval': 12 })
        }
    })
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
    }
})

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (token == undefined) {
                postMessage(port, {
                    done: true,
                    error: 'The user did not approve access.',
                    progress: 0,
                })
            } else if (msg.data === 'export') {
                tryExport(token, msg.code, port)
            } else if (msg.data === 'rename') {
                const code = msg.code
                chrome.storage.sync.get(
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
                chrome.storage.sync.get(
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

function postMessage(port, message) {
    if (port) {
        port.postMessage(message)
    }
}

function tryExport(token, code, port, retry = false) {
    Utils.log('Attempting export...')
    chrome.storage.sync.get(['spreadsheet-id', code], async function (result) {
        postMessage(port, { progress: 0 })
        const id = result['spreadsheet-id']
        if (result[code].hasOwnProperty('class')) {
            const className = result[code].class
            Utils.log('Meet code: ' + code)
            if (id == undefined) {
                createSpreadsheet(token, className, code, port, retry)
            } else {
                updateSpreadsheet(token, className, code, id, port, retry)
            }
        } else {
            Utils.log('Cancelled export; there was no class selected.')
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

    try {
        const newSpreadsheet = await (
            await fetch('https://sheets.googleapis.com/v4/spreadsheets', init)
        ).json()
        if (newSpreadsheet.spreadsheetId == undefined) {
            throw newSpreadsheet.error
        }
        postMessage(port, { progress: 0.3 })
        Utils.log(
            `Successfully created Attendance spreadsheet with id ${newSpreadsheet.spreadsheetId}.`
        )
        chrome.storage.sync.set({
            'spreadsheet-id': newSpreadsheet.spreadsheetId,
        })
        spreadsheetId = newSpreadsheet.spreadsheetId
        requests = requests.concat(
            updateSheetProperties(className, code, 0, '*')
        )
        requests = requests.concat(createHeaders(0))
        const icReqs = await initializeCells(code, 0)
        postMessage(port, { progress: 0.6 })
        requests = requests.concat(icReqs)
        const data = await batchUpdate(token, requests, spreadsheetId, 0)
        postMessage(port, { done: true, progress: 1 })
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
            postMessage(port, {
                done: true,
                error: error.message,
                progress: 0,
            })
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

    try {
        const classMeta = await getMetaByKey(className, token, spreadsheetId)
        postMessage(port, { progress: 0.15 })
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
        postMessage(port, { progress: 0.3 })
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
        postMessage(port, { progress: 0.4 })
        requests = requests.concat(icReqs)
        let data = await batchUpdate(token, requests, spreadsheetId, sheetId)
        postMessage(port, { progress: 0.65 })
        Utils.log('Update spreadsheet response:')
        console.log(data)
        const cgReqs = await collapseGroup(token, code, spreadsheetId, sheetId)
        postMessage(port, { progress: 0.75 })
        if (cgReqs) {
            data = await batchUpdate(token, cgReqs, spreadsheetId, sheetId)
            Utils.log('Update metadata and groups response:')
            console.log(data)
        }
        postMessage(port, { done: true, progress: 1 })
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
            postMessage(port, {
                done: true,
                error: error.message,
                progress: 0,
            })
        }
    }
}
