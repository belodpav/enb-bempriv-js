var path  = require('path');
var Vow   = require('vow');
var vowFs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('bempriv-js')
    .target('target', '?.bempriv.js')
    .defineOption('privFile', '')
    .useFileList(['bempriv.js'])
    .needRebuild(function (cache) {
        this._privFile = this._privFile ?
            path.join(this.node._root, this._privFile) :
            path.join(this.node._root, './node_modules/bem-priv/build/lib/bempriv.js');            
        return cache.needRebuildFile('bh-file', this._privFile);
    })
    .saveCache(function (cache) {
        cache.cacheFileInfo('bempriv-file', this._privFile);
    })
    .builder(function (privFiles) {
        var node = this.node;
        var privFile = this._privFile;

        return Vow.all([
        Vow.all(privFiles.map(function (file) {
                return vowFs.read(file.fullname, 'utf8').then(function (data) {
                    var relPath = node.relativePath(file.fullname);

                    return [
                        '// begin: ' + relPath,
                        data,
                        '// end: ' + relPath
                    ].join('\n');
                });
            })).then(function (sr) {
                  return sr.join('\n');
            })
        ])
            .spread(function (inputSources) {
                return [
                    "var BEMPRIV = require('" + privFile + "');" ,
                    inputSources,
                    'module.exports = BEMPRIV;'
                ].join('\n');
        });
    })
    .createTech();