function createUpdateSheetPropertiesRequest(className, code, sheetId) {
    let requests = [
        {
            updateSheetProperties: {
                properties: {
                    sheetId: sheetId,
                    title: className,
                    gridProperties: {
                        rowCount: 2,
                        columnCount: 7,
                        frozenRowCount: 1,
                    },
                },
                fields: '*',
            },
        },
    ]
    requests.push(createSheetMetadataRequest(className, code, sheetId))
    return requests
}

function createAddSheetRequest(className, code, sheetId) {
    let requests = [
        {
            addSheet: {
                properties: {
                    sheetId: sheetId,
                    title: className,
                    gridProperties: {
                        rowCount: 2,
                        columnCount: 7,
                        frozenRowCount: 1,
                    },
                },
            },
        },
    ]
    requests.push(createSheetMetadataRequest(className, code, sheetId))
    return requests
}

function createSheetMetadataRequest(className, code, sheetId) {
    const request = {
        createDeveloperMetadata: {
            developerMetadata: {
                metadataId: hashCode(className),
                metadataKey: className,
                metadataValue: code,
                location: {
                    sheetId: sheetId,
                },
                visibility: 'DOCUMENT',
            },
        },
    }
    return request
}

function createHeadersRequest(sheetId) {
    const color = {
        red: 0.75,
        green: 0.75,
        blue: 0.75,
        alpha: 1,
    }

    const requests = [
        {
            updateCells: {
                rows: [
                    {
                        values: [
                            {
                                userEnteredValue: {
                                    stringValue: 'Last Name',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'LEFT',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note: "The student's last name.",
                            },
                            {
                                userEnteredValue: {
                                    stringValue: 'First Name',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'LEFT',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note: "The student's first name.",
                            },
                            {
                                userEnteredValue: {
                                    stringValue: 'Present',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'CENTER',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note:
                                    'Whether or not the student appeared in the meeting.',
                            },
                            {
                                userEnteredValue: {
                                    stringValue: 'Time In',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'RIGHT',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note:
                                    'When the student first joined the meeting, or empty if the student never joined.',
                            },
                            {
                                userEnteredValue: {
                                    stringValue: 'Time Out',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'RIGHT',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note:
                                    'When the student left the meeting, or empty if the student is in the meeting.',
                            },
                            {
                                userEnteredValue: {
                                    stringValue: '# of Joins',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'RIGHT',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note:
                                    'How many times the student joined the meeting.',
                            },
                            {
                                userEnteredValue: {
                                    stringValue: 'Mins. Present',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'RIGHT',
                                    textFormat: {
                                        bold: true,
                                    },
                                },
                                note:
                                    'The cumulative number of minutes that the student was present in the meeting.',
                            },
                        ],
                    },
                    {
                        values: [
                            {
                                userEnteredValue: {
                                    stringValue: 'Generated by the Attendance for Google Meet extension.',
                                },
                                userEnteredFormat: {
                                    horizontalAlignment: 'CENTER',
                                    textFormat: {
                                        italic: true,
                                    },
                                },
                            },
                        ],
                    },
                ],
                fields: '*',
                start: {
                    sheetId: sheetId,
                    rowIndex: 0,
                    columnIndex: 0,
                },
            },
        },
        {
            mergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 7,
                },
                mergeType: 'MERGE_ALL',
            },
        },
        {
            updateBorders: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 7,
                },
                top: {
                    style: 'SOLID',
                    color: color,
                },
                bottom: {
                    style: 'SOLID',
                    color: color,
                },
                left: {
                    style: 'DOUBLE',
                    color: color,
                },
                right: {
                    style: 'DOUBLE',
                    color: color,
                },
                innerVertical: {
                    style: 'SOLID',
                    color: color,
                },
            },
        },
        {
            updateBorders: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 7,
                },
                top: {
                    style: 'DOUBLE',
                    color: color,
                },
            },
        },
    ]
    return requests
}

