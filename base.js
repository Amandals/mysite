var Site = (function () {
    function Site() {
        this.router = new Carbon.Router({
            '/': this.index.bind(this),
            '/about': this.about.bind(this),
            '/contact': this.contact.bind(this),
            '/projects/{id}': this.project.bind(this),
            '/blog': this.blog.bind(this),
            '/blog/{tag}': this.blog.bind(this)
        });
        document.addEventListener('route:load', this.onLoaded.bind(this));
        this.router.start({ dispatch: true });
        window.addEventListener('scroll', this.onScroll.bind(this), false);
    }
    Site.prototype.blog = function (cxt) {
        if (cxt.init)
            return;
        this.selectLink('blog');
        return this.load(cxt.url);
    };
    Site.prototype.index = function (cxt) {
        if (cxt.init)
            return;
        this.selectLink('home');
        return this.load('/');
    };
    Site.prototype.selectLink = function (name) {
        _.queryAll('.siteLinks li').forEach(function (el) {
            el.classList.remove('current');
        });
        var el = document.getElementById(name + 'Link');
        el && el.classList.add('current');
    };
    Site.prototype.project = function (cxt) {
        if (cxt.init)
            return;
        _.queryAll('.siteLinks li').forEach(function (el) {
            el.classList.remove('current');
        });
        return this.load('/projects/' + cxt.params.id).then(function () {
            return Promise.resolve(true);
        });
    };
    Site.prototype.about = function (cxt) {
        if (cxt.init)
            return;
        this.selectLink('about');
        return this.load('/about');
    };
    Site.prototype.contact = function (cxt) {
        if (cxt.init)
            return;
        this.selectLink('contact');
        this.load('/contact');
    };
    Site.prototype.onScroll = function () {
        var scrollTop = window.scrollY;
        if (scrollTop > 100) {
            document.body.classList.add('belowFold');
        }
        else {
            document.body.classList.remove('belowFold');
        }
        if (scrollTop > 10) {
            document.body.classList.add('detailsInView');
        }
        else {
            document.body.classList.remove('detailsInView');
        }
        scrollToTop(document.querySelector('.topLink'));
    };
    Site.prototype.load = function (path, immediate) {
        var url = path + (path.indexOf('?') > -1 ? '&' : '?') + 'partial=true';
        var mainEl = document.querySelector('main');
        return fetch(url, {
            credentials: 'include',
            headers: {
                'Accept': acceptHeader
            }
        }).then(function (response) {
            document.title = decodeURI(response.headers.get("X-Page-Title"));
            return response.text();
        })
            .then(function (html) {
            mainEl.innerHTML = html;
            if (!immediate) {
                window.scrollTo(0, 0);
            }
            pokeDom();
            return Promise.resolve(true);
        });
    };
    Site.prototype.onLoaded = function (e) {
        if (CM.Gallery.instance) {
            CM.Gallery.instance.dispose();
            CM.Gallery.instance = null;
        }
        var colorScheme = document.body.dataset['siteColorScheme'];
        document.body.classList.remove('light');
        document.body.classList.remove('dark');
        var containerEl = document.getElementById('container');
        if (containerEl && containerEl.dataset['colorScheme']) {
            colorScheme = containerEl.dataset['colorScheme'];
        }
        document.body.classList.add(colorScheme);
        pokeDom();
    };
    Site.prototype.loadPartial = function (data) {
        var _this = this;
        fetch(data.url, {
            credentials: 'include',
            headers: {
                'Accept': acceptHeader
            }
        })
            .then(function (response) { return response.text(); })
            .then(function (html) {
            switch (_this.path) {
                case '/':
                    _this.selectLink('home');
                    break;
                case '/about':
                    _this.selectLink('about');
                    break;
                case '/contact':
                    _this.selectLink('contact');
                    break;
                case '/blog':
                    _this.selectLink('blog');
                    break;
            }
        });
    };
    return Site;
}());
var SiteActions = {
    updateBlock: function (data) {
        var block = SiteBlocks[data.name];
        if (block) {
            block.update(data.data);
        }
    }
};
var SiteBlocks = {
    nav: {
        update: function (data) {
            site.loadPartial({
                url: '/?partial=header',
                selector: '#header'
            });
        }
    },
    siteTitle: {
        update: function (text) {
            var el = document.querySelector('#header h1');
            el.textContent = text || '';
            el.classList[text ? 'remove' : 'add']('hide');
        }
    },
    brandingGlyph: {
        update: function (value) {
            var el = document.querySelector('carbon-glyph');
            el.innerHTML = "&#x" + value + ";";
        }
    },
    siteFooterContent: {
        update: function (text) {
            var el = document.querySelector('#rights .inner p');
            el.innerHTML = text;
        }
    },
    logo: {
        update: function () {
            site.loadPartial({
                url: '/?partial=header',
                selector: '#header'
            });
        }
    }
};
function scrollToTop(triggerEl) {
    if (!triggerEl)
        return;
    var scrollTop = window.scrollY;
    if (scrollTop > 250) {
        var contentBottom = document.body.scrollHeight - $('body').height();
        triggerEl.style.opacity = '1';
        triggerEl.style.margin = '0 0 50px';
        if (Math.abs(scrollTop - contentBottom) < 200) {
            triggerEl.style.margin = '0 0 100px';
        }
    }
    else {
        triggerEl.style.opacity = '0';
        triggerEl.style.margin = '0';
    }
}
Carbon.controllers.set('jump', {
    top: function () {
        $('html, body').animate({ scrollTop: 0 }, 200);
    }
});
$('body').on('click', '#bottom', function () {
    $('html, body').animate({ scrollTop: $('#detailsContainer').offset().top }, 200);
});
Carbon.controllers.set('caption', {
    show: function (e) {
        var captionEl = $(e.target).next('carbon-caption');
        captionEl.closest('carbon-piece').addClass('showCaption');
        captionEl.one('mouseleave', function (e) {
            captionEl.closest('carbon-piece').removeClass('showCaption');
        });
    }
});
Carbon.controllers.set('gallery', {
    setup: function (e) { new CM.Gallery(e.target); }
});
Carbon.controllers.set('form', {
    setup: function (e) {
        var form = new Carbon.Form(e.target);
        form.element.querySelector('textarea').addEventListener('input', function () {
            form.validate();
        });
    }
});
var site = new Site();
function pokeDom() {
    _.queryAll('[on-insert]').forEach(function (el) {
        Carbon.ActionKit.dispatch({
            type: 'insert',
            target: el
        });
        el.removeAttribute('on-insert');
    });
}
Carbon.ActionKit.observe('mouseover', 'click');
pokeDom();
var supportsWebP = false;
var acceptHeader = '*/*';
var webp = new Image();
webp.onload = function () {
    supportsWebP = true;
    acceptHeader = '*/*,image/webp';
};
webp.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
