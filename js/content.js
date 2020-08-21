function storeNames(names) {
    const code = getMeetCode()
    chrome.storage.local.get(null, function (result) {
        const timestamp = ~~(Date.now() / 1000)

        let res = result[code]
        if (res == undefined) {
            res = {
                attendance: {},
                'start-timestamp': timestamp,
            }
        }
        let currentData = res.attendance
        res.timestamp = timestamp

        for (const name of names) {
            if (currentData[name] == undefined) {
                currentData[name] = [timestamp]
            } else if (currentData[name].length % 2 === 0) {
                currentData[name].push(timestamp)
            }
            if (names.includes(name)) {
                if (currentData[name].length % 2 === 0) {
                    currentData[name].push(timestamp)
                }
            } else {
                if (currentData[name].length % 2 === 1) {
                    currentData[name].push(timestamp)
                }
            }
        }
        for (const name in currentData) {
            if (!names.includes(name) && currentData[name]) {
                if (currentData[name].length % 2 === 1) {
                    currentData[name].push(timestamp)
                }
            }
        }

        const className = res.class
        if (className) {
            updateRosterStatus(currentData, result.rosters[className])
        }

        chrome.storage.local.set({ [code]: res })

        for (const key in result) {
            const data = result[key]
            if (data.hasOwnProperty('timestamp')) {
                if (timestamp - data.timestamp >= 86400) {
                    chrome.storage.local.remove([key])
                }
            }
        }
    })
}

function getVisibleAttendees(container, names) {
    const labels = document.getElementsByClassName('cS7aqe NkoVdd')
    for (const label of labels) {
        const name = label.innerHTML
        if (
            !names.includes(name) &&
            !name.endsWith(' (You)') &&
            !name.endsWith(' (Your Presentation)') &&
            !name.endsWith(' (Presentation)')
        ) {
            names.push(name)
        }
    }
    container.scrollTop = 56 * names.length
}

function takeAttendance() {
    const container = document.getElementsByClassName(
        'HALYaf tmIkuc s2gQvd KKjvXb'
    )[0]
    let lastNumNames = 0
    let names = []
    getVisibleAttendees(container, names)
    while (names.length !== lastNumNames) {
        lastNumNames = names.length
        setTimeout(function () {
            getVisibleAttendees(container, names)
        }, 100)
    }
    container.scrollTop = 0
    storeNames(names)
}

let sortMethod = 'lastName'
function setSortMethod(method) {
    sortMethod = method
}

function updateRosterStatus(attendance, roster) {
    const rosterStatus = document.getElementById('roster-status')
    rosterStatus.innerHTML = ''
    let entries = []

    const bigRoster = roster.map((name) => name.toLocaleUpperCase())
    for (const name in attendance) {
        const arr = attendance[name]
        if (bigRoster.includes(name.toLocaleUpperCase())) {
            if (arr.length % 2 === 1) {
                entries.push({
                    name: name,
                    color: 'green',
                    tooltip: 'Present',
                    icon: 'check_circle',
                    text: `Joined at ${toTimeString(arr[0])}`,
                    index: 2,
                })
            } else {
                entries.push({
                    name: name,
                    color: 'yellow',
                    tooltip: 'Previously Present',
                    icon: 'watch_later',
                    text: `Last seen at ${toTimeString(arr[arr.length - 1])}`,
                    index: 1,
                })
            }
        } else {
            entries.push({
                name: name,
                color: 'gray',
                tooltip: 'Not on List',
                icon: 'error',
                text: `Joined at ${toTimeString(arr[0])}`,
                index: -1,
            })
        }
    }
    const bigAttendance = Object.keys(attendance).map((key) =>
        key.toLocaleUpperCase()
    )
    for (const name of roster) {
        if (!bigAttendance.includes(name.toLocaleUpperCase())) {
            entries.push({
                name: name,
                color: 'red',
                tooltip: 'Absent',
                icon: 'cancel',
                text: 'Not here',
                index: 0,
            })
        }
    }

    if (sortMethod === 'firstName') {
        var compare = (a, b) => {
            const aFirstName = a.name.split(' ')[0]
            const bFirstName = b.name.split(' ')[0]
            return aFirstName.localeCompare(bFirstName)
        }
    } else if (sortMethod === 'lastName') {
        compare = (a, b) => {
            const aName = a.name.split(' ')
            const bName = b.name.split(' ')
            const aLastName = aName[aName.length - 1]
            const bLastName = bName[bName.length - 1]
            return aLastName.localeCompare(bLastName)
        }
    } else if (sortMethod === 'presentFirst') {
        compare = (a, b) => {
            return b.index - a.index
        }
    } else {
        compare = (a, b) => {
            if (a.index === -1) {
                a.index = 3
            }
            if (b.index === -1) {
                b.index = 3
            }
            return a.index - b.index
        }
    }
    entries.sort(compare)
    for (const entry of entries) {
        rosterStatus.insertAdjacentHTML(
            'beforeend',
            `<li class="mdc-list-item mdc-ripple-surface" tabindex="0">
                <span
                    class="mdc-list-item__graphic material-icons ${entry.color}"
                    jscontroller="VXdfxd"
                    jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                    tabindex="0"
                    aria-label="${entry.tooltip}"
                    data-tooltip="${entry.tooltip}"
                    data-tooltip-vertical-offset="-12"
                    data-tooltip-horizontal-offset="0"
                >
                    ${entry.icon}
                </span>

                <span class="mdc-list-item__text">
                    <span class="mdc-list-item__primary-text">
                        ${entry.name}
                    </span>
                    <span class="mdc-list-item__secondary-text">
                        ${entry.text}
                    </span>
                </span>
            </li>
            <li class="mdc-list-divider" role="separator"></li>`
        )
    }
}

