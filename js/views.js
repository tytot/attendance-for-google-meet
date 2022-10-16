;(async () => {
    const port = chrome.runtime.connect()

    // MATERIAL DESIGN COMPONENTS
    const MDCRipple = mdc.ripple.MDCRipple
    const MDCList = mdc.list.MDCList
    const MDCDialog = mdc.dialog.MDCDialog
    const MDCMenu = mdc.menu.MDCMenu
    const MDCSnackbar = mdc.snackbar.MDCSnackbar
    const MDCLinearProgress = mdc.linearProgress.MDCLinearProgress
    const MDCTextField = mdc.textField.MDCTextField

    const meetCode = document
        .querySelector('c-wiz')
        .getAttribute('data-unresolved-meeting-id')
    const panel = document.getElementById('panel')

    let initialized = false

    const classView = await (async function () {
        const container = panel.querySelector('.class-view')
        const classListEl = container.querySelector('.class-list')
        const noClassesEl = container.querySelector('.no-classes')
        const classEls = []
        const classElTemplate = document.getElementById('class-item-template')
        const classIdMap = new Map()
        let classCounter = 0

        // DELETE CLASS DIALOG
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

        // INITIALIZE CLASSES
        const rosters = (await chrome.storage.local.get('rosters')).rosters
        for (const className in rosters) {
            const classEl = initializeClassElement(className)
            classListEl.appendChild(classEl)
            classEls.push(classEl)
        }
        container
            .querySelector('.view-changelog')
            .addEventListener('click', a4gm.utils.openChangelog)
        container
            .querySelector('.dismiss-updates')
            .addEventListener('click', async () => {
                await chrome.storage.local.set({ 'updates-dismissed': true })
                container.querySelector('.updates').classList.add('collapsed')
            })
        if (!classEls.length) {
            noClassesEl.style.display = 'flex'
        }

        // LISTENERS
        container
            .querySelector('.addeth-class')
            .addEventListener('click', () => {
                if (!initialized) return
                editView.show()
                container.hidden = true
                editView.edit()
            })

        function initializeClassElement(className) {
            console.log(className)
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
            classEl
                .querySelector('.edit-class')
                .addEventListener('click', () => {
                    if (!initialized) return
                    editView.show()
                    container.hidden = true
                    editView.edit(className)
                })
            classEl.addEventListener('click', async (event) => {
                const target = event.target
                if (
                    !target.classList.contains('edit-class') &&
                    !target.classList.contains('delete-class')
                ) {
                    if (!initialized) return
                    await studentView?.setClass(classEl.name)
                    container.hidden = true
                    studentView.show()
                }
            })
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
            const storage = await chrome.storage.local.get()
            const rosters = storage.rosters
            delete rosters[className]
            const items = { rosters }
            for (const key in storage) {
                if (storage[key].class === className) {
                    delete storage[key]['class']
                    items[key] = storage[key]
                }
            }
            classListEl.removeChild(
                document.getElementById(classIdMap.get(className))
            )
            classIdMap.delete(className)
            if (!classIdMap.size) {
                noClassesEl.style.display = 'flex'
            }
            await chrome.storage.local.set(items)
        }

        function show() {
            container.hidden = false
        }

        return {
            addClass,
            renameClass,
            deleteClass,
            show,
        }
    })()

    const studentView = await (async function () {
        const container = panel.querySelector('.student-view')
        const contentEl = container.querySelector('.student-content')
        const classHeaderEl = container.querySelector('.class-header')
        const noStudentsEl = container.querySelector('.no-students')
        const rosterStatusEl = document.getElementById('roster-status')
        const unlistedTemplate = document.getElementById('unlisted-template')
        const studentTemplate = document.getElementById('student-template')

        const statusContainer = document.getElementById('status-container')
        const statusBarEl = document.getElementById('status-bar')
        const statusDetailsEl = document.getElementById('status-details')

        let selectedClass
        let rostersCache
        let unlistedPos = 0

        const STATUS = {
            UNLISTED: 0,
            ABSENT: 1,
            LEFT: 2,
            PRESENT: 3,
        }
        const entryTemplates = [
            { color: 'gray', tooltip: 'Not on List', icon: 'error' },
            { color: 'red', tooltip: 'Absent', icon: 'cancel' },
            {
                color: 'yellow',
                tooltip: 'Previously Present',
                icon: 'watch_later',
            },
            { color: 'green', tooltip: 'Present', icon: 'check_circle' },
        ]
        const statusBars = entryTemplates.map((temp) =>
            document.getElementById(`status-${temp.color}`)
        )
        const statusCountEls = entryTemplates.map((temp) =>
            statusDetailsEl.querySelector(
                `.status-details-container.${temp.color} .status-details-count`
            )
        )

        const sortMethods = {
            'first-name': (a, b) => {
                if (!a.status !== !b.status) {
                    return b.status - a.status
                }
                return a4gm.utils.compareFirst(a.name, b.name)
            },
            'last-name': (a, b) => {
                if (!a.status !== !b.status) {
                    return b.status - a.status
                }
                return a4gm.utils.compareLast(a.name, b.name)
            },
            'present-first': (a, b) => {
                return b.status - a.status
            },
            'absent-first': (a, b) => {
                if (!a.status !== !b.status) {
                    return b.status - a.status
                }
                return a.status - b.status
            },
        }
        let sortMethod = 'first-name'

        // SORT MENU
        const sortMenuEl = document.getElementById('sort-menu')
        const sortMenu = new MDCMenu(sortMenuEl)
        container.querySelector('.more').addEventListener('click', () => {
            sortMenu.open = true
        })
        const sortOptions = new MDCList(sortMenuEl.querySelector('.mdc-list'))
        for (const listEl of sortOptions.listElements) {
            MDCRipple.attachTo(listEl)
            listEl.addEventListener('click', async () => {
                sortMethod = listEl.id
                await update()
            })
        }

        // JUMP TO UNLISTED BUTTON
        const jumpButtonEl = document.getElementById('status-unlisted')
        Object.defineProperty(jumpButtonEl, 'primed', {
            get: function () {
                return this.classList.contains('mdc-ripple-surface')
            },
            set: function (value) {
                this.setAttribute('aria-disabled', !value)
                if (value) {
                    this.classList.add('mdc-ripple-surface')
                    this.style.cursor = 'pointer'
                    this.setAttribute('jscontroller', 'VXdfxd')
                } else {
                    this.classList.remove('mdc-ripple-surface')
                    this.style.cursor = 'default'
                    this.removeAttribute('jscontroller')
                }
            },
        })
        jumpButtonEl.addEventListener('click', () => {
            if (jumpButtonEl.primed) {
                rosterStatusEl.parentElement.scrollTop = unlistedPos
            }
        })
        jumpButtonEl.addEventListener('keydown', (event) => {
            if (
                (event.key === ' ' ||
                    event.key === 'Enter' ||
                    event.key === 'Spacebar') &&
                jumpButtonEl.primed
            ) {
                rosterStatusEl.parentElement.scrollTop = unlistedPos
            }
        })

        // STATUS BAR
        Object.defineProperty(statusContainer, 'expanded', {
            get: function () {
                return statusBarEl.getAttribute('aria-expanded') === 'true'
            },
            set: function (value) {
                statusBarEl.setAttribute('aria-pressed', value)
                statusBarEl.setAttribute('aria-expanded', value)
                const verb = value ? 'Hide' : 'Show'
                statusBarEl.setAttribute(
                    'data-tooltip',
                    `${verb} Status Details`
                )
                statusBarEl.setAttribute('aria-label', `${verb} Status Details`)
                if (value) {
                    statusDetailsEl.classList.remove('collapsed')
                } else {
                    statusDetailsEl.classList.add('collapsed')
                }
            },
        })
        statusBarEl.addEventListener('click', toggleStatusContainer)
        statusBarEl.addEventListener('keydown', (event) => {
            if (
                event.key === ' ' ||
                event.key === 'Enter' ||
                event.key === 'Spacebar'
            ) {
                toggleStatusContainer()
            }
        })
        document
            .getElementById('hide-status-details')
            .addEventListener('click', toggleStatusContainer)

        // LISTENERS
        container.querySelector('.back').addEventListener('click', () => {
            if (!initialized) return
            classView.show()
            container.hidden = true
        })
        container
            .querySelector('.edit-roster')
            .addEventListener('click', () => {
                if (!initialized) return
                editView.show()
                container.hidden = true
                editView.edit(selectedClass, false)
            })

        function toggleStatusContainer() {
            statusContainer.expanded = !statusContainer.expanded
        }

        function updateStatusBar(statusCounts, rosterLength) {
            rosterStatusEl.removeChild(rosterStatusEl.firstElementChild)
            statusBars.forEach((bar, status) => {
                if (!bar) return
                bar.style.width = `${
                    (100 * statusCounts[status]) / rosterLength
                }%`
                const prefix = bar.getAttribute('aria-label').split(':')[0]
                bar.setAttribute(
                    'aria-label',
                    `${prefix}: ${statusCounts[status]}/${rosterLength}`
                )
                statusCountEls[status].innerHTML = `<b>${statusCounts[status]
                    .toString()
                    .padStart(
                        rosterLength.toString().length,
                        '0'
                    )}</b>/${rosterLength}`
            })
        }

        function getStatus(inRoster, timestamps, presenceThreshold) {
            if (!inRoster) {
                return STATUS.UNLISTED
            }
            const minsPresent = a4gm.utils.minsPresent(timestamps)
            if (minsPresent >= presenceThreshold) {
                if (timestamps.length % 2 === 1) {
                    return STATUS.PRESENT
                }
                return STATUS.LEFT
            }
            return STATUS.PRESENT
        }

        function createEntry(name, status, timestamps) {
            const entry = {
                name,
                status,
                ...entryTemplates[status],
            }
            if (status === STATUS.ABSENT && !timestamps) {
                entry.text = 'Not here'
            } else if (status === STATUS.LEFT) {
                entry.text = `Last seen at ${a4gm.utils.timeString(
                    timestamps[timestamps.length - 1]
                )}`
            } else {
                entry.text = `Joined at ${a4gm.utils.timeString(
                    timestamps[0]
                )}`
            }
            return entry
        }

        function initializeStudentElement(entry) {
            const entryEl = studentTemplate.content.cloneNode(true)
            const statusIcon = entryEl.querySelector('.mdc-list-item__graphic')
            statusIcon.classList.add(entry.color)
            statusIcon.setAttribute('aria-label', entry.tooltip)
            statusIcon.setAttribute('data-tooltip', entry.tooltip)
            entryEl.querySelector('.mdc-list-item__primary-text').textContent =
                entry.name
            entryEl.querySelector(
                '.mdc-list-item__secondary-text'
            ).textContent = entry.text
            const metaButton = entryEl.querySelector('.mdc-icon-button')
            const metaTooltip = entry.status
                ? 'Remove from Class'
                : 'Add to Class'
            metaButton.setAttribute('aria-label', metaTooltip)
            metaButton.setAttribute('data-tooltip', metaTooltip)
            metaButton.textContent = entry.status
                ? 'remove_circle'
                : 'add_circle'
            return entryEl
        }

        async function addStudents(...names) {
            const storage = await chrome.storage.local.get()
            const className = storage[meetCode].class
            const rosters = storage.rosters
            rosters[className].push(...names)
            await chrome.storage.local.set({ rosters })
            await update()
        }

        async function removeStudent(name) {
            const storage = chrome.storage.local.get()
            const rosters = storage.rosters
            const className = storage[meetCode].class
            rosters[className] = rosters[className].filter((n) => n !== name)
            await chrome.storage.local.set({ rosters })
            await update()
        }

        async function setClass(className) {
            const meetData = (await chrome.storage.local.get(meetCode))[
                meetCode
            ]
            meetData.class = className
            await chrome.storage.local.set({ [meetCode]: meetData })
            contentEl.scrollTop = 0
            classHeaderEl.textContent = className
            selectedClass = className
            await update()
        }

        async function update() {
            const storage = await chrome.storage.local.get()
            const meetData = storage[meetCode]
            const className = meetData?.class
            if (!className) {
                return
            }
            const participants = meetData.participants
            const rosters = storage.rosters
            const roster = rosters[className]
            noStudentsEl.style.display = roster.length ? 'none' : 'flex'
            const entries = []
            const unlistedNames = []
            const statusCounts = Array(statusBars.length).fill(0)
            for (const name in participants) {
                const timestamps = participants[name]
                const status = getStatus(
                    roster.includes(name),
                    timestamps,
                    storage['presence-threshold']
                )
                statusCounts[status]++
                if (status === STATUS.UNLISTED) {
                    unlistedNames.push(name)
                }
                entries.push(createEntry(name, status, timestamps))
            }
            const participantNames = Object.keys(participants).map((key) =>
                key.toLocaleUpperCase()
            )
            for (const name of roster) {
                if (!participantNames.includes(name.toLocaleUpperCase())) {
                    entries.push(createEntry(name, STATUS.ABSENT))
                    statusCounts[STATUS.ABSENT]++
                }
            }
            entries.sort(sortMethods[sortMethod])
            if (statusCounts[STATUS.UNLISTED] && jumpButtonEl.primed) {
                jumpButtonEl.primed = false
            }
            rosterStatusEl.innerHTML = ''
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                if (!entry.status && (!i || entries[i - 1].status)) {
                    rosterStatusEl.appendChild(
                        unlistedTemplate.content.cloneNode(true)
                    )
                    unlistedPos = 61 * i
                    if (!jumpButtonEl.primed) {
                        jumpButtonEl.primed = true
                    }
                    document
                        .getElementById('add-all-unlisted')
                        .addEventListener('click', async () => {
                            rostersCache = rosters
                            await addStudents(...unlistedNames)
                            showSnackbar(
                                `Added ${unlistedNames.length} student${
                                    unlistedNames.length === 1 ? '' : 's'
                                } to class.`,
                                'undo'
                            )
                        })
                }
                const entryEl = initializeStudentElement(entry)
                const metaButton = entryEl.querySelector('.mdc-icon-button')
                const displayName = entryEl.querySelector(
                    '.mdc-list-item__primary-text'
                ).textContent
                if (!entry.status) {
                    metaButton.addEventListener('click', async () => {
                        rostersCache = rosters
                        await addStudents(entry.name)
                        showSnackbar(`Added ${displayName} to class.`, 'undo')
                    })
                } else {
                    metaButton.addEventListener('click', async () => {
                        rostersCache = rosters
                        await removeStudent(entry.name)
                        showSnackbar(
                            `Removed ${displayName} from class.`,
                            'undo'
                        )
                    })
                }
                rosterStatusEl.appendChild(entryEl)
            }
            if (roster.length > 0) {
                updateStatusBar(statusCounts, roster.length)
            }
            statusCountEls[STATUS.UNLISTED].innerHTML = `<b>${
                statusCounts[STATUS.UNLISTED]
            }</b>`
            statusCountEls[STATUS.UNLISTED].setAttribute(
                'aria-label',
                `Not on List: ${statusCounts[STATUS.UNLISTED]}`
            )
        }

        async function undo() {
            if (rostersCache) {
                await chrome.storage.local.set({ rosters: rostersCache })
                await update()
                showSnackbar('Undo successful.')
            }
        }

        function show() {
            container.hidden = false
        }

        return {
            setClass,
            update,
            undo,
            show,
        }
    })()

    const editView = await (async function () {
        const container = panel.querySelector('.edit-view')
        const textFieldEls = container.getElementsByClassName('mdc-text-field')
        const classNameField = new MDCTextField(textFieldEls[0])
        const rosterField = new MDCChipSetTextField(textFieldEls[1])

        let initClassName
        let referrer

        // LISTENERS
        container.querySelector('.back').addEventListener('click', () => {
            if (!initialized) return
            referrer.show()
            container.hidden = true
        })
        container
            .querySelector('.save-class')
            .addEventListener('click', async () => {
                if (!initialized) return
                const className = classNameField.value
                const storage = await chrome.storage.local.get()
                const rosters = storage.rosters
                if (!className.trim()) {
                    showSnackbar('Error: The class name cannot be empty.')
                } else if (className.includes('§')) {
                    showSnackbar(
                        'Error: The class name cannot contain the character §.'
                    )
                } else if (
                    rosters.hasOwnProperty(className) &&
                    className !== initClassName
                ) {
                    showSnackbar(
                        'Error: You already have a class with that name.'
                    )
                } else {
                    const roster = rosterField.chipTexts
                    rosters[className] = roster
                    const items = { rosters: rosters }
                    if (initClassName && initClassName !== className) {
                        port.postMessage({
                            data: 'rename',
                            code: meetCode,
                            oldClassName: initClassName,
                            newClassName: className,
                        })
                        delete rosters[initClassName]
                        for (const key in result) {
                            const data = result[key]
                            if (data.class === initClassName) {
                                data.class = className
                                items[key] = data
                            }
                        }
                    }
                    await chrome.storage.local.set(items)
                    showSnackbar(`Successfully saved class ${className}.`)
                    if (!initClassName) {
                        classView?.addClass(className)
                    } else if (initClassName !== className) {
                        classView?.renameClass(initClassName, className)
                    }
                    if (referrer === studentView) {
                        if (initClassName !== className) {
                            await studentView.setClass(className)
                        } else {
                            await studentView.update()
                        }
                    }
                    referrer.show()
                    container.hidden = true
                }
            })

        async function edit(className = '', fromclassView = true) {
            referrer = fromclassView ? classView : studentView
            initClassName = className
            classNameField.value = className
            const rosters = (await chrome.storage.local.get('rosters')).rosters
            const roster = rosters[className] ?? []
            rosterField.refresh(roster)
        }

        function show() {
            container.hidden = false
        }

        return { edit, show }
    })()

    initialized = true

    // SNACKBAR
    const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'))
    const snackbarButtons = new Map(
        [
            ['help', a4gm.utils.openTroubleshoot],
            ['open', a4gm.utils.openSpreadsheet],
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
        port.postMessage({ data: 'export', code: meetCode })
        exportButton.disabled = true
    })

    // BUTTON RIPPLES
    for (const button of document.getElementsByClassName('mdc-button')) {
        MDCRipple.attachTo(button)
    }
    for (const button of document.getElementsByClassName('mdc-icon-button')) {
        const ripple = new MDCRipple(button)
        ripple.unbounded = true
    }

    // PROXY LISTENER
    window.addEventListener('message', async (event) => {
        if (event.origin !== 'https://meet.google.com') return
        if (event.data.sender !== 'A4GM') return
        const storage = await chrome.storage.local.get()
        const codesToDelete = a4gm.attendance.removeStaleMeets(storage)
        if (codesToDelete.length) {
            port.postMessage({
                data: 'delete-meta',
                codes: codesToDelete,
            })
            await chrome.storage.local.remove(codesToDelete)
        }
        const meetData = a4gm.attendance.process(event.data.attendance, storage[meetCode])
        await chrome.storage.local.set({ [meetCode]: meetData })
        await studentView.update()
    })
})().catch((e) => console.error(e))
