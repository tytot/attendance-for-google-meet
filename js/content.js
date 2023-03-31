'use strict'

chrome.storage.local.get(null, (result) => {
    function initialize() {
        chrome.runtime.sendMessage(
            {
                data: 'check-active',
            },
            async (response) => {
                Utils.log('Initializing extension...')
                document.body.insertAdjacentHTML(
                    'afterbegin',
                    confirmDeleteDialogHTML
                )
                // document.body.insertAdjacentHTML('afterbegin', selectDialogHTML)
                document.body.insertAdjacentHTML('afterbegin', snackbarHTML)

                const panelContainer = document.querySelector('.R3Gmyc.qwU8Me')
                document
                    .querySelector('[jsname="HlFzId"]')
                    .insertAdjacentHTML('afterend', panelHTML)
                const attendancePanel = document.getElementById('panel')

                const ariaPressedObserver = new MutationObserver(
                    (mutations, me) => {
                        mutations[0].target.setAttribute('aria-pressed', false)
                        me.disconnect()
                    }
                )
                const ariaPressedObserverOptions = {
                    attributes: true,
                    attributeFilter: ['aria-pressed'],
                    attributeOldValue: true,
                }
                const panelUnhiddenObserver = new MutationObserver(
                    (mutations, me) => {
                        const mutation = mutations[0]
                        const target = mutation.target
                        if (
                            mutation.oldValue.includes('qdulke') &&
                            !target.classList.contains('qdulke')
                        ) {
                            target.classList.add('qdulke')
                            attendancePanel.classList.remove('qdulke')
                            me.disconnect()
                        }
                    }
                )
                const panelSpawnedObserver = new MutationObserver(
                    (mutations, me) => {
                        const mutation = mutations[0]
                        if (mutation.addedNodes.length > 0) {
                            const addedNode = mutation.addedNodes[0]
                            if (addedNode.getAttribute('data-tab-id') === '5') {
                                addedNode.classList.add('qdulke')
                                attendancePanel.classList.remove('qdulke')
                                me.disconnect()
                            }
                        }
                    }
                )

                const buttonsSpawnedObserver = new MutationObserver(
                    (mutations, me) => {
                        const buttonContainer =
                            document.querySelector('.r6xAKc')
                        if (!buttonContainer) return

                        buttonContainer.parentElement.style.display = 'flex'
                        buttonContainer.insertAdjacentHTML(
                            'afterend',
                            buttonHTML
                        )
                        const infoButton =
                            document.querySelector('.r6xAKc button')
                        definePressedProperty(infoButton)
                        const attendanceButton =
                            document.getElementById('attendance')
                        definePressedProperty(attendanceButton)
                        infoButton.addEventListener('click', (event) => {
                            if (!infoButton.pressed) {
                                if (!attendanceButton.pressed) {
                                    ariaPressedObserver.observe(
                                        attendanceButton,
                                        ariaPressedObserverOptions
                                    )
                                } else {
                                    event.stopPropagation()
                                    infoButton.pressed = true
                                    document
                                        .querySelector('[data-tab-id="5"]')
                                        .classList.remove('qdulke')
                                    attendanceButton.pressed = false
                                    attendancePanel.classList.add('qdulke')
                                }
                            }
                        })
                        attendanceButton.addEventListener('click', (event) => {
                            if (!attendanceButton.pressed) {
                                const infoPanel =
                                    document.querySelector('[data-tab-id="5"]')
                                if (infoPanel === null) {
                                    panelSpawnedObserver.observe(
                                        panelContainer,
                                        {
                                            childList: true,
                                        }
                                    )
                                } else {
                                    panelUnhiddenObserver.observe(
                                        document.querySelector(
                                            '[data-tab-id="5"]'
                                        ),
                                        {
                                            attributes: true,
                                            attributeFilter: ['class'],
                                            attributeOldValue: true,
                                        }
                                    )
                                }
                                if (!infoButton.pressed) {
                                    ariaPressedObserver.observe(
                                        infoButton,
                                        ariaPressedObserverOptions
                                    )
                                } else {
                                    event.stopPropagation()
                                    infoButton.pressed = false
                                    document
                                        .querySelector('[data-tab-id="5"]')
                                        .classList.add('qdulke')
                                    attendanceButton.pressed = true
                                    attendancePanel.classList.remove('qdulke')
                                }
                            }
                        })
                        me.disconnect()
                    }
                )
                buttonsSpawnedObserver.observe(
                    document.querySelector('[jscontroller="NcNt1e"]'),
                    {
                        childList: true,
                    }
                )

                const listSpawnedObserver = new MutationObserver(
                    (mutations, me) => {
                        const addedNodes = mutations[0].addedNodes
                        if (
                            !(
                                addedNodes.length > 0 &&
                                addedNodes[0].classList.contains(
                                    'VfPpkd-xl07Ob-XxIAqe'
                                ) &&
                                addedNodes[0].querySelector(
                                    '[aria-label="Meeting details"]'
                                )
                            )
                        ) {
                            return
                        }
                        const detailsLi = addedNodes[0]
                            .querySelector('ul')
                            .querySelector('li')
                        detailsLi.insertAdjacentHTML('afterend', liHTML)
                        const attendanceLi =
                            document.getElementById('attendance-li')
                        attendanceLi.addEventListener('click', (event) => {
                            if (attendancePanel.classList.contains('qdulke')) {
                                const infoPanel =
                                    document.querySelector('[data-tab-id="5"]')
                                if (infoPanel === null) {
                                    panelSpawnedObserver.observe(
                                        panelContainer,
                                        {
                                            childList: true,
                                        }
                                    )
                                } else if (
                                    infoPanel.classList.contains('qdulke')
                                ) {
                                    panelUnhiddenObserver.observe(
                                        document.querySelector(
                                            '[data-tab-id="5"]'
                                        ),
                                        {
                                            attributes: true,
                                            attributeFilter: ['class'],
                                            attributeOldValue: true,
                                        }
                                    )
                                } else {
                                    document
                                        .querySelector('[data-tab-id="5"]')
                                        .classList.add('qdulke')
                                    attendancePanel.classList.remove('qdulke')
                                }
                            }
                        })
                    }
                )
                listSpawnedObserver.observe(document.body, {
                    childList: true,
                })

                const code = document
                    .querySelector('c-wiz')
                    .getAttribute('data-unresolved-meeting-id')

                if (!result.hasOwnProperty(code)) {
                    await addAttendanceBoilerplate(code)
                }
                if (!result.hasOwnProperty('rosters')) {
                    await addRosterBoilerplate()
                }
                instantiate()
            }
        )
    }

    function definePressedProperty(element) {
        Object.defineProperty(element, 'pressed', {
            get: function () {
                return this.getAttribute('aria-pressed') === 'true'
            },
            set: function (value) {
                this.setAttribute('aria-pressed', value)
            },
        })
    }

    function addAttendanceBoilerplate(code) {
        return new Promise((resolve) => {
            chrome.storage.local.set(
                {
                    [code]: {
                        attendance: {},
                        'start-timestamp': ~~(Date.now() / 1000),
                    },
                },
                () => {
                    resolve()
                }
            )
        })
    }

    function addRosterBoilerplate() {
        return new Promise((resolve) => {
            chrome.storage.local.set({ rosters: {} }, () => {
                resolve()
            })
        })
    }

    function instantiate() {
        chrome.runtime.sendMessage(
            {
                data: 'instantiate',
            },
            () => {
                Utils.log('Successfully initialized extension.')
            }
        )
    }

    const updatesHTML = `<div class="updates ${
        result['updates-dismissed'] ? 'collapsed' : ''
    } mdc-elevation--z2">
        <div class="notification">
            <div style="flex: 1">
                <h2 style="margin-bottom: 0">
                    <i class="material-icons">important_devices</i>
                    New in Version ${chrome.runtime.getManifest().version}
                </h2>
                <ul>
                    <li>Fixed bug that caused the attendance button to not show up</li>
                    <li>Minor user interface improvements</li>
                </ul>
            </div>
        </div>
        <hr style="border-style: none none dotted; margin: 0;">
        <div class="updates-actions">
            <button class="view-changelog mdc-button" style="float: left">
                <span class="mdc-button__ripple"></span>
                <span class="mdc-button__label">Changelog</span>
            </button>
            <button class="dismiss-updates mdc-button" style="float: right">
                <span class="mdc-button__ripple"></span>
                <span class="mdc-button__label">Dismiss</span>
            </button>
        </div>
    </div>`

    const sheetsSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate;padding-right: 4px;" viewBox="0 0 64 88" width="12pt" height="12pt"><defs><clipPath id="_clipPath_KAvDqF0Ev6kg4Yj0RZmUZ8LSvIjixP4M"><rect height="88" width="64"></rect></clipPath></defs><g clip-path="url(#_clipPath_KAvDqF0Ev6kg4Yj0RZmUZ8LSvIjixP4M)"><clipPath id="_clipPath_tDC5NP6inp0FhE5TGFdi9OsXat0bSKFd"><rect transform="matrix(1,0,0,1,0,0)" height="88" width="64" y="0" x="0"></rect></clipPath><g clip-path="url(#_clipPath_tDC5NP6inp0FhE5TGFdi9OsXat0bSKFd)"><g><path d=" M 58 88 L 6 88 C 2.7 88 0 85.3 0 82 L 0 6 C 0 2.7 2.7 0 6 0 L 42 0 L 64 22 L 64 82 C 64 85.3 61.3 88 58 88 Z  M 17 39.5 L 29.5 39.5 L 29.5 46 L 17 46 L 17 39.5 L 17 39.5 L 17 39.5 L 17 39.5 L 17 39.5 Z  M 17 51 L 29.5 51 L 29.5 57.5 L 17 57.5 L 17 51 L 17 51 L 17 51 L 17 51 L 17 51 Z  M 47 57.5 L 34.5 57.5 L 34.5 51 L 47 51 L 47 57.5 L 47 57.5 L 47 57.5 L 47 57.5 L 47 57.5 Z  M 47 46 L 34.5 46 L 34.5 39.5 L 47 39.5 L 47 46 L 47 46 L 47 46 L 47 46 L 47 46 Z  M 12 34.5 L 12 62.5 L 52 62.5 L 52 34.5 L 12 34.5 L 12 34.5 L 12 34.5 L 12 34.5 L 12 34.5 Z " fill-rule="evenodd"></path></g></g></g></svg>`

    const buttonHTML = `<div class="r6xAKc">
        <span data-is-tooltip-wrapper="true"
            ><button
                id="attendance"
                class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ JsuyRc boDUxc"
                jscontroller="soHxf"
                jsaction="click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc; touchcancel:JMtRjd; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef"
                jsname="A5il2e"
                aria-label="Attendance"
                data-tooltip-enabled="true"
                data-tooltip-id="tt-c12"
                data-panel-id="5"
                aria-pressed="false"
            >
                <div class="VfPpkd-Bz112c-Jh9lGc"></div>
                <i
                    class="VfPpkd-kBDsod NtU4hc"
                    aria-hidden="true"
                    ><svg
                        focusable="false"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d=" M 14.077 10.154 C 13.974 10.15 12.031 10.126 10.385 10.154 C 6.34 10.213 5.521 8.044 5.462 4 L 3 4 C 3.066 8.658 3.886 11.65 7.923 12.615 L 7.923 20 L 15.308 20 L 15.308 13.846 C 16.145 15.082 16.486 16.997 16.538 20 L 19 20 C 18.94 15.412 18.193 10.185 14.077 10.162 L 14.077 10.154 Z  M 9.154 6.462 C 9.154 5.102 10.257 4 11.615 4 C 12.974 4 14.077 5.102 14.077 6.462 C 14.077 7.82 12.974 8.923 11.615 8.923 C 10.257 8.923 9.154 7.82 9.154 6.462 L 9.154 6.462 L 9.154 6.462 Z "
                            fill-rule="evenodd"
                        />
                    </svg></i
                ><i
                    class="VfPpkd-kBDsod Mwv9k"
                    aria-hidden="true"
                    ><svg
                        focusable="false"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d=" M 14.077 10.154 C 13.974 10.15 12.031 10.126 10.385 10.154 C 6.34 10.213 5.521 8.044 5.462 4 L 3 4 C 3.066 8.658 3.886 11.65 7.923 12.615 L 7.923 20 L 15.308 20 L 15.308 13.846 C 16.145 15.082 16.486 16.997 16.538 20 L 19 20 C 18.94 15.412 18.193 10.185 14.077 10.162 L 14.077 10.154 Z  M 9.154 6.462 C 9.154 5.102 10.257 4 11.615 4 C 12.974 4 14.077 5.102 14.077 6.462 C 14.077 7.82 12.974 8.923 11.615 8.923 C 10.257 8.923 9.154 7.82 9.154 6.462 L 9.154 6.462 L 9.154 6.462 Z "
                            fill-rule="evenodd"
                        />
                    </svg></i
                >
            </button>
            <div
                class="EY8ABd-OWXEXe-TAWMXe"
                role="tooltip"
                aria-hidden="true"
                id="tt-c12"
            >
                Attendance
            </div></span
        >
    </div>`

    const liHTML = `<li id="attendance-li"
        class="
            V4jiNc
            nU2J7
            VfPpkd-StrnGf-rymPhb-ibnC6b VfPpkd-rymPhb-ibnC6b-OWXEXe-tPcied-hXIJHe
        "
        jsaction="click:o6ZaF; keydown:RDtNu; keyup:JdS61c; focusin:MeMJlc; focusout:bkTmIf;mousedown:teoBgf; mouseup:NZPHBc; mouseleave:xq3APb; touchstart:jJiBRc; touchmove:kZeBdd; touchend:VfAz8; change:uOgbud"
        role="menuitem"
        aria-label="Attendance"
        tabindex="-1"
        data-panel-id="5"
    >
        <span class="VfPpkd-StrnGf-rymPhb-pZXsl"></span
        ><span class="VfPpkd-StrnGf-rymPhb-f7MjDc" style="padding-top: 4px"
            ><i class="VfPpkd-kBDsod NtU4hc" aria-hidden="true"
                ><svg focusable="false" width="24" height="24" viewBox="0 0 24 24">
                    <path
                        d=" M 14.077 10.154 C 13.974 10.15 12.031 10.126 10.385 10.154 C 6.34 10.213 5.521 8.044 5.462 4 L 3 4 C 3.066 8.658 3.886 11.65 7.923 12.615 L 7.923 20 L 15.308 20 L 15.308 13.846 C 16.145 15.082 16.486 16.997 16.538 20 L 19 20 C 18.94 15.412 18.193 10.185 14.077 10.162 L 14.077 10.154 Z  M 9.154 6.462 C 9.154 5.102 10.257 4 11.615 4 C 12.974 4 14.077 5.102 14.077 6.462 C 14.077 7.82 12.974 8.923 11.615 8.923 C 10.257 8.923 9.154 7.82 9.154 6.462 L 9.154 6.462 L 9.154 6.462 Z "
                        fill-rule="evenodd"
                    /></svg></i></span
        ><span jsname="K4r5Ff" class="VfPpkd-StrnGf-rymPhb-b9t22c O6qLGb"
            >Attendance</span
        >
    </li>`

    const panelHTML = `<div
        class="WUFI9b qdulke"
        id="panel"
        jsname="b0t70b"
        jscontroller="dkJU2d"
        jsaction="VOcP9c:QPhnyd;ntQuZe:EuYDs"
    >
        <div class="CYZUZd">
            <div
                class="J8vCN zHGix"
                role="heading"
                aria-level="2"
                tabindex="-1"
                jsname="rQC7Ie"
            >
                Attendance
            </div>
            <div class="VUk8eb">
                <button
                    class="help mdc-icon-button medium-button material-icons"
                    style="right: 52px"
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
                <div jsaction="JIbuQc:hR1TY;rcuQ6b:npT2md" jscontroller="AXYg3e">
                    <span data-is-tooltip-wrapper="true"
                        ><button
                            class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ IWtuld wBYOYb"
                            jscontroller="soHxf"
                            jsaction="click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc; touchcancel:JMtRjd; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef"
                            aria-label="Close"
                            data-tooltip-enabled="true"
                            data-tooltip-id="tt-c21"
                        >
                            <div class="VfPpkd-Bz112c-Jh9lGc"></div>
                            <i
                                class="google-material-icons VfPpkd-kBDsod"
                                aria-hidden="true"
                                >close</i
                            >
                        </button>
                        <div
                            class="EY8ABd-OWXEXe-TAWMXe"
                            role="tooltip"
                            aria-hidden="true"
                            id="tt-c21"
                        >
                            Close
                        </div></span
                    >
                </div>
            </div>
        </div>
        <div class="hWX4r">
            <div class="view class-view">
                ${updatesHTML}
                <h4 class="subtitle">Classes</h4>
                <ul class="mdc-list class-list">
                    <template id="class-item-template">
                        <li
                            class="mdc-list-item"
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
                                My Class
                            </span>
                            <div class="mdc-list-item__meta double-meta">
                                <button
                                    class="
                                        mdc-icon-button
                                        material-icons
                                        medium-button
                                        edit-class
                                    "
                                    aria-label="Edit"
                                    jscontroller="VXdfxd"
                                    jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                                    tabindex="0"
                                    data-tooltip="Edit"
                                    data-tooltip-vertical-offset="-12"
                                    data-tooltip-horizontal-offset="0"
                                >
                                    edit
                                </button
                                ><button
                                    class="
                                        mdc-icon-button
                                        material-icons
                                        medium-button
                                        delete-class
                                    "
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
                        </li>
                    </template>
                </ul>
                <div class="no-classes notification" style="display: none">
                    <i class="material-icons"> warning </i>
                    <p>
                        You don't have any classes! Add a class by clicking the
                        button below.
                    </p>
                </div>
                <button class="mdc-button addeth-class">
                    <div class="mdc-button__ripple"></div>
                    <i
                        class="material-icons mdc-button__icon"
                        aria-hidden="true"
                        >add</i
                    >
                    <span class="mdc-button__label">Add Class</span>
                </button>
            </div>
            <div class="view student-view" hidden>
                <div style="position: relative;">
                    <button class="mdc-button back subtitle-button">
                        <span class="mdc-button__ripple"></span>
                        <i class="material-icons mdc-button__icon petite-icon" aria-hidden="true">arrow_back</i>
                        <span class="mdc-button__label subtitle">Back</span>
                    </button>
                    <h2 class="class-header">
                        Viewing Class
                    </h2>
                    <button class="mdc-button subtitle-button more" style="float: right;">
                        <span class="mdc-button__ripple"></span>
                        <i class="material-icons mdc-button__icon petite-icon" aria-hidden="true">sort</i>
                        <span class="mdc-button__label subtitle">Sort</span>
                    </button>
                    <div class="mdc-menu-surface--anchor sort-anchor">
                        <div
                            class="mdc-menu mdc-menu-surface"
                            id="sort-menu"
                            role="menu"
                        >
                            <ul class="mdc-list mdc-list--dense">
                                <li
                                    class="mdc-list-item mdc-ripple-surface"
                                    id="last-name"
                                    role="menuitem"
                                    tabindex="0"
                                >
                                    <span class="mdc-list-item__text"
                                        >Sort by Last Name (A–Z)</span
                                    >
                                </li>
                                <li
                                    class="mdc-list-item mdc-ripple-surface"
                                    id="first-name"
                                    role="menuitem"
                                    tabindex="0"
                                >
                                    <span class="mdc-list-item__text"
                                        >Sort by First Name (A–Z)</span
                                    >
                                </li>
                                <li
                                    class="mdc-list-item mdc-ripple-surface"
                                    id="present-first"
                                    role="menuitem"
                                    tabindex="0"
                                >
                                    <span class="mdc-list-item__text"
                                        >Sort by Presence (Present First)</span
                                    >
                                </li>
                                <li
                                    class="mdc-list-item mdc-ripple-surface"
                                    id="absent-first"
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
                </div>
                <div class="mdc-list-divider" role="separator"></div>
                <div style="text-align: center">
                    <button class="mdc-button edit-roster">
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
                <div id="status-container">
                    <div
                        id="status-bar"
                        jscontroller="VXdfxd"
                        jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                        data-tooltip="Show Status Details"
                        data-tooltip-vertical-offset="-12"
                        data-tooltip-horizontal-offset="0"
                        aria-label="Show Status Details"
                        aria-pressed="false"
                        aria-expanded="false"
                        role="button"
                        tabindex="0"
                    >
                        <span
                            id="status-green"
                            style="width: 100%"
                            aria-label="Present: 0/0"
                        ></span>
                        <span
                            id="status-yellow"
                            style="width: 0%"
                            aria-label="Previously Present: 0/0"
                        ></span>
                        <span
                            id="status-red"
                            style="width: 0%"
                            aria-label="Absent: 0/0"
                        ></span>
                    </div>
                    <div id="status-details" class="collapsed">
                        <div id="status-presence">
                            <div>
                                <div class="status-details-container green">
                                    <span class="material-icons">lens</span>
                                    <span class="status-details-count"
                                        ><b>0</b>/0</span
                                    >
                                </div>
                                <div class="status-details-text">present</div>
                            </div>
                            <div>
                                <div class="status-details-container yellow">
                                    <span class="material-icons">lens</span>
                                    <span class="status-details-count"
                                        ><b>0</b>/0</span
                                    >
                                </div>
                                <div class="status-details-text">
                                    previously present
                                </div>
                            </div>
                            <div>
                                <div class="status-details-container red">
                                    <span class="material-icons">lens</span>
                                    <span class="status-details-count"
                                        ><b>0</b>/0</span
                                    >
                                </div>
                                <div class="status-details-text">absent</div>
                            </div>
                        </div>
                        <div
                            id="status-unlisted"
                            class="mdc-ripple-surface"
                            jscontroller="VXdfxd"
                            jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                            data-tooltip="Jump to Unlisted"
                            data-tooltip-vertical-offset="-12"
                            data-tooltip-horizontal-offset="0"
                            aria-label="Jump to Unlisted"
                            aria-disabled="true"
                            role="button"
                            tabindex="0"
                        >
                            <div class="status-details-container gray">
                                <span class="material-icons">lens</span>
                                <span class="status-details-count"><b>0</b></span>
                            </div>
                            <div class="status-details-text">not on list</div>
                        </div>
                        <button id="hide-status-details" class="mdc-button">
                            <span class="mdc-button__ripple"></span>
                            <span class="mdc-button__label">Hide</span>
                        </button>
                    </div>
                </div>
                <div class="mdc-list-divider" role="separator"></div>
                <div class="student-content">
                    <div class="no-students notification" style="display: none">
                        <i class="material-icons"> warning </i>
                        <p>
                            Select edit or click the + button next to a name to add
                            students to this class.
                        </p>
                    </div>
                    <ul
                        class="mdc-list mdc-list--dense mdc-list--two-line"
                        id="roster-status"
                    >
                        <template id="unlisted-template">
                            <li class="mdc-list-divider" role="separator"></li>
                            <li id="unlisted-divider">
                                Not on List
                                <button id="add-all-unlisted" class="mdc-button">
                                    <span class="mdc-button__ripple"></span>
                                    <span class="mdc-button__label">Add All</span>
                                </button>
                            </li>
                        </template>
                        <template id="student-template">
                            <li class="mdc-list-divider" role="separator"></li>
                            <li class="mdc-list-item" tabindex="0">
                                <span
                                    class="mdc-list-item__graphic material-icons"
                                    jscontroller="VXdfxd"
                                    jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                                    tabindex="0"
                                    aria-label="Not on List"
                                    data-tooltip="Not on List"
                                    data-tooltip-vertical-offset="-12"
                                    data-tooltip-horizontal-offset="0"
                                >
                                    error
                                </span>
                                <span class="mdc-list-item__text">
                                    <span class="mdc-list-item__primary-text">
                                        First Last
                                    </span>
                                    <span class="mdc-list-item__secondary-text">
                                        Joined at 12:00 AM
                                    </span>
                                </span>
                                <div class="mdc-list-item__meta">
                                    <button
                                        class="
                                            mdc-icon-button
                                            material-icons
                                            medium-button
                                        "
                                        aria-label="Add to Class"
                                        jscontroller="VXdfxd"
                                        jsaction="mouseenter:tfO1Yc; mouseleave:JywGue;"
                                        tabindex="0"
                                        data-tooltip="Add to Class"
                                        data-tooltip-vertical-offset="-12"
                                        data-tooltip-horizontal-offset="0"
                                    >
                                        add_circle
                                    </button>
                                </div>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
            <div class="view edit-view" hidden>
                <div style="position: relative;">
                    <button class="mdc-button back subtitle-button">
                        <span class="mdc-button__ripple"></span>
                        <i class="material-icons mdc-button__icon petite-icon" aria-hidden="true">arrow_back</i>
                        <span class="mdc-button__label subtitle">Back</span>
                    </button>
                    <h2 class="class-header">
                        Editing Class
                    </h2>
                </div>
                <div class="mdc-list-divider" role="separator"></div>
                <div style="text-align: center">
                    <button class="mdc-button confirm-roster save-class">
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
                <div class="edit-content">
                    <div class="label zy3vwb">
                        Class Name
                    </div>
                    <label
                        class="
                            class-name-field
                            mdc-text-field mdc-text-field--outlined
                        "
                    >
                        <input type="text" class="mdc-text-field__input" />
                        <span class="mdc-notched-outline">
                            <span class="mdc-notched-outline__leading"></span>
                            <span class="mdc-notched-outline__trailing"></span>
                        </span>
                    </label>
                    <div class="label zy3vwb">Student Names</div>
                    <label
                        class="
                            mdc-text-field
                            mdc-text-field--outlined
                            mdc-text-field--textarea
                            mdc-text-field--no-label
                        "
                    >
                        <div
                            class="mdc-chip-set mdc-chip-set--input"
                            role="grid"
                        >
                            <template id="chip-template">
                                <div class="mdc-chip" role="row">
                                    <div class="mdc-chip__ripple"></div>
                                    <span role="gridcell">
                                        <span
                                            role="button"
                                            tabindex="0"
                                            class="mdc-chip__primary-action"
                                        >
                                            <span class="mdc-chip__text"
                                                >First Last</span
                                            >
                                        </span>
                                        <span role="gridcell">
                                            <i
                                                class="
                                                    material-icons
                                                    mdc-chip__icon
                                                    mdc-chip__icon--trailing
                                                "
                                                tabindex="0"
                                                role="button"
                                                style="margin-left: 0"
                                                >cancel</i
                                            >
                                        </span>
                                    </span>
                                </div>
                            </template>
                        </div>
                        <div class="highlighter"></div>
                        <textarea
                            class="mdc-text-field__input"
                            rows="6"
                            cols="100"
                            aria-label="Enter Student Names"
                            aria-controls="student-helper-panel"
                            aria-describedby="student-helper-panel"
                        ></textarea>
                        <span class="mdc-notched-outline">
                            <span class="mdc-notched-outline__leading"></span>
                            <span class="mdc-notched-outline__notch"> </span>
                            <span class="mdc-notched-outline__trailing"></span>
                        </span>
                    </label>
                    <div
                        class="mdc-text-field-helper-line"
                        style="margin-bottom: 16px"
                    >
                        <div
                            class="mdc-text-field-helper-text"
                            id="student-helper-panel"
                            aria-hidden="true"
                        >
                            Separate names with Enter.
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="export-container">
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
                    class="
                        mdc-linear-progress__bar mdc-linear-progress__primary-bar
                    "
                >
                    <span class="mdc-linear-progress__bar-inner"></span>
                </div>
                <div
                    class="
                        mdc-linear-progress__bar mdc-linear-progress__secondary-bar
                    "
                >
                    <span class="mdc-linear-progress__bar-inner"></span>
                </div>
            </div>
            <button
                class="mdc-button mdc-button--raised" id="export"
            >
                <div class="mdc-button__ripple"></div>
                ${sheetsSVG}
                <span class="mdc-button__label">Export</span>
            </button>
        </div>
    </div>`

    const selectDialogHTML = `<div class="mdc-dialog" id="select">
        <div class="mdc-dialog__container">
            <div class="class-view">
                <div
                    class="mdc-dialog__surface"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dialog-class-title"
                >
                    <div>
                        <h2 class="mdc-dialog__title zy3vwb" id="dialog-class-title">
                            Select Class
                        </h2>
                        <button class="help mdc-icon-button material-icons medium-button right"
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
                    ${updatesHTML}
                    <div class="mdc-dialog__content">
                        <ul class="mdc-list class-list" role="listbox"></ul>
                        <div class="no-classes notification" style="display:none;">
                            <i class="material-icons">
                                warning
                            </i>
                            <p>You don't have any classes! Add a class by clicking the button below.</p>
                        </div>
                        <button class="mdc-button addeth-class">
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
                            disabled
                        >
                            <div class="mdc-button__ripple"></div>
                            <span class="mdc-button__label">Select</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="edit-view" hidden>
                <div
                    class="mdc-dialog__surface"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dialog-edit-title"
                >
                    <div>
                        <h2 class="mdc-dialog__title zy3vwb" id="dialog-edit-title">
                            Add/Edit Class
                        </h2>
                        <button class="help mdc-icon-button material-icons medium-button right"
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
                    <div class="mdc-dialog__content">
                        <div class="label zy3vwb">
                            Class Name
                        </div>
                        <label
                            class="class-name-field mdc-text-field mdc-text-field--outlined"
                        >
                            <input
                                type="text"
                                class="mdc-text-field__input"
                                aria-controls="class-helper"
                                aria-describedby="class-helper"
                            />
                            <span class="mdc-notched-outline">
                                <span class="mdc-notched-outline__leading"></span>
                                <span class="mdc-notched-outline__trailing"></span>
                            </span>
                        </label>
                        <div class="mdc-text-field-helper-line">
                            <div
                                class="mdc-text-field-helper-text"
                                id="class-helper"
                                aria-hidden="true"
                            >
                                Ex: Period 1 Math
                            </div>
                        </div>
                        <div class="label zy3vwb">Student Names</div>
                        <label
                            class="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea mdc-text-field--no-label"
                        >
                            <div
                                class="mdc-chip-set mdc-chip-set--input"
                                role="grid"
                            ></div>
                            <div class="highlighter"></div>
                            <textarea
                                class="mdc-text-field__input"
                                rows="6"
                                cols="100"
                                aria-label="Enter Student Names"
                                aria-controls="student-helper-dialog"
                                aria-describedby="student-helper-dialog"
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
                                id="student-helper-dialog"
                                aria-hidden="true"
                            >
                                Separate names with Enter.
                            </div>
                        </div>
                    </div>
                    <div class="mdc-list-divider" role="separator"></div>
                    <div class="mdc-dialog__actions">
                        <button
                            type="button"
                            class="back mdc-button mdc-button--outlined mdc-dialog__button"
                        >
                            <div class="mdc-button__ripple"></div>
                            <span class="mdc-button__label">Cancel</span>
                        </button>
                        <button
                            type="button"
                            class="mdc-button mdc-button--raised mdc-dialog__button save-class"
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

    const confirmDeleteDialogHTML = `<div id="delete-dialog" class="mdc-dialog">
        <div class="mdc-dialog__container">
            <div
                class="mdc-dialog__surface"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-content"
            >
                <h2 class="mdc-dialog__title eX03B" id="delete-dialog-title">
                    Confirm Deletion
                </h2>
                <div
                    class="mdc-dialog__content"
                    id="delete-dialog-content"
                >
                    Are you sure you want to delete this class?
                </div>
                <div class="mdc-dialog__actions">
                    <button
                        type="button"
                        class="mdc-button mdc-dialog__button"
                        data-mdc-dialog-action="close"
                    >
                        <div class="mdc-button__ripple"></div>
                        <span class="mdc-button__label">No</span>
                    </button>
                    <button
                        type="button"
                        id="confirm-delete"
                        class="mdc-button mdc-dialog__button"
                        data-mdc-dialog-action="accept"
                    >
                        <div class="mdc-button__ripple"></div>
                        <span class="mdc-button__label">Yes</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="mdc-dialog__scrim"></div>
    </div>`

    const snackbarHTML = `<div class="mdc-snackbar">
        <div class="mdc-snackbar__surface">
        <div class="mdc-snackbar__label"
            role="status"
            aria-live="polite">
            An error occurred. Please try again later.
        </div>
        <div class="mdc-snackbar__actions">
            <button type="button"
                id="snackbar-help"
                class="mdc-button mdc-snackbar__action"
                style="display:none;"
            >
                <span class="mdc-button__label">Help</span>
            </button>
            <button 
                type="button" 
                id="snackbar-open"
                class="mdc-button mdc-snackbar__action"
                style="display:none;"
            >
                <span class="mdc-button__label">Open</span>
            </button>
            <button 
                type="button" 
                id="snackbar-undo"
                class="mdc-button mdc-snackbar__action"
                style="display:none;"
            >
                <span class="mdc-button__label">Undo</span>
            </button>
            <button
                class="mdc-icon-button mdc-snackbar__dismiss material-icons"
                aria-label="Close"
            >
                close
            </button>
        </div>
        </div>
    </div>`

    new MutationObserver((mutations, me) => {
        if (document.querySelector('.c8mVDd')) {
            ;['js/utils.js', 'js/inject.js'].forEach((filePath) => {
                const s = document.createElement('script')
                s.src = chrome.runtime.getURL(filePath)
                document.documentElement.appendChild(s)
            })
            initialize()
            me.disconnect()
        }
    }).observe(document.querySelector('.crqnQb'), {
        childList: true,
        subtree: true,
    })
})
// const sc = document.createElement('script')
// sc.src = chrome.runtime.getURL('js/test.js')
// document.documentElement.appendChild(sc)