function getMeetCode() {
    return document.title.substring(7)
}

function openSpreadsheet() {
    chrome.storage.local.get('spreadsheet-id', function (result) {
        const id = result['spreadsheet-id']
        const url = `https://docs.google.com/spreadsheets/d/${id}`
        chrome.runtime.sendMessage({
            data: 'open-sheet',
            url: url,
        })
    })
}

function showCard() {
    document.getElementsByClassName('NzPR9b')[0].style.borderRadius = '0px'
    const attendanceButton = document.getElementById('attendance')
    attendanceButton.classList.remove('IeuGXd')
    document.getElementById('card').style.visibility = 'visible'
}

function hideCard() {
    document.getElementsByClassName('NzPR9b')[0].style.borderRadius =
        '0 0 0 8px'
    const attendanceButton = document.getElementById('attendance')
    attendanceButton.classList.add('IeuGXd')
    document.getElementById('card').style.visibility = 'hidden'
}

function getClassHTML(className) {
    return `<li
        class="mdc-list-item mdc-list-item--class"
        role="option"
        tabindex="0"
    >
        <span class="mdc-list-item__ripple"></span>
        <span
            class="mdc-list-item__graphic material-icons"
            aria-hidden="true"
        >
            perm_identity
        </span>
        <span class="mdc-list-item__text class-entry">
            ${className}
        </span>
        <div class="mdc-list-item__meta">
            <button
                class="mdc-icon-button material-icons edit-class"
                aria-label="Edit"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Edit"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                edit
            </button>
            <button
                class="mdc-icon-button material-icons delete-class"
                aria-haspopup="menu"
                aria-label="Delete"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Delete"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                delete
            </button>
        </div>
    </li>`
}

function initializeClasses() {
    return new Promise((resolve) => {
        chrome.storage.local.get('rosters', function (result) {
            let res = result['rosters']
            if (res == undefined) {
                res = {}
                chrome.storage.local.set({ rosters: res })
            }

            const classList = document.getElementById('class-list')
            let classes = []
            for (const className in res) {
                classList.insertAdjacentHTML(
                    'beforeend',
                    getClassHTML(className)
                )
                const classEl = classList.lastChild
                classEl.name = className
                classEl.roster = res[className]
                classes.push(classEl)
            }
            resolve(classes)
        })
    })
}

function addClass(className, roster, set = false) {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, function (result) {
            let res = result['rosters']
            res[className] = roster
            chrome.storage.local.set({ rosters: res })
            if (set) {
                const code = getMeetCode()
                result[code].class = className
                chrome.storage.local.set({ [code]: result[code] })
            }

            const classList = document.getElementById('class-list')
            classList.insertAdjacentHTML('beforeend', getClassHTML(className))
            const classEl = classList.lastChild
            classEl.name = className
            classEl.roster = res[className]

            resolve(classEl)
        })
    })
}

