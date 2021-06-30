'use strict'
{
    // Initialize material design components
    const MDCRipple = mdc.ripple.MDCRipple
    const MDCList = mdc.list.MDCList
    const MDCDialog = mdc.dialog.MDCDialog
    const MDCMenu = mdc.menu.MDCMenu
    const MDCSnackbar = mdc.snackbar.MDCSnackbar
    const MDCLinearProgress = mdc.linearProgress.MDCLinearProgress
    const MDCTextField = mdc.textField.MDCTextField

    // Establish connection to background page
    const port = chrome.runtime.connect()

    /**
     * Represents a view that displays the user's classes in a list.
     *
     * @callback ClassScreen~addClassCallback
     *
     * @callback ClassScreen~editClassCallback
     * @param {string} className - The name of the class to be edited.
     *
     * @callback ClassScreen~selectClassCallback
     * @param {string} className - The name of the selected class.
     */
    class ClassScreen {
        /**
         * Creates a class screen.
         * @param {HTMLElement} containerEl - The element that will back the screen.
         */
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

            /**
             * Callback called when the user requests to add a class.
             * @type {ClassScreen~addClassCallback}
             */
            this.onAdd = () => {}

            /**
             * Callback called when the user requests to edit a class.
             * @type {ClassScreen~editClassCallback}
             */
            this.onEdit = (className) => {}

            /**
             * Callback called when the user selects a class.
             * @type {ClassScreen~selectClassCallback}
             */
            this.onSelect = (className) => {}
        }
        /**
         * Initializes the screen.
         * @returns {Promise} Promise indicating completion.
         */
        initialize() {
            return new Promise((resolve) => {
                chrome.storage.local.get('rosters', (result) => {
                    const rosters = result.rosters
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
                    if (this.classEls.length === 0) {
                        this.noClassesEl.style.display = 'flex'
                    }
                    resolve()
                })
            })
        }
        /**
         * Initializes a class list item element to append to the class list.
         * @param {string} className - The name of the class.
         * @returns {HTMLElement} The class list item element.
         */
        initializeClassElement(className) {
            const classEl =
                this.classElTemplate.content.firstElementChild.cloneNode(true)
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
        /**
         * Adds a class to the screen.
         * @param {string} className - The name of the class.
         */
        addClass(className) {
            const classEl = this.initializeClassElement(className)
            this.classListEl.appendChild(classEl)
            this.noClassesEl.style.display = 'none'
        }
        /**
         * Renames a class in the screen.
         * @param {string} oldClassName - The name of the class to rename.
         * @param {string} newClassName - The new name to rename the class to.
         */
        renameClass(oldClassName, newClassName) {
            const classElId = this.classIdMap.get(oldClassName)
            const classEl = document.getElementById(classElId)
            classEl.name = newClassName
            classEl.querySelector('.class-entry').textContent = newClassName
            this.classIdMap.delete(oldClassName)
            this.classIdMap.set(newClassName, classElId)
        }
        /**
         * Deletes a class from the screen.
         * @param {string} className - The name of the class.
         * @returns {Promise} Promise indicating completion.
         */
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

    /**
     * Represents a view that displays the attendance of the participants in the Meet with respect to the selected class.
     *
     * @callback StudentScreen~goBackCallback
     *
     * @callback StudentScreen~editClassCallback
     * @param {string} className - The name of the class to be edited.
     */
    class StudentScreen {
        /**
         * Creates and initializes a student screen.
         * @param {HTMLElement} containerEl - The element that will back the screen.
         */
        constructor(containerEl) {
            this.container = containerEl
            this.contentEl = this.container.querySelector('.student-content')
            this.classHeaderEl = this.container.querySelector('.class-header')
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
            /**
             * The position of the unlisted students divider on the y-axis of the screen.
             * @type {number}
             */
            this.unlistedPos = 0
            this.jumpButtonEl.addEventListener('click', () => {
                if (this.jumpButtonEl.primed) {
                    this.rosterStatusEl.parentElement.scrollTop =
                        this.unlistedPos
                }
            })
            this.jumpButtonEl.addEventListener('keydown', (event) => {
                if (
                    (event.key === ' ' ||
                        event.key === 'Enter' ||
                        event.key === 'Spacebar') &&
                    this.jumpButtonEl.primed
                ) {
                    this.rosterStatusEl.parentElement.scrollTop =
                        this.unlistedPos
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

            /**
             * Callback called when the user requests to go back to the previous screen.
             * @type {StudentScreen~goBackCallback}
             */
            this.onBack = () => {}

            /**
             * Callback called when the user requests to edit the selected class.
             * @type {StudentScreen~editClassCallback}
             */
            this.onEdit = (className) => {}

            this.container
                .querySelector('.back')
                .addEventListener('click', () => {
                    this.onBack()
                })
            this.container
                .querySelector('.edit-roster')
                .addEventListener('click', () => {
                    this.onEdit(this.selectedClass)
                })
        }
        /**
         * Changes the selected class and refreshes the screen.
         * @param {string} className - The name of the class to choose.
         * @returns {Promise} Promise indicating completion.
         */
        chooseClass(className) {
            const code = getMeetCode()
            return new Promise((resolve) => {
                chrome.storage.local.get(code, (result) => {
                    const meetData = result[code]
                    meetData.class = className
                    chrome.storage.local.set({ [code]: meetData }, () => {
                        this.contentEl.scrollTop = 0
                        this.classHeaderEl.textContent = className
                        this.selectedClass = className
                        this.update().then(() => {
                            resolve()
                        })
                    })
                })
            })
        }
        /**
         * Refreshes the screen with the latest attendance data for the chosen class.
         * @returns {Promise} Promise indicating completion.
         */
        update() {
            return new Promise((resolve) => {
                chrome.storage.local.get(null, async (result) => {
                    const meetData = result[getMeetCode()]
                    if (!meetData.hasOwnProperty('class')) {
                        return resolve()
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
                        /***
                         * Two names are considered equivalent if either
                         * 1. Their calculated first and last names are equal (e.g. Lin, Tyler and Tyler|Lin)
                         * or
                         * 2. They are equal without vertical bars (e.g. Wardell|Stephen Curry and Wardell Stephen|Curry)
                         */
                        const rosterIndex = roster.findIndex(
                            (testName) =>
                                (Utils.compareFirst(testName, name) === 0 &&
                                    Utils.compareLast(testName, name) === 0) ||
                                Utils.collator.compare(
                                    testName.replace('|', ' ').trim(),
                                    name.replace('|', ' ').trim()
                                ) === 0
                        )
                        if (rosterIndex === -1) {
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
                            continue
                        }
                        const minsPresent = Utils.minsPresent(timestamps)
                        const matchName = roster[rosterIndex]
                        /***
                         * If the roster and attendance names were considered equivalent, but their raw forms are inequal,
                         * set the name in the roster to the name from the attendance;
                         * this corrects instances in which the guessed first and last names were incorrect
                         */
                        if (matchName !== name) {
                            roster[rosterIndex] = name
                            rosterChanged = true
                        }
                        if (minsPresent >= result['presence-threshold']) {
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
                                        timestamps[timestamps.length - 1]
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
                    for (let i = 0; i < entries.length; i++) {
                        const entry = entries[i]
                        if (
                            entry.index === -1 &&
                            (i === 0 || entries[i - 1].index !== -1)
                        ) {
                            this.rosterStatusEl.appendChild(
                                this.unlistedTemplate.content.cloneNode(true)
                            )
                            this.unlistedPos = 61 * i

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
                        const metaButton =
                            entryEl.querySelector('.mdc-icon-button')
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
                    }
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
        /**
         * Initializes a student list item element to append to the student list.
         * @param {Object} entry - The details of the student's attendance status.
         * @param {number} entry.index - The status index of the entry.
         * @param {string} entry.name - The student's name.
         * @param {string} entry.color - The color of the status icon.
         * @param {string} entry.tooltip - The label for the student's status.
         * @param {string} entry.icon - The identifier of the status icon.
         * @param {string} entry.text - The secondary text below the student's name.
         * @returns {HTMLElement} The student list item element.
         */
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
            entryEl.querySelector('.mdc-list-item__primary-text').textContent =
                realName
            entryEl.querySelector(
                '.mdc-list-item__secondary-text'
            ).textContent = entry.text
            const metaButton = entryEl.querySelector('.mdc-icon-button')
            metaButton.setAttribute('aria-label', metaTooltip)
            metaButton.setAttribute('data-tooltip', metaTooltip)
            metaButton.textContent = metaIcon
            return entryEl
        }
        /**
         * Adds students to the roster of the selected class.
         * @param {...string} names - The names of the students to add.
         * @returns {Promise} Promise indicating completion.
         */
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
        /**
         * Removes a student from the roster of the selected class.
         * @param {string} name - The name of the student to remove.
         * @returns {Promise} Promise indicating completion.
         */
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
        /**
         * Undoes the last edit made to the roster of the selected class.
         * @returns {Promise} Promise indicating completion.
         */
        undo() {
            return new Promise((resolve) => {
                if (this.rostersCache == undefined) {
                    return resolve()
                }
                chrome.storage.local.set({ rosters: this.rostersCache }, () => {
                    this.update().then(() => {
                        showSnackbar('Undo successful.')
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

    /**
     * Represents a view that allows the user to edit the name and roster of a class.
     *
     * @callback EditScreen~cancelEditCallback
     * @param {Object} referrer - The screen that requested the current edit operation.
     *
     * @callback EditScreen~saveClassCallback
     * @param {Object} referrer - The screen that requested the current edit operation.
     * @param {string} previousClassName - The previous name of the class.
     * @param {string} className - The new name of the class.
     */
    class EditScreen {
        /**
         * Creates an edit screen.
         * @param {HTMLElement} containerEl - The element that will back the screen.
         */
        constructor(containerEl) {
            this.container = containerEl
            const textFieldEls =
                this.container.getElementsByClassName('mdc-text-field')
            this.classNameField = new MDCTextField(textFieldEls[0])
            this.rosterField = new MDCChipSetTextField(textFieldEls[1])

            /**
             * Callback called when the user cancels the edit operation.
             * @type {EditScreen~cancelEditCallback}
             */
            this.onCancel = (referrer) => {}

            /**
             * Callback called when the user saves the class.
             * @type {EditScreen~saveClassCallback}
             */
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
        }
        /**
         * Begins an edit operation for a class.
         * @param {Object} referrer - The screen that requested the edit operation.
         * @param {string} className - The name of the class to edit.
         * @returns {Promise} Promise indicating completion.
         */
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
                    this.rosterField.refresh(roster)
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

    // const selectDialogEl = document.getElementById('select')
    // const selectDialog = new MDCDialog(selectDialogEl)

    const panelEl = document.getElementById('panel')
    const panelClassScreen = new ClassScreen(
        panelEl.querySelector('.class-view')
    )
    const panelStudentScreen = new StudentScreen(
        panelEl.querySelector('.student-view')
    )
    const panelEditScreen = new EditScreen(panelEl.querySelector('.edit-view'))

    // show selection dialog if necessary
    // chrome.storage.local.get(null, (result) => {
    //     const code = getMeetCode()
    //     if (!result[code].hasOwnProperty('class') && result['show-popup']) {
    //         initializeDialog().then(() => {
    //             selectDialog.open()
    //             selectDialog.scrimClickAction = ''
    //             selectDialog.escapeKeyAction = ''
    //             selectDialog.autoStackButtons = false
    //         })
    //     } else {
    //         initializePanel()
    //     }
    // })

    const confirmDeleteDialog = new MDCDialog(
        document.getElementById('delete-dialog')
    )
    const deleteButtonEl = document.getElementById('confirm-delete')
    confirmDeleteDialog.listen('MDCDialog:opening', () => {
        document.getElementById(
            'delete-dialog-content'
        ).innerHTML = `Are you sure you want to delete the class <b>${deleteButtonEl.classToDelete}</b>?`
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

    initializePanel()

    // function initializeDialog() {
    //     return new Promise((resolve) => {
    //         const selectButton = document.getElementById('select-button')
    //         let classList = new MDCList(
    //             selectDialogEl.querySelector('.class-list')
    //         )
    //         classList.singleSelection = true
    //         classList.listen('MDCList:action', () => {
    //             selectButton.disabled = false
    //         })
    //         selectDialog.listen('MDCDialog:closing', initializePanel)
    //         selectButton.addEventListener('click', () => {
    //             const className =
    //                 classList.listElements[classList.selectedIndex].name
    //             panelStudentScreen.chooseClass(className)
    //             panelClassScreen.hidden = true
    //             panelStudentScreen.hidden = false
    //         })

    //         const dialogClassScreen = new ClassScreen(
    //             selectDialogEl.querySelector('.class-view')
    //         )
    //         const dialogEditScreen = new EditScreen(
    //             selectDialogEl.querySelector('.edit-view')
    //         )
    //         dialogClassScreen.onAdd = () => {
    //             dialogClassScreen.hidden = true
    //             dialogEditScreen.hidden = false
    //             dialogEditScreen.startEditing(dialogClassScreen, '')
    //         }
    //         dialogClassScreen.onEdit = (className) => {
    //             dialogClassScreen.hidden = true
    //             dialogEditScreen.hidden = false
    //             dialogEditScreen.startEditing(dialogClassScreen, className)
    //         }
    //         dialogEditScreen.onCancel = (referrer) => {
    //             referrer.hidden = false
    //             dialogEditScreen.hidden = true
    //         }
    //         dialogEditScreen.onSave = (
    //             referrer,
    //             previousClassName,
    //             className
    //         ) => {
    //             if (previousClassName === '') {
    //                 dialogClassScreen.addClass(className)
    //             } else if (previousClassName !== className) {
    //                 dialogClassScreen.renameClass(previousClassName, className)
    //             }
    //             referrer.hidden = false
    //             dialogEditScreen.hidden = true
    //         }
    //         deleteButtonEl.operation = async (className) => {
    //             classList.selectedIndex = -1
    //             selectButton.disabled = true
    //             dialogClassScreen.deleteClass(className)
    //         }
    //         dialogClassScreen.initialize().then(() => {
    //             resolve()
    //         })
    //     })
    // }

    function initializePanel() {
        document
            .getElementById('panel')
            .querySelector('.help')
            .addEventListener('click', iveFallenAndICantGetUp)
        return new Promise((resolve) => {
            panelClassScreen.onAdd = () => {
                panelClassScreen.hidden = true
                panelEditScreen.hidden = false
                panelEditScreen.startEditing(panelClassScreen, '')
            }
            panelClassScreen.onEdit = (className) => {
                panelClassScreen.hidden = true
                panelEditScreen.hidden = false
                panelEditScreen.startEditing(panelClassScreen, className)
            }
            panelClassScreen.onSelect = (className) => {
                panelStudentScreen.chooseClass(className).then(() => {
                    panelClassScreen.hidden = true
                    panelStudentScreen.hidden = false
                })
            }
            panelStudentScreen.onBack = () => {
                panelClassScreen.hidden = false
                panelStudentScreen.hidden = true
            }
            panelStudentScreen.onEdit = (className) => {
                panelStudentScreen.hidden = true
                panelEditScreen.hidden = false
                panelEditScreen.startEditing(panelStudentScreen, className)
            }
            panelEditScreen.onCancel = (referrer) => {
                referrer.hidden = false
                panelEditScreen.hidden = true
            }
            panelEditScreen.onSave = async (
                referrer,
                previousClassName,
                className
            ) => {
                if (previousClassName === '') {
                    panelClassScreen.addClass(className)
                } else if (previousClassName !== className) {
                    panelClassScreen.renameClass(previousClassName, className)
                }
                if (referrer === panelStudentScreen) {
                    if (previousClassName !== className) {
                        await panelStudentScreen.chooseClass(className)
                    } else {
                        await panelStudentScreen.update()
                    }
                }
                referrer.hidden = false
                panelEditScreen.hidden = true
            }
            deleteButtonEl.operation =
                panelClassScreen.deleteClass.bind(panelClassScreen)
            panelClassScreen.initialize().then(() => {
                const code = getMeetCode()
                chrome.storage.local.get(code, (result) => {
                    if (
                        result.hasOwnProperty(code) &&
                        result[code].hasOwnProperty('class')
                    ) {
                        panelClassScreen.hidden = true
                        panelStudentScreen.hidden = false
                        console.log(result[code].class)
                        panelStudentScreen.chooseClass(result[code].class)
                    }
                    resolve()
                })
            })
        })
    }

    // Detect when the user leaves the meet and exports if Export on Leave is enabled
    new MutationObserver((mutations, me) => {
        if (document.querySelector('.CX8SS')) {
            chrome.runtime.sendMessage({ data: 'delete-tab' })
            chrome.storage.local.get('auto-export', (result) => {
                if (result['auto-export']) {
                    port.postMessage({ data: 'export', code: getMeetCode() })
                }
                me.disconnect()
            })
        }
    }).observe(document.querySelector('.SSPGKf'), {
        childList: true,
        subtree: true,
    })

    const exportButton = document.getElementById('export')
    exportButton.addEventListener('click', () => {
        port.postMessage({ data: 'export', code: getMeetCode() })
        exportButton.disabled = true
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
        panelStudentScreen.undo()
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
        MDCRipple.attachTo(button)
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
                        delete result[key]
                    }
                }
                if (codesToDelete.length > 0) {
                    port.postMessage({
                        data: 'delete-meta',
                        codes: codesToDelete,
                    })
                    await new Promise((resolve) => {
                        chrome.storage.local.remove(codesToDelete, () => {
                            resolve()
                        })
                    })
                }
                const meetData = result[code] || {
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
                    if (
                        !names.includes(name) &&
                        attendance.hasOwnProperty(name)
                    ) {
                        if (attendance[name].length % 2 === 1) {
                            attendance[name].push(timestamp)
                        }
                    }
                }
                chrome.storage.local.set({ [code]: meetData }, () => {
                    resolve()
                })
            })
        })
    }

    function getMeetCode() {
        return document
            .querySelector('c-wiz')
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
            url: 'https://github.com/tytot/attendance-for-google-meet#troubleshoot',
        })
    }
    function iveFallenAndICantGetUp() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: 'https://github.com/tytot/attendance-for-google-meet#usage',
        })
    }

    // Listen for attendance data from proxied function
    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://meet.google.com') return
        if (event.data.sender !== 'Ya boi') return
        processAttendance(event.data.attendance).then(() => {
            panelStudentScreen.update()
        })
        // console.log('Updating...')
    })
}
