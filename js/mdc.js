const MDCRipple = mdc.ripple.MDCRipple

const MDCList = mdc.list.MDCList
const classList = new MDCList(document.querySelector('#class-list'))
classList.singleSelection = true
const selectButton = document.getElementById('select-button')
document
    .querySelector('.mdc-dialog__content')
    .addEventListener('click', function () {
        if (classList.selectedIndex === -1) {
            selectButton.disabled = true
        } else {
            selectButton.disabled = false
        }
    })

const MDCDialog = mdc.dialog.MDCDialog
const selectDialog = new MDCDialog(document.getElementById('select'))
selectDialog.scrimClickAction = ''
selectDialog.escapeKeyAction = ''
selectDialog.open()
selectDialog.autoStackButtons = false

const MDCMenu = mdc.menu.MDCMenu
const sortMenuEl = document.getElementById('sort-menu')
const sortMenu = new MDCMenu(sortMenuEl)
document.querySelector('.more').addEventListener('click', function () {
    sortMenu.open = true
})
const sortOptions = new MDCList(sortMenuEl.querySelector('.mdc-list'))
for (const listEl of sortOptions.listElements) {
    new MDCRipple(listEl)
    listEl.addEventListener('click', function () {
        setSortMethod(listEl.id)
        forceStatusUpdate()
    })
}

const MDCSnackbar = mdc.snackbar.MDCSnackbar
const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'))
snackbar.timeoutMs = -1

const MDCLinearProgress = mdc.linearProgress.MDCLinearProgress
const linearProgress = new MDCLinearProgress(
    document.querySelector('#progress-bar')
)
linearProgress.progress = 0
let port = chrome.runtime.connect()
port.onMessage.addListener(function (msg) {
    linearProgress.progress = msg.progress
    if (msg.done) {
        const error = msg.error
        if (error) {
            snackbar.labelText = error
        } else {
            snackbar.labelText = 'Successfully exported to Google Sheet!'
            snackbar.actionButtonText = 'Open'

            const action = document.querySelector('.mdc-snackbar__action')
            action.addEventListener('click', openSpreadsheet)
            snackbar.listen('MDCSnackbar:closed', (event) => {
                action.removeEventListener('click', openSpreadsheet)
            })
        }
        snackbar.open()
    }
})

document.getElementById('export').addEventListener('click', function () {
    port.postMessage({ data: 'export', code: getMeetCode() })
    console.log('Exporting...')
})

const MDCTextField = mdc.textField.MDCTextField
const MDCChipSet = mdc.chips.MDCChipSet
let classTextField, stuTextFieldEl, stuTextField, chipSetEl, chipSet

let nameArray = []
prepareChips(null, 'dialog-default-view', 'dialog-edit-view')

document.getElementById('later').addEventListener('click', () => {
    document.getElementById('card-class-view').hidden = false
    document.getElementById('card-default-view').hidden = true
})
selectButton.addEventListener('click', () => {
    const className = classList.listElements[classList.selectedIndex].name
    const code = getMeetCode()
    chrome.storage.local.get(code, function (result) {
        let res = result[code]
        res.class = className
        chrome.storage.local.set({ [code]: res })
        document.getElementById('class-label').innerText = className
    })
})

selectDialog.listen('MDCDialog:closed', (event) => {
    const element = document.getElementById('select')
    element.parentNode.removeChild(element)
    prepareChips('card-class-view', 'card-default-view', 'card-edit-view')

    forceStatusUpdate()
})

function forceStatusUpdate() {
    chrome.storage.local.get(null, function (result) {
        const res = result[getMeetCode()]
        const className = res.class
        if (className) {
            updateRosterStatus(res.attendance, result.rosters[className])
        }
    })
}

document.getElementById('default-back').addEventListener('click', function () {
    document.getElementById('card-class-view').hidden = false
    document.getElementById('card-default-view').hidden = true
})