function deleteClass(className) {
    return new Promise((resolve) => {
        chrome.storage.local.get('rosters', function (result) {
            let res = result['rosters']
            delete res[className]
            chrome.storage.local.set({ rosters: res })

            const classList = document.getElementById('class-list')
            const classEls = classList.getElementsByTagName('li')
            for (const classEl of classEls) {
                if (classEl.name === className) {
                    classList.removeChild(classEl)
                }
            }
            resolve()
        })
    })
}

const peopleObserver = new MutationObserver(function (mutations, me) {
    const container = document.getElementsByClassName(
        'HALYaf tmIkuc s2gQvd KKjvXb'
    )[0]
    if (!container) {
        document.getElementsByClassName('gV3Svc')[1].click()
        tabObserver.observe(document.getElementsByClassName('mKBhCf')[0], {
            childList: true,
            subtree: true,
        })
    } else {
        listObserver.observe(
            document.getElementsByClassName('HALYaf tmIkuc s2gQvd KKjvXb')[0],
            {
                childList: true,
                subtree: true,
            }
        )
    }
})

const tabObserver = new MutationObserver(function (mutations, me) {
    const numAttendees =
        parseInt(
            document.querySelector("[jsname='EydYod']").textContent.slice(1, -1)
        ) - 1
    const names = document.getElementsByClassName('cS7aqe NkoVdd')
    if (numAttendees === 0) {
        takeAttendance()
        me.disconnect()
    } else {
        if (names[1] != undefined) {
            listObserver.observe(
                document.getElementsByClassName(
                    'HALYaf tmIkuc s2gQvd KKjvXb'
                )[0],
                {
                    childList: true,
                    subtree: true,
                }
            )
            me.disconnect()
        }
    }
})

const closedObserver = new MutationObserver(function (mutations, me) {
    if (
        !document.getElementsByClassName(
            'VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ IWtuld wBYOYb'
        )[0]
    ) {
        document.getElementById('card').style.borderRadius = '0 0 0 8px'
        me.disconnect()
    }
})

const listObserver = new MutationObserver(function (mutations, me) {
    takeAttendance()
    me.disconnect()
})

const trayObserver = new MutationObserver(function (mutations, me) {
    const tray = document.getElementsByClassName('lvE3se')[0]
    if (tray) {
        const trayWidth = tray.offsetWidth
        document.getElementById('card').style.width = trayWidth + 'px'
    }
})

const readyObserver = new MutationObserver(function (mutations, me) {
    if (document.getElementsByClassName('wnPUne N0PJ8e')[0]) {
        document.body.insertAdjacentHTML('afterbegin', selectDialogHTML)
        document.body.insertAdjacentHTML('afterbegin', snackbarHTML)

        const bar = document.getElementsByClassName('NzPR9b')[0]
        bar.insertAdjacentHTML('afterbegin', buttonHTML)

        const attendanceButton = document.getElementById('attendance')
        attendanceButton.addEventListener('click', showCard)
        attendanceButton.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.keyCode === 13) {
                showCard()
            }
        })

        const screen = document.getElementsByClassName('crqnQb')[0]
        screen.insertAdjacentHTML('afterbegin', cardHTML)

        for (const closeButton of document.getElementsByClassName(
            'close-card'
        )) {
            closeButton.addEventListener('click', hideCard)
        }

        for (let i = 1; i <= 2; i++) {
            document
                .getElementsByClassName('uArJ5e UQuaGc kCyAyd kW31ib foXzLb')
                [i].addEventListener('click', () => {
                    document.getElementById('card').style.borderRadius =
                        '8px 0 0 8px'
                    closedObserver.observe(
                        document.getElementsByClassName('mKBhCf')[0],
                        {
                            childList: true,
                            subtree: true,
                        }
                    )
                })
        }

        trayObserver.observe(document.getElementsByClassName('lvE3se')[0], {
            childList: true,
            subtree: true,
        })
        window.addEventListener('resize', () => {
            const trayWidth = document.getElementsByClassName('lvE3se')[0]
                .offsetWidth
            document.getElementById('card').style.width = trayWidth + 'px'
        })
        document.getElementById('card').style.visibility = 'hidden'

        const showEveryone = document.querySelector(
            '[aria-label="Show everyone"]'
        )
        showEveryone.classList.remove('IeuGXd')

        me.disconnect()
        chrome.runtime.sendMessage({
            data: 'mdc',
        })
        peopleObserver.observe(
            document.getElementsByClassName('wnPUne N0PJ8e')[0],
            {
                childList: true,
            }
        )
    }
})

