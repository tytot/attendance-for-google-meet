function updateSheetProperties(className, code, sheetId, fields) {
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
                fields: fields,
            },
        },
    ]
    requests.push(createSheetMetadata(className, sheetId))
    return requests
}

function addSheet(className, code, sheetId) {
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
    requests.push(createSheetMetadata(className, sheetId))
    return requests
}

function createSheetMetadata(className, sheetId) {
    const request = {
        createDeveloperMetadata: {
            developerMetadata: {
                metadataId: hashCode(className),
                metadataKey: className,
                location: {
                    sheetId: sheetId,
                },
                visibility: 'DOCUMENT',
            },
        },
    }
    return request
}

function deleteSheetMetadata(oldClassName) {
    const request = {
        deleteDeveloperMetadata: {
            dataFilter: {
                developerMetadataLookup: {
                    metadataId: hashCode(oldClassName),
                },
            },
        },
    }
    return request
}

function deleteCodeMetadata(code) {
    const request = {
        deleteDeveloperMetadata: {
            dataFilter: {
                developerMetadataLookup: {
                    metadataKey: code,
                },
            },
        },
    }
    return request
}

function createHeaders(sheetId) {
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
                                    'When the student left the meeting, or empty if the student was in the meeting at time of export.',
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
                                    stringValue:
                                        'Generated by the Attendance for Google Meet™ extension.',
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

function initializeCells(code, sheetId) {
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
                            metadataId: hashCode(`${code}§${sheetId}`),
                            metadataKey: code,
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
            requests = requests.concat(addGroup(sheetId, 1, rows.length))
            requests = requests.concat(
                createBorders(sheetId, 1, rows.length, color)
            )
            resolve(requests)
        })
    })
}

function updateCells(token, code, spreadsheetId, sheetId, startRow) {
    sheetId = parseInt(sheetId)
    const color = {
        red: 0.75,
        green: 0.75,
        blue: 0.75,
        alpha: 1,
    }

    let requests = []
    let numRows = null
    return new Promise((resolve, reject) => {
        getRowCountByStartRow(token, spreadsheetId, sheetId, startRow)
            .then(function (nRows) {
                numRows = nRows
                return generateAttendanceRows(code)
            })
            .then(function (rows) {
                requests.push({
                    deleteDimensionGroup: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: startRow + 1,
                            endIndex: startRow + numRows,
                        },
                    },
                })
                if (rows.length > numRows) {
                    requests.push({
                        insertDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: startRow + numRows,
                                endIndex: startRow + rows.length,
                            },
                            inheritFromBefore: true,
                        },
                    })
                } else if (rows.length < numRows) {
                    requests.push({
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: startRow + rows.length,
                                endIndex: startRow + numRows,
                            },
                        },
                    })
                }
                requests.push({
                    updateCells: {
                        rows: rows,
                        fields: '*',
                        start: {
                            sheetId: sheetId,
                            rowIndex: startRow,
                            columnIndex: 0,
                        },
                    },
                })
                requests = requests.concat(
                    addGroup(sheetId, startRow, rows.length)
                )
                requests = requests.concat(
                    createBorders(sheetId, startRow, rows.length, color)
                )
                resolve(requests)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}

function createBorders(sheetId, startRow, numRows, color) {
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

function autoResize(sheetId) {
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

function addGroup(sheetId, startRow, numRows) {
    const requests = [
        {
            addDimensionGroup: {
                range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: startRow + 1,
                    endIndex: startRow + numRows,
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
                        endIndex: startRow + numRows,
                    },
                    depth: 1,
                    collapsed: false,
                },
                fields: 'collapsed',
            },
        },
    ]
    return requests
}

function collapseGroup(token, code, spreadsheetId, sheetId) {
    return new Promise((resolve) => {
        let spreadsheet = null
        getSpreadsheet(token, spreadsheetId)
            .then(function (ss) {
                spreadsheet = ss
                return getMetaByKey(
                    `${code}§${sheetId}`,
                    token,
                    spreadsheetId
                )
            })
            .then(function (meta) {
                const startRow = meta.location.dimensionRange.startIndex
                let requests = []
                for (const sheet of spreadsheet.sheets) {
                    if (sheet.properties.sheetId === sheetId) {
                        for (const rowGroup of sheet.rowGroups) {
                            if (
                                !rowGroup.collapsed &&
                                rowGroup.range.startIndex !== startRow + 1
                            ) {
                                requests.push({
                                    updateDimensionGroup: {
                                        dimensionGroup: {
                                            range: rowGroup.range,
                                            depth: rowGroup.depth,
                                            collapsed: true,
                                        },
                                        fields: 'collapsed',
                                    },
                                })
                            }
                        }
                        if (requests.length > 0) {
                            resolve(requests)
                        }
                        resolve(null)
                    }
                }
                resolve(null)
            })
    })
}

function generateAttendanceRows(code) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, function (result) {
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
            names.sort(compareLast)
            for (const name of names) {
                const firstName = getFirstName(name)
                const lastName = getLastName(name)
                let present = 'N',
                    timeIn = '',
                    timeOut = '',
                    joins = 0,
                    minsPresent = 0

                for (const entry in rawData) {
                    if (
                        entry.toLocaleUpperCase() === name.toLocaleUpperCase()
                    ) {
                        const timestamps = rawData[entry]
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
                        break
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
                throw new Error(
                    'An error occurred while accessing the spreadsheet. Please try again later.'
                )
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

function getSpreadsheet(token, spreadsheetId) {
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
                throw new Error(
                    'An error occurred while accessing the spreadsheet. Please try again later.'
                )
            })
            .then(function (data) {
                resolve(data)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}

function getRowCountByStartRow(token, spreadsheetId, sheetId, startRow) {
    return new Promise((resolve, reject) => {
        getSpreadsheet(token, spreadsheetId).then(function (spreadsheet) {
            for (const sheet of spreadsheet.sheets) {
                if (sheet.properties.sheetId === sheetId) {
                    for (const group of sheet.rowGroups) {
                        if (group.range.startIndex === startRow + 1) {
                            numRows = group.range.endIndex - startRow
                            resolve(numRows)
                        }
                    }
                }
            }
            resolve(0)
        })
    })
}

function batchUpdate(token, requests, spreadsheetId, sheetId) {
    if (sheetId) {
        requests.push(autoResize(sheetId))
    }
    console.log('Executing batch update...')
    console.log(requests)
    return new Promise((resolve, reject) => {
        const body = {
            requests: requests,
            includeSpreadsheetInResponse: true,
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
                const resJSON = response.json()
                if (response.ok) {
                    return resJSON
                }
                console.log(resJSON)
                throw new Error(
                    'An error occurred while updating the spreadsheet. Please try again later.'
                )
            })
            .then(function (data) {
                resolve(data)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}