document.getElementById('edit-back').addEventListener('click', function () {
    const cardTitle = document.getElementById('class-label')
    if (cardTitle.adding) {
        document.getElementById('card-class-view').hidden = false
        delete cardTitle.adding
    } else {
        document.getElementById('card-default-view').hidden = false
        cardTitle.innerText = classTextField.value
    }
    document.getElementById('card-edit-view').hidden = true
})

document.getElementById('cancel-class').addEventListener('click', function () {
    document.getElementById('dialog-default-view').hidden = false
    document.getElementById('dialog-edit-view').hidden = true
})

function addChip(name) {
    const chipEl = document.createElement('div')
    chipEl.className = 'mdc-chip'
    chipEl.setAttribute('role', 'row')
    chipEl.innerHTML = `<div class="mdc-chip__ripple"></div>
    <span role="gridcell">
        <span
            role="button"
            tabindex="0"
            class="mdc-chip__primary-action"
        >
            <span class="mdc-chip__text"
                >${name}</span
            >
        </span>
        <span role="gridcell">
        <i class="material-icons mdc-chip__icon mdc-chip__icon--trailing" tabindex="0" role="button" style="margin-left: 0;">cancel</i>
        </span>
    </span>`
    chipSetEl.appendChild(chipEl)
    chipSet.addChip(chipEl)

    chipEl
        .querySelector('.mdc-chip__icon')
        .addEventListener('click', function () {
            const i = nameArray.indexOf(name)
            chipSet.chips[i].beginExit()
            nameArray.splice(i, 1)
            recalibrate(name)
        })
}

function editClass(className) {
    classTextField.value = className
    classTextField.initValue = className
    chipSetEl.innerHTML = ''
    chipSet = new MDCChipSet(chipSetEl)
    for (const name of nameArray) {
        addChip(name)
    }
    stuTextField.value = getNewFieldValue()
}

function prepareChips(_cardView, defaultView, editView) {
    cardView = _cardView || defaultView

    const textFields = document.getElementsByClassName('mdc-text-field')
    classTextField = new MDCTextField(textFields[0])
    stuTextFieldEl = textFields[1]
    stuTextField = new MDCTextField(stuTextFieldEl)
    chipSetEl = document.getElementsByClassName('mdc-chip-set')[0]
    chipSet = new MDCChipSet(chipSetEl)

    initializeClasses().then((classes) => {
        for (const classEl of classes) {
            addDefaultEventListeners(
                classEl,
                cardView,
                defaultView,
                editView,
                _cardView
            )
            new MDCRipple(classEl)
        }
    })

    document.getElementById('add-class').addEventListener('click', function () {
        document.getElementById('class-label').adding = true
        document.getElementById(cardView).hidden = true
        document.getElementById(editView).hidden = false
        nameArray = []
        editClass('', [])
    })

    document
        .getElementById('save-class')
        .addEventListener('click', function () {
            const className = classTextField.value
            const initClassName = classTextField.initValue

            chrome.storage.local.get('rosters', function (result) {
                let res = result['rosters']
                if (className === '') {
                    snackbar.labelText =
                        'Error: The class name cannot be empty.'
                    snackbar.actionButtonText = 'OK'
                    snackbar.open()
                } else if (nameArray.length === 0) {
                    snackbar.labelText =
                        'Error: You must have at least 1 student in a class.'
                    snackbar.actionButtonText = 'OK'
                    snackbar.open()
                } else if (
                    res.hasOwnProperty(className) &&
                    className !== initClassName
                ) {
                    snackbar.labelText =
                        'Error: You already have a class with that name.'
                    snackbar.actionButtonText = 'OK'
                    snackbar.open()
                } else {
                    deleteClass(initClassName)
                        .then(() => {
                            delete classTextField.initValue
                            return addClass(
                                className,
                                nameArray,
                                !selectDialog.isOpen
                            )
                        })
                        .then((classEl) => {
                            addDefaultEventListeners(
                                classEl,
                                cardView,
                                defaultView,
                                editView,
                                _cardView
                            )
                            if (selectButton) {
                                selectButton.disabled = true
                            }

                            const cardTitle = document.getElementById(
                                'class-label'
                            )
                            if (cardTitle.adding) {
                                document.getElementById(cardView).hidden = false
                                document.getElementById(editView).hidden = true
                                delete cardTitle.adding
                            } else {
                                cardTitle.innerText = className
                                document.getElementById(
                                    defaultView
                                ).hidden = false
                                document.getElementById(editView).hidden = true
                                forceStatusUpdate()
                            }

                            new MDCRipple(classEl)
                        })
                }
            })
        })

    document
        .getElementById('edit-roster')
        .addEventListener('click', function () {
            chrome.storage.local.get(null, function (result) {
                let res = result[getMeetCode()]
                const className = res.class
                document.getElementById(defaultView).hidden = true
                document.getElementById(editView).hidden = false
                nameArray = Array.from(result.rosters[className])
                editClass(className)
            })
        })

    stuTextFieldEl.addEventListener('input', function (event) {
        const input = stuTextField.value.trimLeft()
        if (input.includes('\n') || input.includes(',')) {
            let names = input
                .split(/\r?\n|,/)
                .map((name) => name.trim().replace(/\\s+/g, ' '))
                .filter((name) => name !== '')
            for (const name of names) {
                nameArray.push(name)
                addChip(name)
            }
            stuTextField.value = getNewFieldValue()
        } else {
            stuTextField.value = getNewFieldValue() + input
        }
    })

    const input = document.getElementsByClassName('mdc-text-field__input')[1]
    input.addEventListener('scroll', function () {
        const scrollY = input.scrollTop
        chipSetEl.style.top = '-' + scrollY + 'px'
    })
}