readyObserver.observe(document.getElementsByClassName('crqnQb')[0], {
    childList: true,
    subtree: true,
})

const cardHTML = `<div
class="mdc-card"
id="card"
style="
    position: fixed;
    top: 48px;
    right: 0;
    z-index: 101;
    width: 304px;
    border-radius: 0 0 0 8px;
"
aria-label="Attendance management"
>
    <div hidden id="card-class-view">
        <div class="mdc-card-header">
            <div>
                <h2 class="CkXZgc card-title">
                    Select Class
                </h2>
            </div>
            <button
                class="mdc-icon-button medium-button material-icons right"
                style="right: 32px;"
                aria-label="Help"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Help"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                help_outline
            </button>
            <button
                class="mdc-icon-button medium-button material-icons right close-card"
                aria-label="Exit"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Exit"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                close
            </button>
        </div>
        <div class="mdc-list-divider" role="separator"></div>
        <div>
            <ul class="mdc-list" id="class-list" role="listbox"></ul>
            <button class="mdc-button" id="add-class">
                <div class="mdc-button__ripple"></div>
                <i class="material-icons mdc-button__icon" aria-hidden="true"
                    >add</i
                >
                <span class="mdc-button__label">Add Class</span>
            </button>
        </div>
        <div
            role="progressbar"
            class="mdc-linear-progress"
            aria-valuemin="0"
            aria-valuemax="1"
            aria-valuenow="0"
        >
            <div class="mdc-linear-progress__buffer">
                <div class="mdc-linear-progress__buffer-bar"></div>
                <div class="mdc-linear-progress__buffer-dots"></div>
            </div>
            <div
                class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
            >
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
            <div
                class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar"
            >
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
        </div>
        <div class="mdc-card__actions">
            <button
                class="mdc-button mdc-button--raised mdc-card__action mdc-card__action--button export-button"
                disabled
            >
                <div class="mdc-button__ripple"></div>
                <span class="mdc-button__label">Export</span>
            </button>
        </div>
    </div>
    <div id="card-default-view">
        <div class="mdc-card-header">
            <div class="mdc-menu-surface--anchor right" style="right: 40px;">
                <div
                    class="mdc-menu mdc-menu-surface"
                    id="sort-menu"
                    role="menu"
                >
                    <ul class="mdc-list mdc-list--dense">
                        <li
                            class="mdc-list-item mdc-ripple-surface"
                            id="firstName"
                            role="menuitem"
                            tabindex="0"
                        >
                            <span class="mdc-list-item__text"
                                >Sort by First Name (A - Z)</span
                            >
                        </li>
                        <li
                            class="mdc-list-item mdc-ripple-surface"
                            id="lastName"
                            role="menuitem"
                            tabindex="0"
                        >
                            <span class="mdc-list-item__text"
                                >Sort by Last Name (A - Z)</span
                            >
                        </li>
                        <li
                            class="mdc-list-item mdc-ripple-surface"
                            id="presentFirst"
                            role="menuitem"
                            tabindex="0"
                        >
                            <span class="mdc-list-item__text"
                                >Sort by Presence (Present First)</span
                            >
                        </li>
                        <li
                            class="mdc-list-item mdc-ripple-surface"
                            id="absentFirst"
                            role="menuitem"
                            tabindex="0"
                        >
                        <span class="mdc-list-item__text"
                            >Sort by Presence (Absent First)</span
                        >
                    </li>
                    </ul>
                </div>
            </div>
            <button
                class="mdc-icon-button medium-button material-icons left"
                id="default-back"
                aria-label="Back"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Back"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                arrow_back
            </button>
            <div>
                <h2 class="CkXZgc card-title" id="class-label">
                    View Class
                </h2>
            </div>
            <button
                class="mdc-icon-button medium-button material-icons right more"
                style="right: 32px;"
                aria-label="Sort Options"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Sort Options"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                settings
            </button>
            <button
                class="mdc-icon-button medium-button material-icons right close-card"
                aria-label="Exit"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Exit"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                close
            </button>
        </div>
        <div class="mdc-list-divider" role="separator"></div>
        <div>
            <div style="text-align: center;">
                <button class="mdc-button" id="edit-roster">
                    <div class="mdc-button__ripple"></div>
                    <i
                        class="material-icons mdc-button__icon"
                        aria-hidden="true"
                        >edit</i
                    >
                    <span class="mdc-button__label">Edit Class</span>
                </button>
            </div>
            <div class="mdc-list-divider" role="separator"></div>
            <div
                class="mdc-card-content"
                style="max-height: 50vh; overflow: auto;"
            >
                <ul
                    class="mdc-list mdc-list--dense mdc-list--two-line"
                    id="roster-status"
                ></ul>
            </div>
        </div>
        <div
            role="progressbar"
            class="mdc-linear-progress"
            id="progress-bar"
            aria-label="Export Progress"
            aria-valuemin="0"
            aria-valuemax="1"
            aria-valuenow="0"
        >
            <div class="mdc-linear-progress__buffer">
                <div class="mdc-linear-progress__buffer-bar"></div>
                <div class="mdc-linear-progress__buffer-dots"></div>
            </div>
            <div
                class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
            >
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
            <div
                class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar"
            >
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
        </div>
        <div class="mdc-card__actions">
            <button
                class="mdc-button mdc-button--raised mdc-card__action mdc-card__action--button export-button"
                id="export"
            >
                <div class="mdc-button__ripple"></div>
                <span class="mdc-button__label">Export</span>
            </button>
        </div>
    </div>
    <div hidden id="card-edit-view">
        <div class="mdc-card-header">
            <button
                class="mdc-icon-button medium-button material-icons left"
                id="edit-back"
                aria-label="Cancel"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Cancel"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                arrow_back
            </button>
            <div>
                <h2 class="CkXZgc card-title">
                    Add/Edit Class
                </h2>
            </div>
            <button
                class="mdc-icon-button medium-button material-icons right close-card"
                aria-label="Exit"
                jscontroller="VXdfxd"
                jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                tabindex="0"
                data-tooltip="Exit"
                data-tooltip-vertical-offset="-12"
                data-tooltip-horizontal-offset="0"
            >
                close
            </button>
        </div>
        <div class="mdc-list-divider" role="separator"></div>
        <div>
            <div style="text-align: center;">
                <button class="mdc-button confirm-roster" id="save-class">
                    <div class="mdc-button__ripple"></div>
                    <i
                        class="material-icons mdc-button__icon"
                        aria-hidden="true"
                        >assignment_turned_in</i
                    >
                    <span class="mdc-button__label">Save</span>
                </button>
            </div>
            <div class="mdc-list-divider" role="separator"></div>
            <div
                class="mdc-card-content"
                style="max-height: 50vh; overflow: auto;"
            >
                <div class="label CkXZgc" style="margin-top: 8px;">
                    Class Name
                </div>
                <label
                    class="class-name-field mdc-text-field mdc-text-field--outlined"
                >
                    <input type="text" class="mdc-text-field__input" />
                    <span class="mdc-notched-outline">
                        <span class="mdc-notched-outline__leading"></span>
                        <span class="mdc-notched-outline__trailing"></span>
                    </span>
                </label>
                <div class="label CkXZgc">Student Names</div>
                <label
                    class="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea mdc-text-field--no-label"
                >
                    <div
                        class="mdc-chip-set mdc-chip-set--input"
                        role="grid"
                    ></div>
                    <textarea
                        class="mdc-text-field__input"
                        rows="6"
                        cols="100"
                        aria-label="Enter Student Names"
                        aria-controls="student-helper-id"
                        aria-describedby="student-helper-id"
                    ></textarea>
                    <span class="mdc-notched-outline">
                        <span class="mdc-notched-outline__leading"></span>
                        <span class="mdc-notched-outline__notch"> </span>
                        <span class="mdc-notched-outline__trailing"></span>
                    </span>
                </label>
                <div
                    class="mdc-text-field-helper-line"
                    style="margin-bottom: 8px;"
                >
                    <div
                        class="mdc-text-field-helper-text"
                        id="student-helper-id"
                        aria-hidden="true"
                    >
                        Ex: Tony Vlachos, Natalie Anderson, Michele Fitzgerald
                    </div>
                </div>
            </div>
        </div>
        <div
            role="progressbar"
            class="mdc-linear-progress"
            aria-valuemin="0"
            aria-valuemax="1"
            aria-valuenow="0"
        >
            <div class="mdc-linear-progress__buffer">
                <div class="mdc-linear-progress__buffer-bar"></div>
                <div class="mdc-linear-progress__buffer-dots"></div>
            </div>
            <div
                class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
            >
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
            <div
                class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar"
            >
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
        </div>
        <div class="mdc-card__actions">
            <button
                class="mdc-button mdc-button--raised mdc-card__action mdc-card__action--button export-button"
                disabled
            >
                <div class="mdc-button__ripple"></div>
                <span class="mdc-button__label">Export</span>
            </button>
        </div>
    </div>
</div>`

