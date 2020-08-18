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
    const date = new Intl.DateTimeFormat(undefined, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateStyle: 'short',
    }).format(new Date(startTimestamp * 1000))
    return `${date}, ${toTimeString(startTimestamp)} — ${toTimeString(
        timestamp
    )}`
}

function toTimeString(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeStyle: 'short',
    }).format(new Date(timestamp * 1000))
}

function compare(a, b) {
    var aName = a.split(' ')
    var bName = b.split(' ')

    var aLastName = aName[aName.length - 1]
    var bLastName = bName[bName.length - 1]

    if (aLastName < bLastName) return -1
    if (aLastName > bLastName) return 1
    return 0
}