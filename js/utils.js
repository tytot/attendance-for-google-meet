class Utils {
    static nameMap = new Map()
    static collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
    })

    static log(message) {
        console.log(
            `%c[A4GM]%c ${message} `,
            'color:white;background:#058D80',
            'font-weight:bold;color:#058D80;'
        )
    }

    static hashCode(s) {
        let nHash = 0
        if (!s.length) return nHash
        for (let i = 0, imax = s.length, n; i < imax; ++i) {
            n = s.charCodeAt(i)
            nHash = (nHash << 5) - nHash + n
            nHash = nHash & nHash // Convert to 32-bit integer
        }
        return Math.abs(nHash)
    }

    static areEqualArrays(a1, a2) {
        const superSet = {}
        for (const i of a1) {
            superSet[i] = 1
        }
        for (const i of a2) {
            if (!superSet[i]) {
                return false
            }
            superSet[i] = 2
        }
        for (let i in superSet) {
            if (superSet[i] === 1) {
                return false
            }
        }
        return true
    }

    static minsPresent(timestamps) {
        let minsPresent = 0
        for (let i = 0; i < timestamps.length; i += 2) {
            const secs =
                i + 1 === timestamps.length
                    ? ~~(Date.now() / 1000) - timestamps[i]
                    : timestamps[i + 1] - timestamps[i]
            const mins = Math.round(secs / 6) / 10
            minsPresent += mins
        }
        return minsPresent
    }

    static dateTimeString(startTimestamp, timestamp) {
        const date = new Date(startTimestamp * 1000).toLocaleDateString()
        return `${date}, ${Utils.toTimeString(
            startTimestamp
        )} — ${Utils.toTimeString(timestamp)}`
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

    static getNames(fullName, firstName = '') {
        if (fullName.includes('|')) {
            return fullName.split('|')
        }
        if (Utils.nameMap.has(fullName)) {
            return Utils.nameMap.get(fullName)
        }
        const lastName = fullName
            .replace(new RegExp(`^${firstName}\\s*`), '')
            .replace(new RegExp(`\\s*${firstName}$`), '')
            .replace(',', '')
            .trim()
        Utils.nameMap.set(fullName, [firstName, lastName])
        return [firstName, lastName]
    }

    static compareFirst(a, b) {
        return Utils.collator.compare(
            Utils.getNames(a)[0],
            Utils.getNames(b)[0]
        )
    }

    static compareLast(a, b) {
        return Utils.collator.compare(
            Utils.getNames(a)[1],
            Utils.getNames(b)[1]
        )
    }
}