function createInitializeCellsRequest(code, sheetId) {
    sheetId = parseInt(sheetId)
    const color = {
        red: 0.75,
        green: 0.75,
        blue: 0.75,
        alpha: 1,
    }

    return new Promise((resolve) => {
        generateAttendanceRows(code).then(function (rows) {
            let requests = [
                {
                    insertDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: 1,
                            endIndex: 1 + rows.length,
                        },
                        inheritFromBefore: false,
                    },
                },
                {
                    updateCells: {
                        rows: rows,
                        fields: '*',
                        start: {
                            sheetId: sheetId,
                            rowIndex: 1,
                            columnIndex: 0,
                        },
                    },
                },
                {
                    addDimensionGroup: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: 2,
                            endIndex: 1 + rows.length,
                        },
                    },
                },
                {
                    updateDimensionGroup: {
                        dimensionGroup: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: 2,
                                endIndex: 1 + rows.length,
                            },
                            depth: 1,
                            collapsed: false,
                        },
                        fields: 'collapsed',
                    },
                },
                {
                    mergeCells: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 1,
                            endRowIndex: 2,
                            startColumnIndex: 0,
                            endColumnIndex: 7,
                        },
                        mergeType: 'MERGE_ALL',
                    },
                },
                {
                    createDeveloperMetadata: {
                        developerMetadata: {
                            metadataId: hashCode(code),
                            metadataKey: code,
                            metadataValue: rows.length.toString(),
                            location: {
                                dimensionRange: {
                                    sheetId: sheetId,
                                    dimension: 'ROWS',
                                    startIndex: 1,
                                    endIndex: 2,
                                },
                            },
                            visibility: 'DOCUMENT',
                        },
                    },
                },
            ]
            requests = requests.concat(
                createBordersRequest(sheetId, 1, rows.length, color)
            )
            resolve(requests)
        })
    })
}

function createUpdateCellsRequest(code, sheetId, startRow) {
    sheetId = parseInt(sheetId)
    const color = {
        red: 0.75,
        green: 0.75,
        blue: 0.75,
        alpha: 1,
    }

    return new Promise((resolve) => {
        generateAttendanceRows(code).then(function (rows) {
            let requests = [
                {
                    updateCells: {
                        rows: rows,
                        fields: '*',
                        start: {
                            sheetId: sheetId,
                            rowIndex: startRow,
                            columnIndex: 0,
                        },
                    },
                },
                {
                    updateDimensionGroup: {
                        dimensionGroup: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: startRow + 1,
                                endIndex: startRow + rows.length,
                            },
                            depth: 1,
                            collapsed: false,
                        },
                        fields: 'collapsed',
                    },
                },
            ]
            requests = requests.concat(
                createBordersRequest(sheetId, startRow, rows.length, color)
            )
            resolve(requests)
        })
    })
}

function createBordersRequest(sheetId, startRow, numRows, color) {
    const requests = [
        {
            updateBorders: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: startRow,
                    endRowIndex: startRow + numRows,
                    startColumnIndex: 0,
                    endColumnIndex: 7,
                },
                top: {
                    style: 'DOUBLE',
                    color: color,
                },
                bottom: {
                    style: 'DOUBLE',
                    color: color,
                },
                left: {
                    style: 'DOUBLE',
                    color: color,
                },
                right: {
                    style: 'DOUBLE',
                    color: color,
                },
            },
        },
        {
            updateBorders: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: startRow,
                    endRowIndex: startRow + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 7,
                },
                bottom: {
                    style: 'SOLID',
                    color: color,
                },
            },
        },
    ]
    return requests
}

function createResizeRequest(sheetId) {
    const request = {
        autoResizeDimensions: {
            dimensions: {
                sheetId: sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 7,
            },
        },
    }
    return request
}

