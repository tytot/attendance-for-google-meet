chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        chrome.storage.sync.set({ 'auto-export': false })
    } else if (details.reason === 'update') {
        const pv = details.previousVersion
        if (
            pv === '1.0.3' ||
            pv === '1.0.2' ||
            pv === '1.0.1' ||
            pv === '1.0.0'
        ) {
            chrome.storage.local.get(null, function (data) {
                chrome.storage.sync.set(data)
                chrome.storage.local.clear()
            })
        }
    }
})

chrome.runtime.onMessage.addListener(function (message, callback) {
    if (message.data === 'instantiate') {
        chrome.tabs.executeScript({
            file: 'js/attendance.js',
        })
    } else if (message.data === 'open-url') {
        chrome.tabs.create({ url: message.url })
    }
})

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        const code = msg.code
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (msg.data === 'export') {
                chrome.storage.sync.get(['spreadsheet-id', code], function (
                    result
                ) {
                    if (msg.auto) {
                        port = null
                    } else {
                        port.postMessage({ progress: 0 })
                    }
                    const id = result['spreadsheet-id']
                    const className = result[code].class
                    console.log('Meet code: ' + code)
                    if (id == undefined) {
                        createSpreadsheet(token, className, code, port)
                    } else {
                        updateSpreadsheet(token, className, code, id, port)
                    }
                })
            } else if (msg.data === 'rename') {
                chrome.storage.sync.get('spreadsheet-id', async function (
                    result
                ) {
                    const id = result['spreadsheet-id']
                    const oldClassName = msg.oldClassName
                    const newClassName = msg.newClassName

                    let requests = [deleteSheetMetadata(oldClassName)]
                    try {
                        const meta = await getMetaByKey(oldClassName, token, id)
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
                        console.log(
                            `Renamed sheet ${oldClassName} to ${newClassName}`
                        )
                        console.log(data)
                    } catch (error) {
                        console.log(error)
                    }
                })
            } else if (msg.data === 'delete-meta') {
                chrome.storage.sync.get('spreadsheet-id', async function (
                    result
                ) {
                    const id = result['spreadsheet-id']
                    let requests = []
                    for (const code of msg.codes) {
                        requests.push(deleteCodeMetadata(code))
                    }
                    const data = await batchUpdate(token, requests, id)
                    console.log('Deleted metadata response:')
                    console.log(data)
                })
            }
        })
    })
})

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
    console.log('Creating new attendance spreadsheet...')

    try {
        const newSpreadsheet = await (
            await fetch('https://sheets.googleapis.com/v4/spreadsheets', init)
        ).json()
        if (port != null) {
            port.postMessage({ progress: 0.3 })
        }
        console.log(
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
        if (port != null) {
            port.postMessage({ progress: 0.6 })
        }
        requests = requests.concat(icReqs)
        const data = await batchUpdate(token, requests, spreadsheetId, 0)
        if (port != null) {
            port.postMessage({ done: true, progress: 1 })
        }
        console.log('Initialize spreadsheet response:')
        console.log(data)
    } catch (error) {
        if (port != null) {
            port.postMessage({
                done: true,
                error: error.message,
                progress: 0,
            })
        }
    }
}

async function updateSpreadsheet(token, className, code, spreadsheetId, port) {
    let requests = []
    console.log('Updating spreadsheet...')

    try {
        const classMeta = await getMetaByKey(className, token, spreadsheetId)
        if (port != null) {
            port.postMessage({ progress: 0.15 })
        }
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
            console.log(
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
        if (port != null) {
            port.postMessage({ progress: 0.3 })
        }
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
        if (port != null) {
            port.postMessage({ progress: 0.4 })
        }
        requests = requests.concat(icReqs)
        let data = await batchUpdate(token, requests, spreadsheetId, sheetId)
        if (port != null) {
            port.postMessage({ progress: 0.65 })
        }
        console.log('Update spreadsheet response:')
        console.log(data)
        const cgReqs = await collapseGroup(token, code, spreadsheetId, sheetId)
        if (port != null) {
            port.postMessage({ progress: 0.75 })
        }
        if (cgReqs) {
            data = await batchUpdate(token, cgReqs, spreadsheetId, sheetId)
            console.log('Update metadata and groups response:')
            console.log(data)
        }
        if (port != null) {
            port.postMessage({ done: true, progress: 1 })
        }
    } catch (error) {
        if (port != null) {
            port.postMessage({
                done: true,
                error: error.message,
                progress: 0,
            })
        }
    }
}