function addDefaultEventListeners(
    classEl,
    cardView,
    defaultView,
    editView,
    clickable
) {
    if (clickable) {
        classEl.addEventListener('click', function (event) {
            const target = event.target
            if (
                !target.classList.contains('edit-class') &&
                !target.classList.contains('delete-class')
            ) {
                const code = getMeetCode()
                chrome.storage.local.get(getMeetCode(), function (result) {
                    let res = result[code]
                    res.class = classEl.name
                    chrome.storage.local.set({ [code]: res })

                    document.getElementById(cardView).hidden = true
                    document.getElementById(defaultView).hidden = false

                    document.getElementById('class-label').innerText =
                        classEl.name

                    forceStatusUpdate()
                })
            }
        })
    }
    classEl
        .querySelector('.delete-class')
        .addEventListener('click', function () {
            deleteClass(classEl.name)
        })
    classEl.querySelector('.edit-class').addEventListener('click', function () {
        document.getElementById(cardView).hidden = true
        document.getElementById(defaultView).hidden = true
        document.getElementById(editView).hidden = false
        nameArray = Array.from(classEl.roster)
        editClass(classEl.name, classEl.roster)
    })
}

function getNewFieldValue() {
    const chipRows = (chipSetEl.offsetHeight - 8) / 40

    let newValue = ''
    for (let i = 0; i < chipRows - 1; i++) {
        newValue += ' '.repeat(100) + '\n'
    }

    const chips = chipSetEl.getElementsByClassName('mdc-chip')
    let lastHeight = -1
    let counter = 0
    for (let i = chips.length - 1; i >= 0; i--) {
        const chip = chips[i]
        const top = chip.getBoundingClientRect().top
        if (lastHeight != -1 && Math.abs(top - lastHeight) > 10) {
            break
        }
        lastHeight = top
        const text = chip.querySelector('.mdc-chip__text').innerHTML
        for (let i = 0; i < text.length + 7; i++) {
            counter++
        }
    }
    newValue += ' '.repeat(Math.max(0, counter - 1))
    return newValue
}

function recalibrate(name) {
    const lines = stuTextField.value.split('\n')
    let lastLine = lines.pop()
    let counter = 0
    while (counter < name.length + 7) {
        if (lastLine.charAt(0) !== ' ') {
            break
        }
        lastLine = lastLine.substr(1)
        counter++
    }
    lines.push(lastLine)
    stuTextField.value = lines.join('\n')
}

for (const button of document.getElementsByClassName('mdc-button')) {
    new MDCRipple(button)
}
