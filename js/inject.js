;(function () {
    let dataPath = []

    // _.mY = function(a) {
    //     return a.d0.slice()
    // }
    const regex = /function\(a\){return a.[a-zA-Z0-9$_]+\.slice\(\)}/
    const nameRegex = /(\(|\[)([^\(\[\)\]]+)(\)|\])/

    const finder = setInterval(attemptHook, 1)

    function attemptHook() {
        log(`Attempting hook...`)
        for (const _k in window.default_MeetingsUi) {
            const v = window.default_MeetingsUi[_k]
            if (v && typeof v === 'function') {
                if (regex.test(v.toString())) {
                    log('If you\'re seeing this, I have already lost my sanity fixing this bug')
                    const og = v
                    const arrPath = v.toString().split('.')[1]
                    window.default_MeetingsUi[_k] = function (a) {
                        window.dispatchEvent(
                            new CustomEvent('atd', { detail: a[arrPath] })
                        )
                        return og.call(this, a)
                    }
                    log(
                        `Successfully hooked into participant data function at window.default_MeetingsUi.${_k}.`
                    )
                    clearInterval(finder)
                    break
                }
            }
        }
    }

    let cache = []
    window.addEventListener('atd', function (event) {
        cache = event.detail
    })

    setInterval(function () {
        if (dataPath.length === 0) {
            outer: for (const [___k, ___v] of Object.entries(cache[0])) {
                if (___v && typeof ___v === 'object') {
                    for (const [__k, __v] of Object.entries(___v)) {
                        if (__v && typeof __v === 'object') {
                            for (const [_k, _v] of Object.entries(__v)) {
                                if (_v && Array.isArray(_v) && _v.length === 32) {
                                    dataPath = [___k, __k, _k]
                                    log(
                                        `Found path to participant data: el.${___k}.${__k}.${_k}`
                                    )
                                    break outer
                                }
                            }
                        }
                    }
                }
            }
        }

        let names = []
        for (const element of cache) {
            const array = element[dataPath[0]][dataPath[1]][dataPath[2]]
            if (array[4] && array[6].length === 0 && array[20] == undefined) {
                const fullName = array[1]
                if (fullName.includes(',')) {
                    const names = fullName.split(/,(.+)/)
                    var firstName = names[1]
                    var lastName = names[0]
                } else {
                    firstName = array[28]
                    lastName = fullName.replace(firstName, '')
                }
                firstName = firstName.replace(nameRegex, '').trim()
                lastName = lastName.replace(nameRegex, '').trim()
                names.push(firstName + '|' + lastName)
            }
        }

        window.postMessage(
            {
                attendance: names,
                sender: 'Ya boi',
            },
            'https://meet.google.com'
        )
    }, 1000)

    function log(message) {
        console.log(
            `%c[A4GM]%c ${message} `,
            'color:white;background:#058D80',
            'font-weight:bold;color:#058D80;'
        )
    }
})()
