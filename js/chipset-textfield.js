const MDCTextField = mdc.textField.MDCTextField
const MDCChipSet = mdc.chips.MDCChipSet

class MDCChipSetTextField extends MDCTextField {
    constructor(element) {
        super(element)

        this.chipTemplateEl = document.getElementById('chip-template')
        this.chipSetEl = element.querySelector('.mdc-chip-set')
        this.chipSet = new MDCChipSet(this.chipSetEl)
        this.chipCounter = 0

        this.textarea = element.querySelector('textarea')
        const highlighter = element.querySelector('.highlighter')

        this.textarea.addEventListener('input', (event) => {
            const rawInput = this.value
            const input = rawInput.trimLeft()
            const ew = this.expectedWhitespace()
            if (input.length === 0 || !rawInput.startsWith(ew)) {
                this.value = ew + input
                this.textarea.setSelectionRange(ew.length, ew.length)
            }
            if (input.includes('\n')) {
                const texts = input
                    .split(/\r?\n/)
                    .map((text) => text.trim().replace(/\s+/g, ' '))
                    .filter((text) => text !== '')
                for (const text of texts) {
                    this.addChip(text)
                }
                this.value = this.expectedWhitespace()
            }
            highlighter.innerHTML = this.value
        })
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace') {
                const activeEl = document.activeElement
                const numChips = this.chipSet.chips.length
                if (activeEl === this.textarea) {
                    if (numChips > 0 && this.value.trim().length === 0) {
                        this.chipSet.chips[numChips - 1].focusPrimaryAction()
                    }
                } else if (
                    activeEl.classList.contains('mdc-chip__primary-action')
                ) {
                    for (let i = 0; i < numChips; i++) {
                        const chip = this.chipSet.chips[i]
                        if (
                            chip.id === activeEl.parentElement.parentElement.id
                        ) {
                            chip.beginExit()
                            if (i > 0) {
                                this.chipSet.chips[i - 1].focusPrimaryAction()
                            }
                            break
                        }
                    }
                }
            }
        })
        this.textarea.addEventListener('scroll', () => {
            const top = '-' + this.textarea.scrollTop + 'px'
            this.chipSetEl.style.top = top
            highlighter.style.top = top
        })

        // prevent unsightly highlighting
        window.addEventListener('resize', () => {
            highlighter.style.width = this.textarea.offsetWidth - 32 + 'px'
            highlighter.style.height = this.textarea.offsetHeight + 'px'
        })
        document.addEventListener('selectionchange', () => {
            if (document.activeElement === this.textarea) {
                const minStart = this.expectedWhitespace().length
                const start = Math.max(this.textarea.selectionStart, minStart)
                const end = Math.max(this.textarea.selectionEnd, minStart)
                if (start === end) {
                    this.textarea.setSelectionRange(start, end)
                    highlighter.innerHTML = this.value
                } else {
                    const innerHigh = this.value
                    highlighter.innerHTML =
                        innerHigh.slice(0, start) +
                        '<span class="highlighted">' +
                        innerHigh.slice(start, end) +
                        '</span>' +
                        innerHigh.slice(end)
                }
            }
        })

        // only copy highlighted text
        this.textarea.addEventListener('copy', (event) => {
            event.clipboardData.setData(
                'text/plain',
                highlighter.querySelector('.highlighted').innerHTML
            )
            event.preventDefault()
        })
        this.textarea.addEventListener('cut', (event) => {
            const minStart = this.expectedWhitespace().length
            const start = Math.max(this.textarea.selectionStart, minStart)
            const end = Math.max(this.textarea.selectionEnd, minStart)
            this.value = this.value.slice(0, start) + this.value.slice(end)
            this.textarea.setSelectionRange(start, start)
            const highlighted = highlighter.querySelector('.highlighted')
            event.clipboardData.setData('text/plain', highlighted.innerHTML)
            highlighter.removeChild(highlighted)
            event.preventDefault()
        })
    }
    refresh(chipList) {
        this.chipCounter = 0
        this.chipSetEl.innerHTML = ''
        this.chipSet = new MDCChipSet(this.chipSetEl)
        for (const text of chipList) {
            this.addChip(text)
        }
        this.value = this.expectedWhitespace()
    }
    addChip(text) {
        const chipEl = this.chipTemplateEl.content.firstElementChild.cloneNode(
            true
        )
        const id = `nick-chubb-${++this.chipCounter}`
        chipEl.id = id
        chipEl.rawText = text
        chipEl.querySelector('.mdc-chip__text').textContent = text
            .replace('|', ' ')
            .trim()
        this.chipSetEl.appendChild(chipEl)
        this.chipSet.addChip(chipEl)
        const chip = this.chipSet.chips[this.chipSet.chips.length - 1]
        chipEl
            .querySelector('.mdc-chip__icon--trailing')
            .addEventListener('click', () => {
                chip.beginExit()
            })
        chip.listen('MDCChip:removal', (event) => {
            this.removeChip(event.target)
            const input = this.value.trimLeft()
            this.value = this.expectedWhitespace() + input
        })
    }
    removeChip(chipEl) {
        const chipIndex = [...this.chipSetEl.children].indexOf(chipEl)
        this.chipSetEl.removeChild(chipEl)
        if (this.chipSetEl.childElementCount > 0) {
            const focusedChip =
                chipIndex >= this.chipSetEl.childElementCount
                    ? this.chipSetEl.lastElementChild
                    : this.chipSetEl.children[chipIndex]
            const switchFocus = () => {
                this.focus()
                focusedChip.removeEventListener('focusin', switchFocus)
            }
            focusedChip.addEventListener('focusin', switchFocus)
        } else {
            this.focus()
        }
    }
    expectedWhitespace() {
        const chipSetRect = this.chipSetEl.getBoundingClientRect()
        const chipSetBaseline = chipSetRect.bottom - 8
        const numRows = Math.max(1, (chipSetRect.height - 8) / 40)
        let newValue = '\n'.repeat(numRows - 1)
        let charCounter = 0
        ;[...this.chipSetEl.children]
            .filter(
                (chipEl) =>
                    Math.abs(
                        chipEl.getBoundingClientRect().bottom - chipSetBaseline
                    ) < 4
            )
            .forEach((chipEl) => {
                charCounter +=
                    chipEl.querySelector('.mdc-chip__text').innerHTML.length + 7
            })
        newValue += ' '.repeat(Math.max(0, charCounter - 1))
        return newValue
    }
    get chipTexts() {
        return this.chipSet.chips.map((chip) => chip.root.rawText)
    }
}