function createGroupRequest(token, className, code, spreadsheetId, sheetId) {
    return new Promise((resolve) => {
        getMetaByKey(className, token, spreadsheetId).then(function (meta) {
            const activeCode = meta.metadataValue
            if (code !== activeCode) {
                getMetaByKey(activeCode, token, spreadsheetId).then(function (
                    meta
                ) {
                    const numRows = parseInt(meta.metadataValue)
                    const requests = [
                        {
                            updateDeveloperMetadata: {
                                dataFilters: [
                                    {
                                        developerMetadataLookup: {
                                            metadataKey: className,
                                        },
                                    },
                                ],
                                developerMetadata: {
                                    metadataKey: className,
                                    metadataValue: code,
                                    visibility: 'DOCUMENT',
                                },
                                fields: 'metadataValue',
                            },
                        },
                        {
                            updateDimensionGroup: {
                                dimensionGroup: {
                                    range: {
                                        sheetId: sheetId,
                                        dimension: 'ROWS',
                                        startIndex:
                                            meta.location.dimensionRange
                                                .startIndex + 1,
                                        endIndex:
                                            meta.location.dimensionRange
                                                .startIndex + numRows,
                                    },
                                    depth: 1,
                                    collapsed: true,
                                },
                                fields: 'collapsed',
                            },
                        },
                    ]
                    resolve(requests)
                })
            } else {
                resolve(null)
            }
        })
    })
}

function generateAttendanceRows(code) {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, function (result) {
            const startUnix = result[code]['start-timestamp']
            const unix = ~~(Date.now() / 1000)
            const roster = result.rosters[result[code].class]
            const rawData = result[code].attendance

            const dts = dateTimeString(startUnix, unix)
            let rowData = [
                {
                    values: [
                        {
                            userEnteredValue: {
                                stringValue: `${dts} (${code})`,
                            },
                            userEnteredFormat: {
                                horizontalAlignment: 'CENTER',
                                backgroundColor: {
                                    red: 0.95,
                                    green: 0.95,
                                    blue: 0.95,
                                    alpha: 1,
                                },
                            },
                            textFormatRuns: [
                                {
                                    startIndex: 0,
                                    format: {
                                        bold: true,
                                    },
                                },
                                {
                                    startIndex: dts.length + 2,
                                    format: {
                                        bold: true,
                                        italic: true,
                                    },
                                },
                                {
                                    startIndex: dts.length + 14,
                                    format: {
                                        bold: true,
                                        italic: false,
                                    },
                                },
                            ],
                        },
                    ],
                },
            ]

            let names = Array.from(roster)
            names.sort(compare)
            for (const name of names) {
                const splitName = name.split(' ')
                const firstName = splitName.slice(0, -1).join(' ')
                const lastName = splitName.slice(-1).join(' ')
                let present = 'N',
                    timeIn = '',
                    timeOut = '',
                    joins = 0,
                    minsPresent = 0
                const timestamps = rawData[name]
                if (timestamps) {
                    const l = timestamps.length
                    if (l > 0) {
                        present = 'Y'
                        timeIn = toTimeString(timestamps[0])
                        if ((l - 1) % 2 === 1) {
                            timeOut = toTimeString(timestamps[l - 1])
                        }
                        joins = Math.ceil(l / 2)
                        for (let i = 0; i < l; i += 2) {
                            let secs
                            if (i + 1 === l) {
                                secs = unix - timestamps[i]
                            } else {
                                secs = timestamps[i + 1] - timestamps[i]
                            }
                            const mins = Math.round(secs / 6) / 10
                            minsPresent += mins
                        }
                    }
                }
                rowData.push({
                    values: [
                        {
                            userEnteredValue: {
                                stringValue: lastName,
                            },
                        },
                        {
                            userEnteredValue: {
                                stringValue: firstName,
                            },
                        },
                        {
                            userEnteredValue: {
                                stringValue: present,
                            },
                            userEnteredFormat: {
                                backgroundColor: {
                                    red: present === 'N' ? 1 : 0.5,
                                    green: present === 'N' ? 0.5 : 1,
                                    blue: 0.5,
                                    alpha: 1,
                                },
                                horizontalAlignment: 'CENTER',
                                textFormat: {
                                    bold: true,
                                },
                            },
                        },
                        {
                            userEnteredValue: {
                                stringValue: timeIn,
                            },
                            userEnteredFormat: {
                                horizontalAlignment: 'RIGHT',
                                numberFormat: {
                                    type: 'TIME',
                                    pattern: 'hh:mm A/P"M"',
                                },
                            },
                        },
                        {
                            userEnteredValue: {
                                stringValue: timeOut,
                            },
                            userEnteredFormat: {
                                horizontalAlignment: 'RIGHT',
                                numberFormat: {
                                    type: 'TIME',
                                    pattern: 'hh:mm A/P"M"',
                                },
                            },
                        },
                        {
                            userEnteredValue: {
                                numberValue: joins,
                            },
                        },
                        {
                            userEnteredValue: {
                                numberValue: minsPresent,
                            },
                        },
                    ],
                })
            }

            resolve(rowData)
        })
    })
}

