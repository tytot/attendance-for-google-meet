'use strict'
{
    let dataPath
    let arrayKey

    const regex1 = /function\(\){_\.[a-zA-Z0-9$_]{2,3}\.prototype\.[a-zA-Z0-9$_]{2,3}\.call\(this\);[a-zA-Z0-9$_]{2,3}\(this\)}/
    const regex2 = /[a-zA-Z0-9$_]{2,3}\(\){super\.[a-zA-Z0-9$_]{2,3}\(\);[a-zA-Z0-9$_]{2,3}\(this\)}/
    const nameRegex = /(\(|\[)([^\(\[\)\]]+)(\)|\])/

    const finder = setInterval(attemptHook, 1)

    function attemptHook() {
        log(`Attempting hook...`)
        outer: for (const _k in window.default_MeetingsUi) {
            const v = window.default_MeetingsUi[_k]
            if (!v || !v.prototype) {
                continue
            }
            for (const k of Object.getOwnPropertyNames(v.prototype)) {
                const p = Object.getOwnPropertyDescriptor(v.prototype, k)
                if (
                    k === 'constructor' ||
                    !p ||
                    !p.value ||
                    v.prototype[k].__grid_ran
                ) {
                    continue
                }
                const funcString = p.value.toString()
                if (!regex1.test(funcString) && !regex2.test(funcString)) {
                    continue
                }
                const og = v.prototype[k]
                v.prototype[k] = function () {
                    window.dispatchEvent(
                        new CustomEvent('atd', { detail: this })
                    )
                    og.call(this)
                }
                log(
                    `Successfully hooked into participant data function at ${_k}.prototype.${k}.`
                )
                clearInterval(finder)
                break outer
            }
        }
    }

    window.addEventListener('atd', (event) => {
        if (!dataPath) {
            identifyDataPath(event.detail)
        }
        const data = event.detail[dataPath[0]][dataPath[1]][dataPath[2]].get(
            dataPath[3]
        )[dataPath[4]][dataPath[5]]

        let names = []
        for (const participantData of Object.values(data)) {
            const meta = participantData[arrayKey]
            const isInMeet = meta[4]
            const isYou = meta[6].length > 0
            const isPresenting = meta[20] !== undefined
            if (isInMeet && !isYou && !isPresenting) {
                const fullName = meta[1]
                const firstName = meta[28].replace(nameRegex, '').trim()
                const lastName = fullName
                    .replace(firstName, '')
                    .replace(nameRegex, '')
                    .replace(',', '')
                    .trim()
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
    })

    function identifyDataPath(details) {
        for (const [___k, ___v] of Object.entries(details)) {
            if (!___v) {
                continue
            }
            for (const [__k, __v] of Object.entries(___v)) {
                if (!__v) {
                    continue
                }
                for (const [_k, _v] of Object.entries(__v)) {
                    if (!_v || !(_v instanceof Map) || _v.size === 0) {
                        continue
                    }
                    const [k, v] = _v.entries().next().value
                    if (
                        typeof k !== 'string' ||
                        k.substring(0, 7) !== 'spaces/'
                    ) {
                        continue
                    }
                    for (const [k_, v_] of Object.entries(v)) {
                        if (!v_ || !v_.hasOwnProperty('data')) {
                            continue
                        }
                        dataPath = [___k, __k, _k, k, k_, 'data']
                        for (const v__ of Object.values(v_.data)) {
                            for (const [k___, v___] of Object.entries(v__)) {
                                if (!Array.isArray(v___)) {
                                    continue
                                }
                                arrayKey = k___
                                log(
                                    `Found path to participant data at {source}.${___k}.${__k}.${_k}.${k}.${k_}.data.{id}.${k___}.`
                                )
                                return
                            }
                        }
                    }
                }
            }
        }
    }

    function log(message) {
        console.log(
            `%c[A4GM]%c ${message} `,
            'color:white;background:#058D80',
            'font-weight:bold;color:#058D80;'
        )
    }
}
