'use strict'
{
    const prop = '[\\w$]{2,3}'
    const getAllRegex = new RegExp(
        `^getAll\\(\\){return\\[\\.\\.\\.this\\.(${prop})\\.values\\(\\)\\]\\.map\\(a=>a\\.(${prop})\\)}$`
    )
    const filterRegex = new RegExp(
        `^${prop}\\(\\){return this\\.getAll\\(\\)\\.filter\\(a=>!a\\.(${prop})&&5===a\\.state\\)}$`
    )

    const hooker = {
        getName: function (data) {
            if (!this.dataPath) {
                const [[, value]] = this.map.entries()
                const data = value[this.dataProp]
                for (const key in data) {
                    for (const subKey in data[key]) {
                        const array = data[key][subKey]
                        if (
                            !Array.isArray(array) ||
                            !array[0]?.startsWith?.('spaces/')
                        ) {
                            continue
                        }
                        this.dataPath = [key, subKey]
                        Utils.log('Found path to participant data.')
                    }
                }
            }
            const participant = data[this.dataPath[0]][this.dataPath[1]]
            const fullName = participant[28]
            const firstName = participant[37]
            return Utils.getNames(fullName, firstName).join('|')
        },
        lastNames: [],
        names: function () {
            const names = [...(this.map?.values() || [])]
                .map((a) => a[this.dataProp])
                .filter((a) => !a[this.filterProp] && 5 === a.state)
                .map((a) => this.getName(a))
            return names
        },
        namesChanged: function (names) {
            return (
                this.lastNames.length !== names.length ||
                !Utils.areEqualArrays(this.lastNames, names)
            )
        },
    }

    function attemptHook() {
        try {
            for (const key in window.default_MeetingsUi) {
                const val = window.default_MeetingsUi[key]
                if (!val?.prototype) continue
                const getAllMatch = Object.getOwnPropertyDescriptor(
                    val.prototype,
                    'getAll'
                )
                    ?.value?.toString()
                    .replace('\n', '')
                    .match(getAllRegex)
                if (!getAllMatch) {
                    continue
                }
                hooker.dataProp = getAllMatch[2]
                if (
                    !Object.getOwnPropertyNames(val.prototype).some(
                        (funcName) =>
                            (hooker.filterProp =
                                Object.getOwnPropertyDescriptor(
                                    val.prototype,
                                    funcName
                                )
                                    ?.value?.toString()
                                    .match(filterRegex)?.[1])
                    )
                ) {
                    continue
                }
                const og = val.prototype.getAll
                val.prototype.getAll = function () {
                    hooker.map = this[getAllMatch[1]]
                    val.prototype.getAll = og
                    return og.call(this)
                }
                Utils.log(`Successfully hooked into ${key}#getAll.`)
                clearInterval(finder)
                break
            }
        } catch (e) {
            console.error(e)
        }
    }

    const finder = setInterval(attemptHook, 1)

    function sendUpdate() {
        const names = hooker.names()
        if (hooker.namesChanged(names)) {
            hooker.lastNames = names
            window.postMessage(
                {
                    attendance: [...new Set(names)],
                    sender: 'A4GM',
                },
                'https://meet.google.com'
            )
        }
    }

    setInterval(sendUpdate, 500)
}
