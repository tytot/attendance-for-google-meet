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
                chrome.storage.local.get(['spreadsheet-id', code], function (
                    result
                ) {
                    const id = result['spreadsheet-id']
                    const className = result[code].class
                    console.log('Meet code: ' + code)
                    if (id == undefined) {
                        createSpreadsheet(port, token, className, code)
                    } else {
                        updateSpreadsheet(port, token, className, code, id)
                    }
                    port.postMessage({ progress: 0 })
                })
            } else if (msg.data === 'rename') {
                chrome.storage.local.get('spreadsheet-id', function (result) {
                    const id = result['spreadsheet-id']
                    const oldClassName = msg.oldClassName
                    const newClassName = msg.newClassName

                    let requests = [
                        deleteSheetMetadata(oldClassName),
                    ]
                    getMetaByKey(oldClassName, token, id)
                        .then(function (meta) {
                            const sheetId = meta.location.sheetId
                            requests = requests.concat(
                                updateSheetProperties(
                                    newClassName,
                                    code,
                                    sheetId,
                                    'title'
                                )
                            )
                            return batchUpdate(token, requests, id, sheetId)
                        })
                        .then(function (data) {
                            console.log(
                                `Renamed sheet ${oldClassName} to ${newClassName}`
                            )
                            console.log(data)
                        })
                        .catch(function (error) {
                            console.log(error)
                        })
                })
            }
        })
    })
})

function createSpreadsheet(port, token, className, code) {
    const body = {
        properties: {
            title: 'Attendance for Google Meet',
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
    fetch('https://sheets.googleapis.com/v4/spreadsheets', init)
        .then((response) => response.json())
        .then(function (data) {
            port.postMessage({ progress: 0.3 })
            console.log(
                `Successfully created Attendance spreadsheet with id ${data.spreadsheetId}.`
            )
            chrome.storage.local.set({ 'spreadsheet-id': data.spreadsheetId })
            spreadsheetId = data.spreadsheetId

            requests = requests.concat(
                updateSheetProperties(className, code, 0, '*')
            )
            requests = requests.concat(createHeaders(0))
            return initializeCells(code, 0)
        })
        .then(function (reqs) {
            port.postMessage({ progress: 0.6 })
            requests = requests.concat(reqs)
            return batchUpdate(token, requests, spreadsheetId, 0)
        })
        .then(function (data) {
            port.postMessage({ done: true, progress: 1 })
            console.log('Initialize spreadsheet response:')
            console.log(data)
        })
        .catch(function (error) {
            port.postMessage({ done: true, error: error.message, progress: 0 })
        })
}

async function updateSpreadsheet(port, token, className, code, spreadsheetId) {
    let requests = []
    let sheetId = null,
        startRow = null
    console.log('Updating spreadsheet...')
    getMetaByKey(className, token, spreadsheetId)
        .then(async function (meta) {
            port.postMessage({ progress: 0.15 })
            if (meta == null) {
                const spreadsheet = await getSpreadsheet(token, spreadsheetId)
                const numSheets = spreadsheet.sheets.length
                sheetId = numSheets
                requests = requests.concat(
                    addSheet(className, code, sheetId)
                )
                requests = requests.concat(createHeaders(sheetId))
                console.log(
                    `Creating new sheet for class ${className}, ID ${sheetId}`
                )
                return getMetaByKey(code, token, spreadsheetId)
            } else {
                sheetId = meta.location.sheetId
                return getMetaByKey(code, token, spreadsheetId)
            }
        })
        .then(function (meta) {
            port.postMessage({ progress: 0.3 })
            if (meta == null) {
                startRow = 1
                return initializeCells(code, sheetId)
            }
            startRow = meta.location.dimensionRange.startIndex
            return updateCells(token, code, spreadsheetId, sheetId, startRow)
        })
        .then(function (reqs) {
            port.postMessage({ progress: 0.4 })
            requests = requests.concat(reqs)
            return batchUpdate(token, requests, spreadsheetId)
        })
        .then(function (data) {
            port.postMessage({ progress: 0.65 })
            console.log('Update spreadsheet response:')
            console.log(data)
            return collapseGroup(
                token,
                className,
                code,
                spreadsheetId,
                sheetId
            )
        })
        .then(function (reqs) {
            port.postMessage({ progress: 0.75 })
            if (reqs == null) {
                return Promise.resolve()
            }
            requests = reqs
            return batchUpdate(token, requests, spreadsheetId, sheetId)
        })
        .then(function (data) {
            port.postMessage({ done: true, progress: 1 })
            if (data) {
                console.log('Update metadata and groups response:')
                console.log(data)
            }
        })
        .catch(function (error) {
            port.postMessage({ done: true, error: error.message, progress: 0 })
        })
}
