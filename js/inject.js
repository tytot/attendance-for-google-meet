'use strict'
{
    const prop = '[\\w$]{2,3}'
    const getAllRegex = new RegExp(
        `^getAll\\(\\){return\\[\\.\\.\\.this\\.(${prop})\\.values\\(\\)\\]\\.map\\(a=>a\\.(${prop})\\)}$`
    )
    const filterRegex = new RegExp(
        `^${prop}\\(\\){return this\\.getAll\\(\\)\\.filter\\(${prop}\\)}$`
    )

    let retries = 0
    const maxRetries = 10000

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
        getAll: function () {
            const mapValues = this.map ? [...this.map.values()] : []
            return mapValues.map((a) => a[this.dataProp])
        },
        names: function () {
            return this.filterFunc.call(this).map((a) => this.getName(a))
        },
        namesChanged: function (names) {
            return (
                this.lastNames.length !== names.length ||
                !Utils.areEqualArrays(this.lastNames, names)
            )
        },
    }

    const finder = setInterval(attemptHook, 1)

    function attemptHook() {
        try {
            for (const key in window.default_MeetingsUi) {
                const val = window.default_MeetingsUi[key]
                if (!val?.prototype) continue
                const getAll = Object.getOwnPropertyDescriptor(
                    val.prototype,
                    'getAll'
                )
                if (!getAll) continue
                const match = getAll.value
                    .toString()
                    .replace('\n', '')
                    .match(getAllRegex)
                if (!match) {
                    continue
                }
                hooker.dataProp = match[2]
                for (const funcName of Object.getOwnPropertyNames(
                    val.prototype
                )) {
                    const func = Object.getOwnPropertyDescriptor(
                        val.prototype,
                        funcName
                    )
                    if (!func) continue
                    if (filterRegex.test(func.value.toString())) {
                        hooker.filterFunc = func.value
                        break
                    }
                }
                if (!hooker.filterFunc) {
                    continue
                }
                const og = val.prototype.getAll
                val.prototype.getAll = function () {
                    hooker.map = this[match[1]]
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
        if (++retries == maxRetries) {
            Utils.log(
                `Unable to perform hook within ${maxRetries / 1000} seconds.`
            )
            clearInterval(finder)
        }
    }

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
