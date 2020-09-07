const readyObserver = new MutationObserver(function (mutations, me) {
    if (document.getElementsByClassName('wnPUne N0PJ8e')[0]) {
        document.body.insertAdjacentHTML('afterbegin', confirmDeleteDialogHTML)
        document.body.insertAdjacentHTML('afterbegin', selectDialogHTML)
        document.body.insertAdjacentHTML('afterbegin', snackbarHTML)

        const bar = document.getElementsByClassName('NzPR9b')[0]
        bar.insertAdjacentHTML('afterbegin', buttonHTML)

        const screen = document.getElementsByClassName('crqnQb')[0]
        screen.insertAdjacentHTML('afterbegin', cardHTML)

        window.addEventListener('resize', () => {
            const trayWidth = document.getElementsByClassName('NzPR9b')[0]
                .offsetWidth
            document.getElementById('card').style.width = trayWidth + 'px'
        })
        document.getElementById('card').style.visibility = 'hidden'

        try {
            const showEveryone = document.querySelector(
                '[aria-label="Show everyone"]'
            )
            showEveryone.classList.remove('IeuGXd')
        } catch {
        } finally {
            me.disconnect()
            chrome.runtime.sendMessage({
                data: 'instantiate',
            })
        }
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
        <div class="class-content">
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
                sort
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
                <div class="mdc-dialog__content class-content" id="dialog-content">
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

const confirmDeleteDialogHTML = `<div id="delete-dialog" class="mdc-dialog">
    <div class="mdc-dialog__container">
        <div
            class="mdc-dialog__surface"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-content"
        >
            <h2 class="mdc-dialog__title CkXZgc" id="delete-dialog-title">
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
        <button type="button"
            id="snackbar-help"
            class="mdc-button mdc-snackbar__action"
            style="display:none;"
        >
            <div class="mdc-button__ripple"></div>
            <span class="mdc-button__label">Help</span>
        </button>
        <button 
            type="button" 
            id="snackbar-open"
            class="mdc-button mdc-snackbar__action"
            style="display:none;"
        >
            <div class="mdc-button__ripple"></div>
            <span class="mdc-button__label">Open</span>
        </button>
        <button 
            type="button" 
            id="snackbar-undo"
            class="mdc-button mdc-snackbar__action"
            style="display:none;"
        >
            <div class="mdc-button__ripple"></div>
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