const selectDialogHTML = `<div class="mdc-dialog" id="select">
    <div class="mdc-dialog__container">
        <div
            class="mdc-dialog__surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-content"
        >
            <div>
                <h2 class="mdc-dialog__title CkXZgc" id="dialog-title">
                    Select Class
                </h2>
                <button class="mdc-icon-button material-icons big-button right"
                    aria-label="Help"
                    jscontroller="VXdfxd"
                    jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                    tabindex="0"
                    data-tooltip="Help"
                    data-tooltip-vertical-offset="-12"
                    data-tooltip-horizontal-offset="0"
                >
                    help_outline
                </button>
            </div>
            <div class="mdc-list-divider" role="separator"></div>
            <div id="dialog-default-view">
                <div class="mdc-dialog__content" id="dialog-content">
                    <ul class="mdc-list" id="class-list" role="listbox"></ul>
                    <button 
                        class="mdc-button" 
                        id="add-class" 
                        style="min-width: 400px !important;"
                    >
                        <div class="mdc-button__ripple"></div>
                        <i
                            class="material-icons mdc-button__icon"
                            aria-hidden="true"
                            >add</i
                        >
                        <span class="mdc-button__label">Add Class</span>
                    </button>
                </div>
                <div class="mdc-list-divider" role="separator"></div>
                <div class="mdc-dialog__actions">
                    <button
                        type="button"
                        class="mdc-button mdc-button--outlined mdc-dialog__button"
                        id="later"
                        data-mdc-dialog-action="close"
                    >
                        <div class="mdc-button__ripple"></div>
                        <span class="mdc-button__label">Later</span>
                    </button>
                    <button
                        type="button"
                        class="mdc-button mdc-button--raised mdc-dialog__button"
                        id="select-button"
                        data-mdc-dialog-action="accept"
                        data-mdc-dialog-button-default
                        disabled
                    >
                        <div class="mdc-button__ripple"></div>
                        <span class="mdc-button__label">Select</span>
                    </button>
                </div>
            </div>
            <div id="dialog-edit-view" hidden>
                <div class="mdc-dialog__content" id="dialog-content">
                    <div class="label CkXZgc" style="margin-top: 16px;">
                        Class Name
                    </div>
                    <label
                        class="class-name-field mdc-text-field mdc-text-field--outlined"
                    >
                        <input
                            type="text"
                            class="mdc-text-field__input"
                            aria-controls="class-helper-id"
                            aria-describedby="class-helper-id"
                        />
                        <span class="mdc-notched-outline">
                            <span class="mdc-notched-outline__leading"></span>
                            <span class="mdc-notched-outline__trailing"></span>
                        </span>
                    </label>
                    <div class="mdc-text-field-helper-line">
                        <div
                            class="mdc-text-field-helper-text"
                            id="class-helper-id"
                            aria-hidden="true"
                        >
                            Ex: Period 1 Math
                        </div>
                    </div>
                    <div class="label CkXZgc">Student Names</div>
                    <label
                        class="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea mdc-text-field--no-label"
                    >
                        <div
                            class="mdc-chip-set mdc-chip-set--input"
                            role="grid"
                        ></div>
                        <textarea
                            class="mdc-text-field__input"
                            rows="6"
                            cols="100"
                            aria-label="Enter Student Names"
                            aria-controls="student-helper-id"
                            aria-describedby="student-helper-id"
                        ></textarea>
                        <span class="mdc-notched-outline">
                            <span class="mdc-notched-outline__leading"></span>
                            <span class="mdc-notched-outline__notch"> </span>
                            <span class="mdc-notched-outline__trailing"></span>
                        </span>
                    </label>
                    <div
                        class="mdc-text-field-helper-line"
                        style="margin-bottom: 16px;"
                    >
                        <div
                            class="mdc-text-field-helper-text"
                            id="student-helper-id"
                            aria-hidden="true"
                        >
                            Ex: Tony Vlachos, Natalie Anderson, Michele
                            Fitzgerald
                        </div>
                    </div>
                </div>
                <div class="mdc-list-divider" role="separator"></div>
                <div class="mdc-dialog__actions">
                    <button
                        type="button"
                        class="mdc-button mdc-button--outlined mdc-dialog__button"
                        id="cancel-class"
                    >
                        <div class="mdc-button__ripple"></div>
                        <span class="mdc-button__label">Cancel</span>
                    </button>
                    <button
                        type="button"
                        class="mdc-button mdc-button--raised mdc-dialog__button"
                        id="save-class"
                        data-mdc-dialog-button-default
                    >
                        <div class="mdc-button__ripple"></div>
                        <span class="mdc-button__label">Save</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="mdc-dialog__scrim"></div>
</div>`

