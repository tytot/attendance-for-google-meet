const utils = {
    nameMap: new Map(),
    collator: new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
    }),
    log(message) {
        console.log(
            `%c[A4GM]%c ${message} `,
            'color:white;background:#058D80',
            'font-weight:bold;color:#058D80;'
        )
    },
    hashCode(s) {
        let nHash = 0
        if (!s.length) return nHash
        for (let i = 0, imax = s.length, n; i < imax; ++i) {
            n = s.charCodeAt(i)
            nHash = (nHash << 5) - nHash + n
            nHash = nHash & nHash // Convert to 32-bit integer
        }
        return Math.abs(nHash)
    },
    areEqualArrays(a1, a2) {
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
    },
    timeRangeString(startTimestamp, timestamp) {
        const date = new Date(startTimestamp * 1000).toLocaleDateString()
        return `${date}, ${a4gm.utils.timeString(
            startTimestamp
        )} — ${a4gm.utils.timeString(timestamp)}`
    },
    timeString(timestamp) {
        try {
            return new Date(timestamp * 1000).toLocaleTimeString([], {
                hour: 'numeric',
                minute: 'numeric',
            })
        } catch (e) {
            return new Date(timestamp * 1000).toLocaleTimeString()
        }
    },
    minsPresent(timestamps) {
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
    },
    guessNames(fullName) {
        const names = fullName
            .split(' ')
            .filter(
                (name) =>
                    !(
                        (name.charAt(0) === '[' && name.slice(-1) === ']') ||
                        (name.charAt(0) === '(' && name.slice(-1) === ')')
                    )
            )
        if (names.length === 1) {
            splitNames = [fullName, '']
        } else {
            let i = names.length - 1
            for (; i > 1; i--) {
                const name = names[i]
                if (name.charAt(0) === name.charAt(0).toLowerCase()) {
                    break
                }
            }
            splitNames = [names.slice(0, i).join(' '), names.slice(i).join(' ')]
        }
    },
    getNames(fullName, firstName) {
        if (a4gm.utils.nameMap.has(fullName)) {
            return a4gm.utils.nameMap.get(fullName).join(' ')
        }
        if (firstName == null) {
            return this.guessNames(fullName)
        }
        const lastName = fullName
            .replace(new RegExp(`^${firstName}\\s*`), '')
            .replace(new RegExp(`\\s*${firstName}$`), '')
            .replace(',', '')
            .trim()
        a4gm.utils.nameMap.set(fullName, [firstName, lastName])
        return `${firstName} ${lastName}`
    },
    compareFirst(a, b) {
        return a4gm.utils.collator.compare(
            a4gm.utils.getNames(a)[0],
            a4gm.utils.getNames(b)[0]
        )
    },
    compareLast(a, b) {
        return a4gm.utils.collator.compare(
            a4gm.utils.getNames(a)[1],
            a4gm.utils.getNames(b)[1]
        )
    },
    async openSpreadsheet() {
        const id = (await chrome.storage.local.get('spreadsheet-id'))[
            'spreadsheet-id'
        ]
        const url = `https://docs.google.com/spreadsheets/d/${id}`
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: url,
        })
    },
    openTroubleshoot() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: 'https://github.com/tytot/attendance-for-google-meet#troubleshoot',
        })
    },
    openChangelog() {
        chrome.runtime.sendMessage({
            data: 'open-url',
            url: `https://github.com/tytot/attendance-for-google-meet/releases/tag/v${
                chrome.runtime.getManifest().version
            }`,
        })
    },
}

const attendance = {
    removeStaleMeets(storage) {
        const timestamp = ~~(Date.now() / 1000)
        const staleMeetCodes = []
        for (const key in storage) {
            const value = storage[key]
            if (
                value.timestamp &&
                timestamp - value.timestamp >= storage['reset-interval'] * 3600
            ) {
                staleMeetCodes.push(key)
                delete storage[key]
            }
        }
        return staleMeetCodes
    },
    process(attendance, meetData) {
        const timestamp = ~~(Date.now() / 1000)
        meetData = meetData ?? {
            participants: {},
            'start-timestamp': timestamp,
        }
        const participants = meetData.participants
        meetData.timestamp = timestamp
        for (const name of attendance) {
            if (!participants.hasOwnProperty(name)) {
                participants[name] = [timestamp]
            } else if (participants[name].length % 2 === 0) {
                participants[name].push(timestamp)
            }
        }
        for (const name in participants) {
            if (
                !attendance.includes(name) &&
                participants.hasOwnProperty(name)
            ) {
                if (participants[name].length % 2 === 1) {
                    participants[name].push(timestamp)
                }
            }
        }
        return meetData
    },
}

const a4gm = { utils, attendance }
