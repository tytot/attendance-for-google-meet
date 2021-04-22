'use strict'
{
    // initialize material design components
    const MDCRipple = mdc.ripple.MDCRipple
    const MDCList = mdc.list.MDCList
    const MDCDialog = mdc.dialog.MDCDialog
    const MDCMenu = mdc.menu.MDCMenu
    const MDCSnackbar = mdc.snackbar.MDCSnackbar
    const MDCLinearProgress = mdc.linearProgress.MDCLinearProgress
    const MDCTextField = mdc.textField.MDCTextField

    // connect to background page
    const port = chrome.runtime.connect()

    // listen for attendance messages from inject.js
    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://meet.google.com') return
        if (event.data.sender !== 'Ya boi') return
        if (event.data.attendance) {
            processAttendance(event.data.attendance)
        }
    })

    class ClassScreen {
        constructor(containerEl) {
            this.container = containerEl
            this.classEls = []
            this.classCounter = 0
            this.classElTemplate = document.getElementById(
                'class-item-template'
            )
            this.classListEl = this.container.querySelector('.class-list')
            this.classIdMap = new Map()
            this.noClassesEl = this.container.querySelector('.no-classes')

            this.onAdd = () => {}
            this.onEdit = (className) => {}
            this.onSelect = (className) => {}
        }
        initialize() {
            return new Promise(async (resolve) => {
                chrome.storage.local.get('rosters', (result) => {
                    const rosters = result.rosters
                    if (!rosters) {
                        rosters = {}
                        await(
                            new Promise((resolve) => {
                                chrome.storage.local.set(
                                    { rosters: rosters },
                                    () => {
                                        resolve()
                                    }
                                )
                            })
                        )
                    }
                    for (const className in rosters) {
                        const classEl = this.initializeClassElement(className)
                        this.classListEl.appendChild(classEl)
                        this.classEls.push(classEl)
                    }
                    this.container
                        .querySelector('.addeth-class')
                        .addEventListener('click', () => {
                            this.onAdd()
                        })
                    this.container
                        .querySelector('.view-changelog')
                        .addEventListener('click', () => {
                            chrome.runtime.sendMessage({
                                data: 'open-url',
                                url: `https://github.com/tytot/attendance-for-google-meet/releases/tag/v${
                                    chrome.runtime.getManifest().version
                                }`,
                            })
                        })
                    this.container
                        .querySelector('.dismiss-updates')
                        .addEventListener('click', () => {
                            chrome.storage.local.set(
                                { 'updates-dismissed': true },
                                () => {
                                    this.container
                                        .querySelector('.updates')
                                        .classList.add('collapsed')
                                }
                            )
                        })
                    this.container
                        .querySelector('.help')
                        .addEventListener('click', iveFallenAndICantGetUp)
                    if (this.classEls.length === 0) {
                        this.noClassesEl.style.display = 'flex'
                    }
                    resolve()
                })
            })
        }
        initializeClassElement(className) {
            const classEl = this.classElTemplate.content.firstElementChild.cloneNode(
                true
            )
            const id = `baker-mayfield-${++this.classCounter}`
            classEl.id = id
            this.classIdMap.set(className, id)
            classEl.querySelector('.class-entry').textContent = className
            classEl.name = className
            classEl
                .querySelector('.delete-class')
                .addEventListener('click', () => {
                    confirmDelete(className)
                })
            classEl
                .querySelector('.edit-class')
                .addEventListener('click', () => {
                    this.onEdit(classEl.name)
                })
            classEl.addEventListener('click', async (event) => {
                const target = event.target
                if (
                    !target.classList.contains('edit-class') &&
                    !target.classList.contains('delete-class')
                ) {
                    this.onSelect(classEl.name)
                }
            })
            MDCRipple.attachTo(classEl)
            return classEl
        }
        addClass(className) {
            const classEl = this.initializeClassElement(className)
            this.classListEl.appendChild(classEl)
            this.noClassesEl.style.display = 'none'
        }
        renameClass(oldClassName, newClassName) {
            const classElId = this.classIdMap.get(oldClassName)
            const classEl = document.getElementById(classElId)
            classEl.name = newClassName
            classEl.querySelector('.class-entry').textContent = newClassName
            this.classIdMap.delete(oldClassName)
            this.classIdMap.set(newClassName, classElId)
        }
        deleteClass(className) {
            return new Promise((resolve) => {
                chrome.storage.local.get(null, (result) => {
                    const rosters = result.rosters
                    delete rosters[className]
                    const items = { rosters: rosters }

                    for (const key of Object.keys(result)) {
                        if (
                            result[key].hasOwnProperty('class') &&
                            typeof result[key].class === 'string' &&
                            result[key].class === className
                        ) {
                            delete result[key]['class']
                            items[key] = result[key]
                        }
                    }
                    this.classListEl.removeChild(
                        document.getElementById(this.classIdMap.get(className))
                    )
                    this.classIdMap.delete(className)
                    if (this.classIdMap.size === 0) {
                        this.noClassesEl.style.display = 'flex'
                    }
                    chrome.storage.local.set(items, () => {
                        resolve()
                    })
                })
            })
        }
        get hidden() {
            return this.container.hidden
        }
        set hidden(value) {
            this.container.hidden = value
        }
    }
    class StudentScreen {
        constructor(containerEl) {
            this.container = containerEl
            this.classLabelEl = this.container.querySelector('.class-label')
            this.cardContentEl = this.container.querySelector(
                '.mdc-card-content'
            )
            this.noStudentsEl = this.container.querySelector('.no-students')
            this.rosterStatusEl = document.getElementById('roster-status')
            this.unlistedTemplate = document.getElementById('unlisted-template')
            this.studentTemplate = document.getElementById('student-template')

            const statusContainer = document.getElementById('status-container')
            const statusBarEl = document.getElementById('status-bar')
            const statusDetailsEl = document.getElementById('status-details')
            Object.defineProperty(statusContainer, 'expanded', {
                get: function () {
                    return statusBarEl.getAttribute('aria-expanded') === 'true'
                },
                set: function (value) {
                    statusBarEl.setAttribute('aria-pressed', value)
                    statusBarEl.setAttribute('aria-expanded', value)
                    if (value) {
                        statusDetailsEl.classList.remove('collapsed')
                        statusBarEl.setAttribute(
                            'data-tooltip',
                            'Hide Status Details'
                        )
                        statusBarEl.setAttribute(
                            'aria-label',
                            'Hide Status Details'
                        )
                    } else {
                        statusDetailsEl.classList.add('collapsed')
                        statusBarEl.setAttribute(
                            'data-tooltip',
                            'Show Status Details'
                        )
                        statusBarEl.setAttribute(
                            'aria-label',
                            'Show Status Details'
                        )
                    }
                },
            })
            function toggleStatusContainer() {
                statusContainer.expanded = !statusContainer.expanded
            }
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
            this.statusBars = {}
            this.statusCountEls = {
                gray: statusDetailsEl.querySelector(
                    '.status-details-container.gray .status-details-count'
                ),
            }
            for (const color of ['red', 'yellow', 'green']) {
                this.statusBars[color] = document.getElementById(
                    `status-${color}`
                )
                this.statusCountEls[color] = statusDetailsEl.querySelector(
                    `.status-details-container.${color} .status-details-count`
                )
            }
            this.jumpButtonEl = document.getElementById('status-unlisted')
            Object.defineProperty(this.jumpButtonEl, 'primed', {
                get: function () {
                    return this.classList.contains('mdc-ripple-surface')
                },
                set: function (value) {
                    if (value) {
                        this.classList.add('mdc-ripple-surface')
                        this.setAttribute('aria-disabled', false)
                        this.style.cursor = 'pointer'
                        this.setAttribute('jscontroller', 'VXdfxd')
                    } else {
                        this.classList.remove('mdc-ripple-surface')
                        this.setAttribute('aria-disabled', true)
                        this.style.cursor = 'default'
                        this.removeAttribute('jscontroller')
                    }
                },
            })
            this.unlistedPos = 0
            this.jumpButtonEl.addEventListener('click', () => {
                if (this.primed) {
                    this.rosterStatusEl.parentElement.scrollTop = this.unlistedPos
                }
            })
            this.jumpButtonEl.addEventListener('keydown', (event) => {
                if (
                    (event.key === ' ' ||
                        event.key === 'Enter' ||
                        event.key === 'Spacebar') &&
                    this.primed
                ) {
                    this.rosterStatusEl.parentElement.scrollTop = this.unlistedPos
                }
            })

            this.sortMethods = {
                'first-name': (a, b) => {
                    if ((a.index === -1) !== (b.index === -1)) {
                        return b.index - a.index
                    }
                    return Utils.compareFirst(a.name, b.name)
                },
                'last-name': (a, b) => {
                    if ((a.index === -1) !== (b.index === -1)) {
                        return b.index - a.index
                    }
                    return Utils.compareLast(a.name, b.name)
                },
                'present-first': (a, b) => {
                    return b.index - a.index
                },
                'present-last': (a, b) => {
                    if ((a.index === -1) !== (b.index === -1)) {
                        return b.index - a.index
                    }
                    return a.index - b.index
                },
            }
            this.sortMethod = 'first-name'
            const sortMenuEl = document.getElementById('sort-menu')
            const sortMenu = new MDCMenu(sortMenuEl)
            this.container
                .querySelector('.more')
                .addEventListener('click', () => {
                    sortMenu.open = true
                })
            const sortOptions = new MDCList(
                sortMenuEl.querySelector('.mdc-list')
            )
            for (const listEl of sortOptions.listElements) {
                MDCRipple.attachTo(listEl)
                listEl.addEventListener('click', () => {
                    this.sortMethod = listEl.id
                    this.update()
                })
            }

            this.onBack = () => {}
            this.onEdit = (className) => {}
            this.container
                .querySelector('.back')
                .addEventListener('click', () => {
                    this.onBack()
                })
            document
                .getElementById('edit-roster')
                .addEventListener('click', () => {
                    this.onEdit(this.selectedClass)
                })
        }
        chooseClass(className) {
            const code = getMeetCode()
            return new Promise((resolve) => {
                chrome.storage.local.get(code, (result) => {
                    const meetData = result[code]
                    meetData.class = className
                    chrome.storage.local.set({ [code]: meetData }, () => {
                        this.classLabelEl.textContent = className
                        this.cardContentEl.scrollTop = 0
                        this.selectedClass = className
                        this.update().then(() => {
                            resolve()
                        })
                    })
                })
            })
        }
        update() {
            return new Promise((resolve) => {
                chrome.storage.local.get(null, async (result) => {
                    const meetData = result[getMeetCode()]
                    if (!meetData.hasOwnProperty('class')) {
                        resolve()
                        return
                    }
                    const className = meetData.class
                    const attendance = meetData.attendance
                    const rosters = result.rosters
                    const roster = rosters[className]
                    if (roster.length === 0) {
                        this.noStudentsEl.style.display = 'flex'
                    } else {
                        this.noStudentsEl.style.display = 'none'
                    }
                    const entries = []
                    const statusCounts = {
                        red: 0,
                        yellow: 0,
                        green: 0,
                        gray: 0,
                    }
                    let rosterChanged = false
                    for (const name in attendance) {
                        const timestamps = attendance[name]
                        let inRoster = false
                        let i = 0
                        while (!inRoster && i < roster.length) {
                            const testName = roster[i]
                            if (
                                testName
                                    .replace('|', ' ')
                                    .trim()
                                    .toLocaleUpperCase() ===
                                name
                                    .replace('|', ' ')
                                    .trim()
                                    .toLocaleUpperCase()
                            ) {
                                inRoster = true
                                const minsPresent = Utils.minsPresent(
                                    timestamps
                                )
                                if (
                                    minsPresent >= result['presence-threshold']
                                ) {
                                    if (timestamps.length % 2 === 1) {
                                        entries.push({
                                            name: name,
                                            color: 'green',
                                            tooltip: 'Present',
                                            icon: 'check_circle',
                                            text: `Joined at ${Utils.toTimeString(
                                                timestamps[0]
                                            )}`,
                                            index: 2,
                                        })
                                        statusCounts.green++
                                    } else {
                                        entries.push({
                                            name: name,
                                            color: 'yellow',
                                            tooltip: 'Previously Present',
                                            icon: 'watch_later',
                                            text: `Last seen at ${Utils.toTimeString(
                                                timestamps[
                                                    timestamps.length - 1
                                                ]
                                            )}`,
                                            index: 1,
                                        })
                                        statusCounts.yellow++
                                    }
                                } else {
                                    entries.push({
                                        name: name,
                                        color: 'red',
                                        tooltip: 'Absent',
                                        icon: 'cancel',
                                        text: `Joined at ${Utils.toTimeString(
                                            timestamps[0]
                                        )}`,
                                        index: 0,
                                    })
                                    statusCounts.red++
                                }
                                if (testName !== name) {
                                    roster[i] = name
                                    if (!rosterChanged) {
                                        rosterChanged = true
                                    }
                                }
                            }
                            i++
                        }
                        if (!inRoster) {
                            entries.push({
                                name: name,
                                color: 'gray',
                                tooltip: 'Not on List',
                                icon: 'error',
                                text: `Joined at ${Utils.toTimeString(
                                    timestamps[0]
                                )}`,
                                index: -1,
                            })
                            statusCounts.gray++
                        }
                    }
                    if (rosterChanged) {
                        await new Promise((resolve) => {
                            chrome.storage.local.set({ rosters: rosters }, () =>
                                resolve()
                            )
                        })
                    }
                    const attendanceNames = Object.keys(attendance).map((key) =>
                        key.toLocaleUpperCase()
                    )
                    for (const name of roster) {
                        if (
                            !attendanceNames.includes(name.toLocaleUpperCase())
                        ) {
                            entries.push({
                                name: name,
                                color: 'red',
                                tooltip: 'Absent',
                                icon: 'cancel',
                                text: 'Not here',
                                index: 0,
                            })
                            statusCounts.red++
                        }
                    }
                    entries.sort(this.sortMethods[this.sortMethod])
                    if (statusCounts.gray === 0 && this.jumpButtonEl.primed) {
                        this.jumpButtonEl.primed = false
                    }
                    this.rosterStatusEl.innerHTML = ''
                    entries.forEach((entry, index) => {
                        if (
                            entry.index === -1 &&
                            (index === 0 || entries[index - 1].index !== -1)
                        ) {
                            this.rosterStatusEl.appendChild(
                                this.unlistedTemplate.content.cloneNode(true)
                            )
                            this.unlistedPos = 61 * index

                            if (!this.jumpButtonEl.primed) {
                                this.jumpButtonEl.primed = true
                            }
                            document
                                .getElementById('add-all-unlisted')
                                .addEventListener('click', () => {
                                    this.rostersCache = rosters
                                    const nons = entries
                                        .filter((entry) => entry.index === -1)
                                        .map((non) => non.name)
                                    this.addStudents(...nons)
                                    showSnackbar(
                                        `Added ${nons.length} student${
                                            nons.length === 1 ? '' : 's'
                                        } to class.`,
                                        'undo'
                                    )
                                })
                        }
                        const entryEl = this.initializeStudentElement(entry)
                        const metaButton = entryEl.querySelector(
                            '.mdc-icon-button'
                        )
                        const displayName = entryEl.querySelector(
                            '.mdc-list-item__primary-text'
                        ).textContent
                        if (entry.index === -1) {
                            metaButton.addEventListener('click', () => {
                                this.rostersCache = rosters
                                this.addStudents(entry.name).then(() => {
                                    showSnackbar(
                                        `Added ${displayName} to class.`,
                                        'undo'
                                    )
                                })
                            })
                        } else {
                            metaButton.addEventListener('click', () => {
                                this.rostersCache = rosters
                                this.removeStudent(entry.name).then(() => {
                                    showSnackbar(
                                        `Removed ${displayName} from class.`,
                                        'undo'
                                    )
                                })
                            })
                        }
                        this.rosterStatusEl.appendChild(entryEl)
                    })
                    if (roster.length > 0) {
                        this.rosterStatusEl.removeChild(
                            this.rosterStatusEl.firstElementChild
                        )
                        for (const color in this.statusBars) {
                            const bar = this.statusBars[color]
                            bar.style.width = `${
                                (100 * statusCounts[color]) / roster.length
                            }%`
                            const prefix = bar
                                .getAttribute('aria-label')
                                .split(':')[0]
                            bar.setAttribute(
                                'aria-label',
                                `${prefix}: ${statusCounts[color]}/${roster.length}`
                            )
                            this.statusCountEls[
                                color
                            ].innerHTML = `<b>${statusCounts[color]
                                .toString()
                                .padStart(
                                    roster.length.toString().length,
                                    '0'
                                )}</b>/${roster.length}`
                        }
                    }
                    this.statusCountEls[
                        'gray'
                    ].innerHTML = `<b>${statusCounts.gray}</b>`
                    this.statusCountEls['gray'].setAttribute(
                        'aria-label',
                        `Not on List: ${statusCounts.gray}`
                    )
                    resolve()
                })
            })
        }
        initializeStudentElement(entry) {
            const metaIcon = entry.index === -1 ? 'add_circle' : 'remove_circle'
            const metaTooltip =
                entry.index === -1 ? 'Add to Class' : 'Remove from Class'
            const realName = entry.name.replace('|', ' ').trim()
            const entryEl = this.studentTemplate.content.cloneNode(true)
            const statusIcon = entryEl.querySelector('.mdc-list-item__graphic')
            statusIcon.classList.add(entry.color)
            statusIcon.setAttribute('aria-label', entry.tooltip)
            statusIcon.setAttribute('data-tooltip', entry.tooltip)
            entryEl.querySelector(
                '.mdc-list-item__primary-text'
            ).textContent = realName
            entryEl.querySelector(
                '.mdc-list-item__secondary-text'
            ).textContent = entry.text
            const metaButton = entryEl.querySelector('.mdc-icon-button')
            metaButton.setAttribute('aria-label', metaTooltip)
            metaButton.setAttribute('data-tooltip', metaTooltip)
            metaButton.textContent = metaIcon
            return entryEl
        }
        addStudents(...names) {
            return new Promise((resolve) => {
                chrome.storage.local.get(null, (result) => {
                    const className = result[getMeetCode()].class
                    const rosters = result.rosters
                    rosters[className].push(...names)
                    chrome.storage.local.set({ rosters: rosters }, () => {
                        this.update().then(() => {
                            resolve()
                        })
                    })
                })
            })
        }
        removeStudent(name) {
            return new Promise((resolve) => {
                chrome.storage.local.get(null, (result) => {
                    const className = result[getMeetCode()].class
                    const rosters = result.rosters
                    rosters[className] = rosters[className].filter(
                        (n) => n !== name
                    )
                    chrome.storage.local.set({ rosters: rosters }, () => {
                        this.update().then(() => {
                            resolve()
                        })
                    })
                })
            })
        }
        undo() {
            return new Promise((resolve) => {
                if (this.rostersCache == undefined) {
                    resolve()
                } else {
                    chrome.storage.local.set(
                        { rosters: this.rostersCache },
                        () => {
                            this.update().then(() => {
                                showSnackbar('Undo successful.')
                                resolve()
                            })
                        }
                    )
                }
            })
        }
        get hidden() {
            return this.container.hidden
        }
        set hidden(value) {
            this.container.hidden = value
        }
    }
    class EditScreen {
        constructor(containerEl) {
            this.container = containerEl
            const textFieldEls = this.container.querySelectorAll(
                '.mdc-text-field'
            )
            this.classNameField = new MDCTextField(textFieldEls[0])
            this.rosterField = new MDCChipSetTextField(textFieldEls[1])

            this.onCancel = (referrer) => {}
            this.onSave = (referrer, previousClassName, className) => {}

            this.container
                .querySelector('.save-class')
                .addEventListener('click', () => {
                    const className = this.classNameField.value
                    const prevClassName = this.classNameField.initValue
                    chrome.storage.local.get('rosters', (result) => {
                        const rosters = result.rosters
                        if (className === '') {
                            showSnackbar(
                                'Error: The class name cannot be empty.'
                            )
                        } else if (className.includes('§')) {
                            showSnackbar(
                                'Error: The class name cannot contain the character §.'
                            )
                        } else if (
                            rosters.hasOwnProperty(className) &&
                            className !== prevClassName
                        ) {
                            showSnackbar(
                                'Error: You already have a class with that name.'
                            )
                        } else {
                            const roster = this.rosterField.chipTexts
                            rosters[className] = roster
                            const items = { rosters: rosters }
                            delete this.classNameField.initValue
                            if (
                                prevClassName !== '' &&
                                prevClassName !== className
                            ) {
                                const code = getMeetCode()
                                port.postMessage({
                                    data: 'rename',
                                    code: code,
                                    oldClassName: prevClassName,
                                    newClassName: className,
                                })
                                delete rosters[prevClassName]
                                for (const key in result) {
                                    const data = result[key]
                                    if (
                                        data.hasOwnProperty('class') &&
                                        data.class === prevClassName
                                    ) {
                                        data.class = className
                                        items[key] = data
                                    }
                                }
                            }
                            chrome.storage.local.set(items, () => {
                                showSnackbar(
                                    `Successfully saved class ${className}.`
                                )
                                this.onSave(
                                    this.referrer,
                                    prevClassName,
                                    className
                                )
                            })
                        }
                    })
                })
            this.container
                .querySelector('.back')
                .addEventListener('click', () => {
                    this.onCancel(this.referrer)
                })
            this.container
                .querySelector('.help')
                .addEventListener('click', iveFallenAndICantGetUp)
        }
        startEditing(referrer, className) {
            this.referrer = referrer
            this.classNameField.value = className
            this.classNameField.initValue = className
            return new Promise((resolve) => {
                chrome.storage.local.get('rosters', (result) => {
                    const rosters = result.rosters
                    const roster = rosters.hasOwnProperty(className)
                        ? rosters[className]
                        : []
                    this.rosterField.refresh(
                        roster.map((name) => name.replace('|', ' ').trim())
                    )
                    resolve()
                })
            })
        }
        get hidden() {
            return this.container.hidden
        }
        set hidden(value) {
            this.container.hidden = value
        }
    }

    const selectDialogEl = document.getElementById('select')
    const selectDialog = new MDCDialog(selectDialogEl)

    const cardEl = document.getElementById('card')
    function toggleCard() {
        cardEl.expanded = !cardEl.expanded
    }
    function resizeCard() {
        if (buttonTray) {
            cardEl.style.width = buttonTray.offsetWidth + 'px'
        }
    }
    Object.defineProperty(cardEl, 'expanded', {
        get: function () {
            return !this.classList.contains('collapsed')
        },
        set: function (value) {
            if (value) {
                buttonTray.style.borderRadius = '0px'
                attendanceButton.classList.remove('IeuGXd')
                cardEl.classList.remove('collapsed')
            } else {
                setTimeout(() => {
                    buttonTray.style.borderRadius = '0 0 0 8px'
                }, 250)
                attendanceButton.classList.add('IeuGXd')
                cardEl.classList.add('collapsed')
            }
        },
    })
    const cardClassScreen = new ClassScreen(cardEl.querySelector('.class-view'))
    const cardStudentScreen = new StudentScreen(
        cardEl.querySelector('.student-view')
    )
    const cardEditScreen = new EditScreen(cardEl.querySelector('.edit-view'))

    // show selection dialog if necessary
    chrome.storage.local.get(null, (result) => {
        const code = getMeetCode()
        if (!result.hasOwnProperty(code) && result['show-popup']) {
            initializeDialog().then(() => {
                selectDialog.open()
                selectDialog.scrimClickAction = ''
                selectDialog.escapeKeyAction = ''
                selectDialog.autoStackButtons = false
            })
        } else {
            initializeCard()
        }
    })

    const confirmDeleteDialog = new MDCDialog(
        document.getElementById('delete-dialog')
    )
    const deleteButtonEl = document.getElementById('confirm-delete')
    confirmDeleteDialog.listen('MDCDialog:opening', () => {
        document.getElementById(
            'delete-dialog-content'
        ).textContent = `Are you sure you want to delete the class ${deleteButtonEl.classToDelete}?`
    })
    function confirmDelete(className) {
        deleteButtonEl.classToDelete = className
        confirmDeleteDialog.open()
    }
    deleteButtonEl.addEventListener('click', () => {
        const className = deleteButtonEl.classToDelete
        deleteButtonEl.operation(className).then(() => {
            showSnackbar(`Successfully deleted class ${className}.`)
        })
    })

    function initializeDialog() {
        return new Promise((resolve) => {
            const selectButton = document.getElementById('select-button')
            const classList = new MDCList(
                selectDialogEl.querySelector('.class-list')
            )
            classList.singleSelection = true
            selectButton.addEventListener('click', () => {
                initializeCard().then(() => {
                    const className =
                        classList.listElements[classList.selectedIndex].name
                    cardStudentScreen.chooseClass(className)
                })
            })

            const dialogClassScreen = new ClassScreen(
                selectDialogEl.querySelector('.class-view')
            )
            const dialogEditScreen = new EditScreen(
                selectDialogEl.querySelector('.edit-view')
            )
            dialogClassScreen.onAdd = () => {
                dialogClassScreen.hidden = true
                dialogEditScreen.hidden = false
                dialogEditScreen.startEditing(dialogClassScreen, '')
            }
            dialogClassScreen.onEdit = (className) => {
                dialogClassScreen.hidden = true
                dialogEditScreen.hidden = false
                dialogEditScreen.startEditing(dialogClassScreen, className)
            }
            dialogClassScreen.onSelect = () => {
                if (classList.selectedIndex === -1) {
                    selectButton.disabled = true
                } else {
                    selectButton.disabled = false
                }
            }
            dialogEditScreen.onCancel = (referrer) => {
                referrer.hidden = false
                dialogEditScreen.hidden = true
            }
            dialogEditScreen.onSave = (
                referrer,
                previousClassName,
                className
            ) => {
                if (previousClassName === '') {
                    dialogClassScreen.addClass(className)
                } else if (previousClassName !== className) {
                    dialogClassScreen.renameClass(previousClassName, className)
                }
                referrer.hidden = false
                dialogEditScreen.hidden = true
                selectButton.disabled = true
            }
            deleteButtonEl.operation = (className) => {
                classList.selectedIndex = -1
                selectButton.disabled = true
                dialogClassScreen.deleteClass(className)
            }
            dialogClassScreen.initialize().then(() => {
                resolve()
            })
        })
    }

    function initializeCard() {
        return new Promise((resolve) => {
            cardClassScreen.onAdd = () => {
                cardClassScreen.hidden = true
                cardEditScreen.hidden = false
                cardEditScreen.startEditing(cardClassScreen, '')
            }
            cardClassScreen.onEdit = (className) => {
                cardClassScreen.hidden = true
                cardEditScreen.hidden = false
                cardEditScreen.startEditing(cardClassScreen, className)
            }
            cardClassScreen.onSelect = (className) => {
                cardStudentScreen.chooseClass(className).then(() => {
                    cardClassScreen.hidden = true
                    cardStudentScreen.hidden = false
                })
            }
            cardStudentScreen.onBack = () => {
                cardClassScreen.hidden = false
                cardStudentScreen.hidden = true
            }
            cardStudentScreen.onEdit = (className) => {
                cardStudentScreen.hidden = true
                cardEditScreen.hidden = false
                cardEditScreen.startEditing(cardStudentScreen, className)
            }
            cardEditScreen.onCancel = (referrer) => {
                referrer.hidden = false
                cardEditScreen.hidden = true
            }
            cardEditScreen.onSave = async (
                referrer,
                previousClassName,
                className
            ) => {
                if (previousClassName === '') {
                    cardClassScreen.addClass(className)
                } else if (previousClassName !== className) {
                    cardClassScreen.renameClass(previousClassName, className)
                }
                if (referrer === cardStudentScreen) {
                    if (previousClassName !== className) {
                        await cardStudentScreen.chooseClass(className)
                    }
                }
                referrer.hidden = false
                cardEditScreen.hidden = true
            }
            deleteButtonEl.operation = cardClassScreen.deleteClass.bind(
                cardClassScreen
            )
            cardClassScreen.initialize().then(() => {
                resolve()
            })
        })
    }

    const buttonTray = document.querySelector('.NzPR9b')

    // DOM observers and event listeners
    resizeCard()
    window.addEventListener('resize', resizeCard)
    new MutationObserver(resizeCard).observe(buttonTray, {
        childList: true,
        subtree: true,
    })

    new MutationObserver((mutations, me) => {
        if (document.querySelector('.CX8SS')) {
            chrome.runtime.sendMessage({ data: 'delete-tab' })
            chrome.storage.local.get('auto-export', (result) => {
                if (result['auto-export']) {
                    port.postMessage({ data: 'export', code: getMeetCode() })
                    Utils.log(`Exporting...`)
                }
                me.disconnect()
            })
        }
    }).observe(document.querySelector('.SSPGKf'), {
        childList: true,
        subtree: true,
    })

    const closedObserver = new MutationObserver((mutations, me) => {
        if (
            !document.querySelector(
                '.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.IWtuld.wBYOYb'
            )
        ) {
            cardEl.style.borderRadius = '0 0 0 8px'
            me.disconnect()
        }
    })

    const bigButtons = [...buttonTray.children].filter((child) =>
        child.classList.contains('uArJ5e')
    )
    for (let i = bigButtons.length - 2; i <= bigButtons.length - 1; i++) {
        bigButtons[i].addEventListener('click', () => {
            cardEl.style.borderRadius = '8px 0 0 8px'
            closedObserver.observe(
                document.getElementsByClassName('mKBhCf')[0],
                {
                    childList: true,
                    subtree: true,
                }
            )
        })
    }

    const attendanceButton = document.getElementById('attendance')
    attendanceButton.addEventListener('click', toggleCard)
    attendanceButton.addEventListener('keydown', (event) => {
        if (
            event.key === ' ' ||
            event.key === 'Enter' ||
            event.key === 'Spacebar'
        ) {
            toggleCard()
        }
    })

    for (const closeButton of document.querySelectorAll('.close-card')) {
        closeButton.addEventListener('click', () => {
            cardEl.expanded = false
        })
    }

    const exportButton = document.getElementById('export')
    exportButton.addEventListener('click', () => {
        port.postMessage({ data: 'export', code: getMeetCode() })
        exportButton.disabled = true
        Utils.log(`Exporting...`)
    })

    // snackbar management
    const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'))
    const snackbarButtons = {
        help: document.getElementById('snackbar-help'),
        open: document.getElementById('snackbar-open'),
        undo: document.getElementById('snackbar-undo'),
    }
    snackbarButtons.help.addEventListener('click', troubleshoot)
    snackbarButtons.open.addEventListener('click', openSpreadsheet)
    snackbarButtons.undo.addEventListener('click', () => {
        cardStudentScreen.undo()
    })

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

    // progress bar management
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

    for (const button of document.getElementsByClassName('mdc-button')) {
        new MDCRipple(button)
    }
    for (const button of document.getElementsByClassName('mdc-icon-button')) {
        const ripple = new MDCRipple(button)
        ripple.unbounded = true
    }

    function processAttendance(names) {
        const code = getMeetCode()
        return new Promise((resolve) => {
            chrome.storage.local.get(null, async (result) => {
                const timestamp = ~~(Date.now() / 1000)
                const codesToDelete = []
                for (const key in result) {
                    const data = result[key]
                    if (
                        data.hasOwnProperty('timestamp') &&
                        timestamp - data.timestamp >=
                            result['reset-interval'] * 3600
                    ) {
                        codesToDelete.push(key)
                        if (key !== code) {
                            delete result[key]
                        } else {
                            result[key] = {
                                attendance: {},
                                'start-timestamp': timestamp,
                            }
                        }
                    }
                }
                if (codesToDelete.length > 0) {
                    port.postMessage({
                        data: 'delete-meta',
                        codes: codesToDelete,
                    })
                }
                const meetData = result[code]
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
                    if (
                        !names.includes(name) &&
                        attendance.hasOwnProperty(name)
                    ) {
                        if (attendance[name].length % 2 === 1) {
                            attendance[name].push(timestamp)
                        }
                    }
                }
                chrome.storage.local.remove(codesToDelete, () => {
                    chrome.storage.local.set({ [code]: meetData }, () =>
                        resolve()
                    )
                })
                await cardStudentScreen.update()
            })
        })
    }

    function getMeetCode() {
        return document
            .getElementsByTagName('c-wiz')[0]
            .getAttribute('data-unresolved-meeting-id')
    }

    function openSpreadsheet() {
        chrome.storage.local.get('spreadsheet-id', (result) => {
            const id = result['spreadsheet-id']
            const url = `https://docs.google.com/spreadsheets/d/${id}`
            chrome.runtime.sendMessage({
                data: 'open-url',
                url: url,
            })
        })
    }
    function troubleshoot() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url:
                'https://github.com/tytot/attendance-for-google-meet#troubleshoot',
        })
    }
    function iveFallenAndICantGetUp() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: 'https://github.com/tytot/attendance-for-google-meet#usage',
        })
    }
}