const buttonHTML = `<div 
    id="attendance"
    jsshadow=""
    role="button"
    class="uArJ5e UQuaGc kCyAyd kW31ib foXzLb IeuGXd M9Bg4d"
    jscontroller="VXdfxd"
    jsaction="mouseenter:tfO1Yc; mouseleave:JywGue; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef"
    jsname="VyLmyb"
    aria-haspopup="true"
    aria-label="Take attendance"
    aria-disabled="false"
    tabindex="0"
    data-tooltip="Take attendance"
    aria-expanded="true"
    data-tab-id="0"
    data-tooltip-vertical-offset="-12"
    data-tooltip-horizontal-offset="0"
>
    <div class="Fvio9d MbhUzd" jsname="ksKsZd"></div>
    <div class="e19J0b CeoRYc"></div>
    <span jsslot="" class="l4V7wb Fxmcue">
        <span class="NPEfkd RveJvd snByac">
            <div class="ZaI3hb" style="margin: 0 15px 0 17px;">
                <div class="gV3Svc">
                    <span class="DPvwYc sm8sCf azXnTb" aria-hidden="true">
                        <svg
                            focusable="false"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            class="Hdh4hc cIGbvc NMm5M"
                        >
                            <path
                                d=" M 14.077 10.154 C 13.974 10.15 12.031 10.126 10.385 10.154 C 6.34 10.213 5.521 8.044 5.462 4 L 3 4 C 3.066 8.658 3.886 11.65 7.923 12.615 L 7.923 20 L 15.308 20 L 15.308 13.846 C 16.145 15.082 16.486 16.997 16.538 20 L 19 20 C 18.94 15.412 18.193 10.185 14.077 10.162 L 14.077 10.154 Z  M 9.154 6.462 C 9.154 5.102 10.257 4 11.615 4 C 12.974 4 14.077 5.102 14.077 6.462 C 14.077 7.82 12.974 8.923 11.615 8.923 C 10.257 8.923 9.154 7.82 9.154 6.462 L 9.154 6.462 L 9.154 6.462 Z "
                                fill-rule="evenodd"
                            />
                        </svg>
                    </span>
                </div>
            </div>
        </span>
    </span>
    </div>
<div class="qO3Z3c"></div>`

const snackbarHTML = `<div class="mdc-snackbar">
    <div class="mdc-snackbar__surface">
    <div class="mdc-snackbar__label"
        role="status"
        aria-live="polite">
        An error occurred. Please try again later.
    </div>
    <div class="mdc-snackbar__actions">
        <button type="button" class="mdc-button mdc-snackbar__action">
        <div class="mdc-button__ripple"></div>
        <span class="mdc-button__label">OK</span>
        </button>
    </div>
    </div>
</div>`

function toTimeString(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeStyle: 'short',
    }).format(new Date(timestamp * 1000))
}
