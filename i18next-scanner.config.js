const fs = require('fs')
const chalk = require('chalk')

module.exports = {
  compatibilityJSON: 'v4',
  input: [
    'src/**/*.{ts,tsx}',
    // Use ! to filter out files or directories
    '!**/node_modules/**'
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['i18next.t', 'i18n.t'],
      extensions: ['.ts', '.tsx']
    },
    lngs: ['en-us', 'zh-cn', 'zh-tw'],
    ns: ['locale'],
    defaultLng: 'en-us',
    defaultNs: 'locale',
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
      loadPath: 'src/renderer/src/i18n/locales/{{lng}}.json',
      savePath: 'src/renderer/src/i18n/locales/{{lng}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    nsSeparator: false, // namespace separator
    keySeparator: '.', // key separator
    interpolation: {
      prefix: '{{',
      suffix: '}}'
    },
    metadata: {},
    allowDynamicKeys: false
  },
  transform: function customTransform(file, enc, done) {
    'use strict'
    const parser = this.parser
    const content = fs.readFileSync(file.path, enc)
    let count = 0

    parser.parseFuncFromString(content, { list: ['i18next._', 'i18next.__'] }, (key, options) => {
      parser.set(
        key,
        Object.assign({}, options, {
          nsSeparator: false,
          keySeparator: false
        })
      )
      ++count
    })

    if (count > 0) {
      console.log(`i18next-scanner: count=${chalk.cyan(count)}, file=${chalk.yellow(JSON.stringify(file.relative))}`)
    }

    done()
  }
}