function getSpreadsheetTheme() {
    return {
        primaryFontFamily: 'Courier New',
        themeColors: [
            {
                colorType: 'ACCENT5',
                color: {
                    rgbColor: {
                        red: 1,
                        green: 0.42745098,
                        blue: 0.003921569,
                    },
                },
            },
            {
                colorType: 'TEXT',
                color: {
                    rgbColor: {},
                },
            },
            {
                colorType: 'ACCENT1',
                color: {
                    rgbColor: {
                        red: 0.25882354,
                        green: 0.52156866,
                        blue: 0.95686275,
                    },
                },
            },
            {
                colorType: 'ACCENT3',
                color: {
                    rgbColor: {
                        red: 0.9843137,
                        green: 0.7372549,
                        blue: 0.015686275,
                    },
                },
            },
            {
                colorType: 'BACKGROUND',
                color: {
                    rgbColor: {
                        red: 1,
                        green: 1,
                        blue: 1,
                    },
                },
            },
            {
                colorType: 'ACCENT6',
                color: {
                    rgbColor: {
                        red: 0.27450982,
                        green: 0.7411765,
                        blue: 0.7764706,
                    },
                },
            },
            {
                colorType: 'ACCENT4',
                color: {
                    rgbColor: {
                        red: 0.20392157,
                        green: 0.65882355,
                        blue: 0.3254902,
                    },
                },
            },
            {
                colorType: 'ACCENT2',
                color: {
                    rgbColor: {
                        red: 0.91764706,
                        green: 0.2627451,
                        blue: 0.20784314,
                    },
                },
            },
            {
                colorType: 'LINK',
                color: {
                    rgbColor: {
                        red: 0.06666667,
                        green: 0.33333334,
                        blue: 0.8,
                    },
                },
            },
        ],
    }
}

function getMetaByKey(key, token, spreadsheetId) {
    return new Promise((resolve, reject) => {
        const init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
        }
        fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/developerMetadata/${hashCode(
                key
            )}`,
            init
        )
            .then(function (response) {
                if (response.ok || response.status === 404) {
                    return response.json()
                }
                console.log(response)
                throw new Error('An error occurred while accessing the spreadsheet. Please try again later.')
            })
            .then(function (data) {
                console.log(`Get metadata for key ${key} response:`)
                console.log(data)
                if (data.error) {
                    resolve(null)
                }
                resolve(data)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}

function getNumSheets(token, spreadsheetId) {
    console.log(`Getting index of new sheet...`)
    return new Promise((resolve, reject) => {
        const init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
        }
        fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
            init
        )
            .then(function (response) {
                if (response.ok) {
                    return response.json()
                }
                console.log(response)
                throw new Error('An error occurred while accessing the spreadsheet. Please try again later.')
            })
            .then(function (data) {
                resolve(data.sheets.length)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}

function batchUpdate(token, requests, spreadsheetId, sheetId) {
    requests.push(createResizeRequest(sheetId))
    console.log('Executing batch update...')
    console.log(requests)
    return new Promise((resolve, reject) => {
        const body = {
            requests: requests
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
        fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            init
        )
            .then(function (response) {
                //console.log(response)
                if (response.ok) {
                    return response.json()
                }
                console.log(response)
                throw new Error('An error occurred while updating the spreadsheet. Please try again later.')
            })
            .then(function (data) {
                resolve(data)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}
