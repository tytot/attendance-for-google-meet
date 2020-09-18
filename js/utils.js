function hashCode(s) {
    var nHash = 0
    if (!s.length) return nHash
    for (var i = 0, imax = s.length, n; i < imax; ++i) {
        n = s.charCodeAt(i)
        nHash = (nHash << 5) - nHash + n
        nHash = nHash & nHash // Convert to 32-bit integer
    }
    return Math.abs(nHash)
}

function dateTimeString(startTimestamp, timestamp) {
    const date = new Date(startTimestamp * 1000).toLocaleDateString()
    return `${date}, ${toTimeString(startTimestamp)} — ${toTimeString(
        timestamp
    )}`
}

function toTimeString(timestamp) {
    try {
        return new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: 'numeric',
            minute: 'numeric',
        })
    } catch (e) {
        return new Date(timestamp * 1000).toLocaleTimeString()
    }
}

function getFirstName(fullName) {
    if (fullName.includes(', ')) {
        return fullName.split(/,(.+)/)[1].trim()
    }
    const names = splitNames(fullName)
    if (names.length === 1) {
        var fName = fullName
    } else {
        for (var i = names.length - 1; i > 1; i--) {
            const name = names[i]
            if (name.charAt(0) === name.charAt(0).toLowerCase()) {
                break
            }
        }
        var fName = names.slice(0, i).join(' ')
    }
    return fName
}

function getLastName(fullName) {
    if (fullName.includes(', ')) {
        return fullName.split(/,(.+)/)[0].trim()
    }
    const names = splitNames(fullName)
    if (names.length === 1) {
        var lName = ''
    } else {
        for (var i = names.length - 1; i > 1; i--) {
            const name = names[i]
            if (name.charAt(0) === name.charAt(0).toLowerCase()) {
                break
            }
        }
        var lName = names.slice(i).join(' ')
    }
    return lName
}

function splitNames(fullName) {
    const names = fullName.split(' ')
    return names.filter(
        (name) =>
            !(
                (name.charAt(0) === '[' && name.slice(-1) === ']') ||
                (name.charAt(0) === '{' && name.slice(-1) === '}') ||
                (name.charAt(0) === '(' && name.slice(-1) === ')')
            )
    )
}

function compareFirst(a, b) {
    return getFirstName(a).localeCompare(getFirstName(b))
}

function compareLast(a, b) {
    return getLastName(a).localeCompare(getLastName(b))
}
