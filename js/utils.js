class Utils {
    static #nameMap = new Map()

    static log(message) {
        console.log(
            `%c[A4GM]%c ${message} `,
            'color:white;background:#058D80',
            'font-weight:bold;color:#058D80;'
        )
    }

    static hashCode(s) {
        var nHash = 0
        if (!s.length) return nHash
        for (var i = 0, imax = s.length, n; i < imax; ++i) {
            n = s.charCodeAt(i)
            nHash = (nHash << 5) - nHash + n
            nHash = nHash & nHash // Convert to 32-bit integer
        }
        return Math.abs(nHash)
    }

    static dateTimeString(startTimestamp, timestamp) {
        const date = new Date(startTimestamp * 1000).toLocaleDateString()
        return `${date}, ${toTimeString(startTimestamp)} — ${toTimeString(
            timestamp
        )}`
    }

    static toTimeString(timestamp) {
        try {
            return new Date(timestamp * 1000).toLocaleTimeString([], {
                hour: 'numeric',
                minute: 'numeric',
            })
        } catch (e) {
            return new Date(timestamp * 1000).toLocaleTimeString()
        }
    }

    static #getFirstName(fullName) {
        if (this.#nameMap.has(fullName)) {
            return this.#nameMap.get(fullName)[0]
        }
        return this.#splitNames(fullName)[0]
    }

    static #getLastName(fullName) {
        if (this.#nameMap.has(fullName)) {
            return this.#nameMap.get(fullName)[1]
        }
        return this.#splitNames(fullName)[1]
    }

    static #splitNames(fullName) {
        if (fullName.includes('|')) {
            splitNames = fullName.split('|')
        } else if (fullName.includes(', ')) {
            var splitNames = fullName.split(/,(.+)/)
            splitNames = [splitNames[1].trim(), splitNames[0].trim()]
        } else {
            const names = fullName
                .split(' ')
                .filter(
                    (name) =>
                        !(
                            (name.charAt(0) === '[' &&
                                name.slice(-1) === ']') ||
                            (name.charAt(0) === '(' && name.slice(-1) === ')')
                        )
                )
            if (names.length === 1) {
                splitNames = [fullName, '']
            } else {
                for (var i = names.length - 1; i > 1; i--) {
                    const name = names[i]
                    if (name.charAt(0) === name.charAt(0).toLowerCase()) {
                        break
                    }
                }
                splitNames = [
                    names.slice(0, i).join(' '),
                    names.slice(i).join(' '),
                ]
            }
        }
        this.#nameMap.set(fullName, splitNames)
        return splitNames
    }

    static compareFirst(a, b) {
        return this.#getFirstName(a).localeCompare(this.#getFirstName(b))
    }

    static compareLast(a, b) {
        return this.#getLastName(a).localeCompare(this.#getLastName(b))
    }
}
