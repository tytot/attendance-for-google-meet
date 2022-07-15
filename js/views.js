;(async () => {
    'use strict'

    const meetCode = document
        .querySelector('c-wiz')
        .getAttribute('data-unresolved-meeting-id')

    const panel = document.getElementById('panel')

    const classView = await (async function () {
        const container = panel.querySelector('.class-view')
        const classListEl = container.querySelector('.class-list')
        const noClassesEl = container.querySelector('.no-classes')
        const classEls = []
        const classElTemplate = document.getElementById('class-item-template')
        const classCounter = 0
        const classIdMap = new Map()

        function initializeClassElement(className) {
            const classEl =
                classElTemplate.content.firstElementChild.cloneNode(true)
            const id = `a4gm-class-${++classCounter}`
            classEl.id = id
            classIdMap.set(className, id)
            classEl.querySelector('.class-entry').textContent = className
            classEl.name = className
            classEl
                .querySelector('.delete-class')
                .addEventListener('click', () => {
                    deleteButtonEl.classToDelete = className
                    deleteClassDialog.open()
                })
            // classEl
            //     .querySelector('.edit-class')
            //     .addEventListener('click', () => {
            //         onEdit(classEl.name)
            //     })
            // classEl.addEventListener('click', (event) => {
            //     const target = event.target
            //     if (
            //         !target.classList.contains('edit-class') &&
            //         !target.classList.contains('delete-class')
            //     ) {
            //         onSelect(classEl.name)
            //     }
            // })
            MDCRipple.attachTo(classEl)
            return classEl
        }

        function addClass(className) {
            const classEl = initializeClassElement(className)
            classListEl.appendChild(classEl)
            noClassesEl.style.display = 'none'
        }
        function renameClass(oldClassName, newClassName) {
            const classElId = classIdMap.get(oldClassName)
            const classEl = document.getElementById(classElId)
            classEl.name = newClassName
            classEl.querySelector('.class-entry').textContent = newClassName
            classIdMap.delete(oldClassName)
            classIdMap.set(newClassName, classElId)
        }
        async function deleteClass(className) {
            const storage = await chrome.storage.local.get(null)
            const rosters = storage.rosters
            delete rosters[className]
            const items = { rosters }
            for (const key of Object.keys(storage)) {
                if (
                    storage[key].hasOwnProperty('class') &&
                    storage[key].class === className
                ) {
                    delete storage[key]['class']
                    items[key] = storage[key]
                }
            }
            classListEl.removeChild(
                document.getElementById(classIdMap.get(className))
            )
            classIdMap.delete(className)
            if (classIdMap.size === 0) {
                noClassesEl.style.display = 'flex'
            }
            await chrome.storage.local.set(items)
        }

        const deleteClassDialog = new MDCDialog(
            document.getElementById('delete-dialog')
        )
        deleteClassDialog.listen('MDCDialog:opening', () => {
            document.getElementById(
                'delete-dialog-content'
            ).innerHTML = `Are you sure you want to delete the class <b>${deleteButtonEl.classToDelete}</b>?`
        })
        const deleteButtonEl = document.getElementById('confirm-delete')
        deleteButtonEl.addEventListener('click', async () => {
            const className = deleteButtonEl.classToDelete
            await deleteClass(className)
            // showSnackbar(`Successfully deleted class ${className}.`)
        })

        const rosters = (await chrome.storage.local.get('rosters')).rosters
        for (const className in rosters) {
            const classEl = initializeClassElement(className)
            classListEl.appendChild(classEl)
            classEls.push(classEl)
        }
        // container
        //     .querySelector('.addeth-class')
        //     .addEventListener('click', () => {
        //         onAdd()
        //     })
        container
            .querySelector('.view-changelog')
            .addEventListener('click', () => {
                chrome.runtime.sendMessage({
                    data: 'open-url',
                    url: `https://github.com/tytot/attendancle-for-google-meet/releases/tag/v${
                        chrome.runtime.getManifest().version
                    }`,
                })
            })
        container
            .querySelector('.dismiss-updates')
            .addEventListener('click', async () => {
                await chrome.storage.local.set({ 'updates-dismissed': true })
                container.querySelector('.updates').classList.add('collapsed')
            })
        if (classEls.length === 0) {
            noClassesEl.style.display = 'flex'
        }

        return {
            addClass,
            renameClass,
            deleteClass,
            get hidden() {
                return container.hidden
            },
            set hidden(value) {
                container.hidden = value
            },
        }
    })()

    // ATTENDANCE HANDLER
    async function processAttendance(names) {
        const storage = await chrome.storage.local.get(null)
        const timestamp = ~~(Date.now() / 1000)
        const codesToDelete = []
        for (const key in storage) {
            const data = storage[key]
            if (
                data.hasOwnProperty('timestamp') &&
                timestamp - data.timestamp >= storage['reset-interval'] * 3600
            ) {
                codesToDelete.push(key)
                delete storage[key]
            }
        }
        if (codesToDelete.length > 0) {
            port.postMessage({
                data: 'delete-meta',
                codes: codesToDelete,
            })
            await chrome.storage.local.remove(codesToDelete)
        }
        const meetData = storage[meetCode] || {
            attendance: {},
            'start-timestamp': timestamp,
        }
        const attendance = meetData.attendance
        meetData.timestamp = timestamp

        for (const name of names) {
            if (!attendance.hasOwnProperty(name)) {
                attendance[name] = [timestamp]
            } else if (attendance[name].length % 2 === 0) {
                attendance[name].push(timestamp)
            }
        }
        for (const name in attendance) {
            if (!names.includes(name) && attendance.hasOwnProperty(name)) {
                if (attendance[name].length % 2 === 1) {
                    attendance[name].push(timestamp)
                }
            }
        }
        await chrome.storage.local.set({ [meetCode]: meetData })
    }

    // HELPERS
    async function openSpreadsheet() {
        const id = (await chrome.storage.local.get('spreadsheet-id'))[
            'spreadsheet-id'
        ]
        const url = `https://docs.google.com/spreadsheets/d/${id}`
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: url,
        })
    }
    function troubleshoot() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: 'https://github.com/tytot/attendance-for-google-meet#troubleshoot',
        })
    }
    function usage() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: 'https://github.com/tytot/attendance-for-google-meet#usage',
        })
    }

    // SNACKBAR
    const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'))
    const snackbarButtons = new Map(
        [
            ['help', troubleshoot],
            ['open', openSpreadsheet],
            ['undo', studentView.undo],
        ].map((pair) => {
            const button = document.getElementById(`snackbar-${pair[0]}`)
            button.addEventListener('click', pair[1])
            pair[1] = button
            return pair
        })
    )
    let expectedLabel = ''
    function showSnackbar(text, ...buttons) {
        snackbar.close()
        expectedLabel = text
        snackbar.labelText = text
        for (const buttonName in snackbarButtons) {
            snackbarButtons[buttonName].style.display = buttons.includes(
                buttonName
            )
                ? 'inline-flex'
                : 'none'
        }
        snackbar.open()
    }
    // hack to prevent weird flashing between labels
    const snackbarLabelEl = document.querySelector('.mdc-snackbar__label')
    new MutationObserver(() => {
        if (
            snackbar.labelText !== ' ' &&
            snackbar.labelText !== expectedLabel
        ) {
            snackbar.labelText = expectedLabel
        }
    }).observe(snackbarLabelEl, {
        subtree: true,
        childList: true,
    })

    // PROGRESS BAR
    const linearProgress = new MDCLinearProgress(
        document.getElementById('progress-bar')
    )
    linearProgress.progress = 0
    port.onMessage.addListener((msg) => {
        linearProgress.progress = msg.progress
        if (msg.done) {
            exportButton.disabled = false
            const error = msg.error
            if (error) {
                showSnackbar(error, 'help')
            } else {
                showSnackbar('Successfully exported to Google Sheets™!', 'open')
            }
        }
    })

    // EXPORT ON LEAVE
    new MutationObserver(async (mutations, me) => {
        if (document.querySelector('.CX8SS')) {
            chrome.runtime.sendMessage({ data: 'delete-tab' })
            const storage = await chrome.storage.local.get('auto-export')
            if (storage['auto-export']) {
                port.postMessage({ data: 'export', code: meetCode })
            }
            me.disconnect()
        }
    }).observe(document.querySelector('.SSPGKf'), {
        childList: true,
        subtree: true,
    })

    // EXPORT LISTENER
    const exportButton = document.getElementById('export')
    exportButton.addEventListener('click', () => {
        port.postMessage({ data: 'export', code: getMeetCode() })
        exportButton.disabled = true
    })

    // PROXY LISTENER
    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://meet.google.com') return
        if (event.data.sender !== 'A4GM') return
        processAttendance(event.data.attendance).then(() => {
            panelStudentScreen.update()
        })
    })

    // BUTTON RIPPLES
    for (const button of document.getElementsByClassName('mdc-button')) {
        MDCRipple.attachTo(button)
    }
    for (const button of document.getElementsByClassName('mdc-icon-button')) {
        const ripple = new MDCRipple(button)
        ripple.unbounded = true
    }
})()
