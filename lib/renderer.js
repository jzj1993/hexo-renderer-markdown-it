'use strict';

console.log('markdown it init');

// this: hexo object
// hexo: <ref *1> Hexo {
//   _events: [Object: null prototype] {
//     generateBefore: [Array],
//     generateAfter: [Function (anonymous)]
//   },
//   _eventsCount: 2,
//   _maxListeners: undefined,
//   base_dir: '/Users/jzj/blog/',
//   public_dir: '/Users/jzj/blog/public/',
//   source_dir: '/Users/jzj/blog/source/',
//   plugin_dir: '/Users/jzj/blog/node_modules/',
//   script_dir: '/Users/jzj/blog/scripts/',
//   scaffold_dir: '/Users/jzj/blog/scaffolds/',
//   theme_dir: '/Users/jzj/blog/themes/next/',
//   theme_script_dir: '/Users/jzj/blog/themes/next/scripts/',
//   env: {
//     args: [Object],
//     debug: false,
//     safe: false,
//     silent: false,
//     env: 'development',
//     version: '6.0.0',
//     cmd: 'gen',
//     init: true
//   },
//   extend: {
//     console: [Console],
//     deployer: [Deployer],
//     filter: [Filter],
//     generator: [Generator],
//     helper: [Helper],
//     injector: [Injector],
//     migrator: [Migrator],
//     processor: [Processor],
//     renderer: [Renderer],
//     tag: [Tag]
//   },
//   config: {
//     ... // _config.yml
//   },
//   log: Logger {
//     _debug: false,
//     level: 30,
//     d: [Function: debug],
//     i: [Function: info],
//     w: [Function: warn],
//     e: [Function: error],
//     log: [Function: info]
//   },
//   render: Render { context: [Circular *1], renderer: [Renderer] },
//   route: Router {
//     _events: [Object: null prototype] {},
//     _eventsCount: 0,
//     _maxListeners: undefined,
//     routes: {},
//     [Symbol(kCapture)]: false
//   },
//   post: Post { context: [Circular *1] },
//   scaffold: Scaffold {
//     context: [Circular *1],
//     scaffoldDir: '/Users/jzj/blog/scaffolds/',
//     defaults: [Object]
//   },
//   _dbLoaded: true,
//   _isGenerating: true,
//   database: Database {
//     options: [Object],
//     _models: [Object],
//     Model: [class _Model extends Model]
//   },
//   config_path: '/Users/jzj/blog/_config.yml',
//   source: Source {
//     _events: [Object: null prototype] {},
//     _eventsCount: 0,
//     _maxListeners: undefined,
//     options: [Object],
//     context: [Circular *1],
//     base: '/Users/jzj/blog/source/',
//     processors: [Array],
//     _processingFiles: [Object],
//     watcher: null,
//     Cache: [_Model],
//     File: [class _File extends File],
//     ignore: [],
//     [Symbol(kCapture)]: false
//   },
//   theme: Theme {
//     _events: [Object: null prototype] {},
//     _eventsCount: 0,
//     _maxListeners: undefined,
//     options: [Object],
//     context: [Circular *1],
//     base: '/Users/jzj/blog/themes/next/',
//     processors: [Array],
//     _processingFiles: [Object],
//     watcher: null,
//     Cache: [_Model],
//     File: [class _File extends File],
//     ignore: [Array],
//     config: [Object],
//     views: [Object],
//     i18n: [i18n],
//     View: [class _View extends View],
//     [Symbol(kCapture)]: false
//   },
//   locals: Locals { cache: [Cache], getters: [Object] },
//   [Symbol(kCapture)]: false
// }
// }
// data {
//   text: 'markdown content',
//   path: '/Users/jzj/blog/source/_posts/测试.md',
//   engine: undefined,
//   toString: true,
//   onRenderEnd: [Function: onRenderEnd]
// }
// options: {}
module.exports = function (data, options) {

  const MdIt = require('markdown-it');
  let { markdown } = this.config;

  // Temporary backward compatibility
  if (typeof markdown === 'string') {
    markdown = {
      preset: markdown
    };
    this.log.warn(`Deprecated config detected. Please use\n\nmarkdown:\n  preset: ${markdown.preset}\n\nSee https://github.com/hexojs/hexo-renderer-markdown-it#options`);
  }

  const { preset, render, enable_rules, disable_rules, plugins, anchors } = markdown;
  let parser = new MdIt(preset, render);

  if (enable_rules) {
    parser.enable(enable_rules);
  }

  if (disable_rules) {
    parser.disable(disable_rules);
  }

  if (plugins) {
    parser = plugins.reduce((parser, pugs) => {
      if (pugs instanceof Object && pugs.name) {
        return parser.use(require(pugs.name), pugs.options);
      }
      return parser.use(require(pugs));

    }, parser);
  }

  if (anchors) {
    parser = parser.use(require('hexo-renderer-markdown-it/lib/anchors'), anchors);
  }

  const hexo = this;

  parser.use(function (md, opts) {
    const { url_for } = require('hexo-util');
    const fs = require('fs');
    const path = require('path');

    const img_public_sub_dir = 'blog-imgs';

    function is_relative_path(src) {
      return !/^(#|\/\/|http(s)?:)/.test(src) && !src.startsWith('/') && !src.startsWith('\\');
    }

    function processSrc(src) {
      console.log('process src', src)
      // reference
      // https://github.com/hexojs/hexo-renderer-marked/pull/159/files

      // hexo.source_dir:   '/Users/xx/blog/source/'
      // post_root_dir:     '/Users/xx/blog/source/_posts/'
      // post_path:         '/Users/xx/blog/source/_posts/dir/name.md'
      // post_relative_path:'dir/name.md'
      // post_relative_dir: 'dir/'

      // img_path:          '/Users/xx/blog/source/_posts/dir/img/pic.png'
      // hexo.public_dir:   '/Users/xx/blog/public/'
      // img_public_path:   '/Users/xx/blog/public/dir/img/pic.png'
      // src:               'img/pic.png'
      // img_public_sub_dir:'blog-imgs'
      // final-src:         '/blog-imgs/dir/img/pic.png'
      const oldSrc = src;
      if (is_relative_path(src)) {
        const post_root_dir = path.join(hexo.source_dir, '_posts') // '/Users/xx/blog/source/_posts/'
        const post_path = data.path;  // '/Users/xx/blog/source/_posts/dir/name.md'
        if (post_path.startsWith(post_root_dir)) {
          const post_relative_path = path.relative(post_root_dir, post_path) // 'dir/name.md' or 'name.md'
          const post_relative_dir = path.dirname(post_relative_path) // 'dir' or ''
          const img_path = path.join(post_root_dir, post_relative_dir, src); // '/Users/xx/blog/source/_posts/dir/img/pic.png'
          try {
            if (fs.existsSync(img_path)) {
              const img_public_path = path.join(hexo.public_dir, img_public_sub_dir, post_relative_dir, src); // '/Users/xx/blog/public/blog-imgs/dir/img/pic.png'
              fs.mkdirSync(path.dirname(img_public_path), { recursive: true });
              fs.copyFileSync(img_path, img_public_path);
              src = url_for.call(hexo, path.join(img_public_sub_dir, post_relative_dir, src).replace(/\\/g, '/'));
              console.log(`Image copied: ${img_path} -> ${img_public_path}`);
              return src;
            } else {
              console.warn(`Image not exists: '${img_path}'`);
            }
          } catch (e) {
            console.error(`Image process error '${img_path}'`, e);
          }
        } else {
          console.error(`Post is not in the right directory: ${post_path}`)
        }
      }
      return oldSrc
    }

    const originalImage = md.renderer.rules.image;

    md.renderer.rules.image = function (...args) {
      // Token {
      //   type: 'image',
      //   tag: 'img',
      //   attrs: [ [ 'src', 'markdown-test-image.jpg' ], [ 'alt', '' ] ],
      //   children: [
      //     Token {
      //       type: 'text',
      //       content: 'image title',
      //       // ...
      //     }
      //   ],
      //   content: 'image title',
      //   //...
      // }
      const [tokens, idx, options, env, slf] = args;
      const token = tokens[idx];
      const attrs = token.attrs;

      if (Array.isArray(attrs) && attrs.length > 0) {
        for (let i = 0; i < attrs.length; ++i) {
          const attr = attrs[i];
          if (attr[0] === 'src') {
            attr[1] = processSrc(attr[1]);
            break;
          }
        }
      }
      return originalImage.apply(this, args);
    };
  });

  this.execFilterSync('markdown-it:renderer', parser, { context: this });

  return parser.render(data.text);
};
