var CM;
(function (CM) {
    var Gallery = (function () {
        function Gallery(element) {
            var _this = this;
            this.slides = [];
            this.maxHeight = 0;
            this.duration = 400;
            this.listeners = [];
            this.element = element;
            var slideEls = this.element.queryAll('.slide');
            slideEls.forEach(function (el, i) {
                var slide = new Slide(el, i);
                _this.slides.push(slide);
                if (slide.width > _this.maxHeight) {
                    _this.maxHeight = slide.height;
                }
                if (slide.type == 'video' && _this.maxHeight < 540) {
                    _this.maxHeight = 540;
                }
            });
            this.viewportEl = this.element.querySelector('.viewport');
            this.viewportEl.style.height = this.maxHeight + 'px';
            this.prevLink = this.element.querySelector('.prevLink');
            this.nextLink = this.element.querySelector('.nextLink');
            this.prevLink.addEventListener('click', this.prev.bind(this));
            this.nextLink.addEventListener('click', this.next.bind(this));
            if (this.slides.length == 1) {
                this.element.classList.add('single');
            }
            this.thumbnailsEl = document.getElementById('thumbnails');
            if (this.thumbnailsEl) {
                this.thumbStrip = new CM.Thumbnails(this.thumbnailsEl, this);
            }
            var hash = window.location.hash;
            if (hash && hash.length > 1) {
                var hashValue = hash.split("#")[1];
                var index = parseInt(hashValue, 10) - 1;
                this.view(index, true);
            }
            else {
                this.view(0);
            }
            this.listeners.push(_.observe(window, 'hashchange', this.onHashChange.bind(this)), _.observe(window, 'resize', this.onResize.bind(this)), _.observe(window, 'keyup', this.onKeyPressed.bind(this)));
            this.onResize();
            Gallery.instance = this;
        }
        Gallery.prototype.onKeyPressed = function (e) {
            switch (e.which) {
                case 39:
                    this.next();
                    break;
                case 37:
                    this.prev();
                    break;
            }
        };
        Gallery.prototype.onResize = function () {
            if (!this.activeSlide)
                return;
            var item = this.activeSlide;
            var winHeight = window.innerHeight;
            var winWidth = window.innerWidth;
            var thumbHeight = this.thumbnailsEl != null ? this.thumbnailsEl.offsetHeight : 0;
            var headerHeight = document.getElementById('header').offsetHeight;
            var titleHeight = this.element.querySelector('h1').offsetHeight;
            var paddingBottom = parseInt(this.element.dataset['paddingBottom'] || '25', 10);
            var pieceEl = item.element.querySelector('.piece');
            var captionHeight = 0;
            var captionEl = item.element.querySelector('carbon-caption');
            if (this.element.matches('.captionsBelow')) {
                captionHeight = $(captionEl).outerHeight(true);
            }
            var viewportHeight = winHeight - (thumbHeight + headerHeight + titleHeight + paddingBottom);
            if (viewportHeight > this.maxHeight) {
                viewportHeight = this.maxHeight;
                document.body.classList.remove('detailsBelowFold');
            }
            else {
                document.body.classList.add('detailsBelowFold');
            }
            if (viewportHeight < 320) {
                viewportHeight = 320;
            }
            if (viewportHeight < 540) {
                viewportHeight = 540;
            }
            var pieceHeight = viewportHeight - captionHeight;
            this.viewportEl.style.height = viewportHeight + 'px';
            var size = getDimensions(this.activeSlide.width, this.activeSlide.height, winWidth, pieceHeight);
            if (item.fixedHeight) {
                size.height = 90;
            }
            var linkWidth = (winWidth - size.width) / 2;
            this.prevLink.style.width = linkWidth + 'px';
            this.nextLink.style.width = linkWidth + 'px';
            var paddingTop = (viewportHeight - (size.height + captionHeight)) / 2;
            var artworkEl = pieceEl.querySelector('.artwork');
            if (artworkEl) {
                artworkEl.style.height = size.height + 'px';
                artworkEl.style.backgroundPosition = 'center';
            }
            if (item.type == 'video' || item.type == 'audio') {
                var mpEl = item.element.querySelector('carbon-player');
                mpEl.style.width = size.width + 'px';
                mpEl.style.height = size.height + 'px';
                if (item.fixedHeight) {
                    paddingTop -= 15;
                }
                item.element.style.marginTop = paddingTop + 'px';
            }
            else if (this.element.matches('.captionsBelow') && captionHeight > 0) {
                pieceEl.style.width = '100%';
                pieceEl.style.height = '100%';
                pieceEl.style.margin = '0';
                if (artworkEl) {
                    artworkEl.style.margin = 'auto';
                    artworkEl.style.marginTop = paddingTop + "px";
                    artworkEl.style.width = size.width + 'px';
                    artworkEl.style.height = size.height + 'px';
                }
            }
            else {
                pieceEl.style.marginTop = paddingTop + "px";
                pieceEl.style.width = size.width + 'px';
                pieceEl.style.height = size.height + 'px';
            }
        };
        Gallery.prototype.onHashChange = function (e) {
            var hash = window.location.hash;
            if (hash && hash.length > 1) {
                var hashValue = hash.split('#')[1];
                var itemIndex = parseInt(hashValue, 10) - 1;
                console.log('hashchange', itemIndex);
                if (this.activeSlide && itemIndex != this.activeSlide.index) {
                    this.view(itemIndex);
                }
            }
        };
        Gallery.prototype.view = function (index, jump) {
            var _this = this;
            console.log('view', index);
            this.duration = jump ? 0 : 500;
            if (this.slides.length != 0 && ((index + 1) > this.slides.length)) {
                console.log('loop');
                this.view(0);
                return;
            }
            if (this.activeSlide && (index == this.activeSlide.index)) {
                console.log('dub');
                return;
            }
            this.activeSlide && this.activeSlide.unload();
            var slide = this.slides[index];
            if (!slide)
                return;
            this.activeSlide = slide;
            this.element.classList.add('loading');
            this.onResize();
            if (slide.number == 1 && !window.location.hash) {
            }
            else {
                window.location.hash = slide.number.toString();
            }
            var prevSlide = this.slides[index - 1];
            var nextSlide = this.slides[index + 1];
            prevSlide && prevSlide.preload();
            nextSlide && nextSlide.preload();
            if (index == 0) {
                this.prevLink.classList.add('disabled');
            }
            else {
                this.prevLink.classList.remove('disabled');
            }
            if ((index + 1) == this.slides.length) {
                this.nextLink.classList.add('end');
            }
            else {
                this.nextLink.classList.remove('end');
            }
            if (index > 0) {
                if (prevSlide.type == 'image') {
                    prevSlide.element.classList.remove('show');
                }
            }
            if (!slide.loaded) {
                this.element.classList.add('loading');
            }
            if (slide.type == 'image') {
                slide.load().then(function () {
                    setTimeout(function () {
                        _this.element.classList.remove('loading');
                    }, 250);
                    if (window.devicePixelRatio > 1 && slide.media.src2x !== undefined) {
                        slide.artworkEl.style.backgroundImage = "url('" + slide.media.src2x + "')";
                    }
                    else {
                        slide.artworkEl.style.backgroundImage = "url('" + slide.media.src + "')";
                    }
                    slide.element.classList.add('show');
                });
            }
            else if (slide.type === 'application') {
                var objectEl = slide.element.querySelector('object');
                objectEl.style.display = null;
                this.element.classList.remove('loading');
                slide.element.classList.add('show');
            }
            else {
                this.element.classList.remove('loading');
                slide.element.classList.add('show');
            }
            var left = window.innerWidth * slide.index;
            Carbon.MediaPlayerFactory.pauseAll();
            this.onResize();
            var contentEl = document.querySelector('#flipbook > .viewport > .content');
            $(contentEl).stop().animate({ marginLeft: -(slide.index * 100) + '%' }, { duration: this.duration,
                easing: 'easeOutQuart',
                queue: false,
                complete: function () {
                }
            });
            if (this.thumbStrip) {
                this.thumbStrip.selectThumbnail(slide.index);
            }
        };
        Gallery.prototype.next = function () {
            this.view(this.activeSlide.index + 1);
            return false;
        };
        Gallery.prototype.prev = function () {
            this.view(this.activeSlide.index - 1);
            return false;
        };
        Gallery.prototype.dispose = function () {
            while (this.listeners.length > 0) {
                this.listeners.pop().stop();
            }
        };
        return Gallery;
    }());
    CM.Gallery = Gallery;
    var Slide = (function () {
        function Slide(element, index) {
            this.loading = false;
            this.loaded = true;
            this.errorCount = 0;
            this.element = element;
            var pieceEl = this.element.querySelector('carbon-piece');
            var data = this.element.dataset;
            this.index = index;
            this.type = pieceEl.dataset['type'];
            this.artworkEl = this.element.querySelector('.artwork');
            this.number = this.index + 1;
            var dimensions = pieceEl.dataset['dimensions'].split('x');
            this.width = parseInt(dimensions[0], 10);
            this.height = parseInt(dimensions[1], 10);
            if (this.type == 'image') {
                this.media = this.artworkEl.dataset;
                this.loaded = false;
            }
            else if (this.type == 'video' || this.type == 'audio') {
                this.width = 960;
                this.height = 540;
                var containerEl = this.element.querySelector('carbon-container');
                if (containerEl && containerEl.matches('.collapsed')) {
                    this.height = 90;
                    this.fixedHeight = true;
                }
            }
            else if (this.type == 'application') {
                var objectEl = this.element.querySelector('object');
                objectEl.style.display = 'none';
            }
        }
        Slide.prototype.preload = function () {
            if (this.type !== 'image')
                return;
            this.load();
        };
        Slide.prototype.load = function () {
            var _this = this;
            if (this.loaded || this.loading) {
                return Promise.resolve(this);
            }
            this.loading = true;
            return new Promise(function (resolve, reject) {
                var img = new Image();
                img.onload = function () {
                    this.loaded = true;
                    resolve(this.media);
                };
                img.onerror = function () {
                    this.errorCount++;
                    this.isLoading = false;
                    if (this.errorCount < 2) {
                        this.load();
                    }
                };
                if (window.devicePixelRatio > 1 && _this.media.src2x !== undefined) {
                    img.src = _this.media.src2x;
                }
                else {
                    img.src = _this.media.src;
                }
            });
        };
        Slide.prototype.unload = function () {
            if (this.type == 'application') {
                this.loaded = false;
                var objectEl = this.element.querySelector('object');
                objectEl.style.display = 'none';
            }
        };
        return Slide;
    }());
    CM.Slide = Slide;
    var Thumbnails = (function () {
        function Thumbnails(element, gallery) {
            this.element = element;
            this.gallery = gallery;
            this.contentEl = this.element.querySelector('.content');
            removeWhitespace(this.contentEl);
            this.thumbnails = this.contentEl.queryAll('.thumb');
            this.thumbnails.forEach(function (el, i) {
                el.dataset['index'] = i.toString();
            });
            var innerEl = this.contentEl.querySelector('.inner');
            this.contentEl.style.width = innerEl.offsetWidth + 'px';
            this.contentWidth = this.contentEl.offsetWidth;
            this.viewportEl = this.element.querySelector('.viewport');
            this.width = this.viewportEl.clientWidth;
            $(this.contentEl).on('click', '.thumb', this.onThumbnailClicked.bind(this));
        }
        Thumbnails.prototype.onThumbnailClicked = function (e) {
            var el = e.currentTarget;
            var index = parseInt(el.dataset['index'], 10);
            this.selectThumbnail(index);
        };
        Thumbnails.prototype.selectThumbnail = function (index) {
            var thumbnail = this.thumbnails[index];
            for (var _i = 0, _a = _.queryAll('#thumbnails .selected'); _i < _a.length; _i++) {
                var el = _a[_i];
                el.classList.remove('selected');
            }
            thumbnail.classList.add('selected');
            this.moveTo(thumbnail);
            if (this.gallery.activeSlide.index !== index) {
                this.gallery.view(index);
            }
        };
        Thumbnails.prototype.moveTo = function (element) {
            var mid = width(this.element) / 2;
            var x = element.offsetLeft;
            if (x === 0) {
                $(this.viewportEl).stop().animate({ scrollLeft: x }, { duration: 200 });
                return;
            }
            var xa = x + element.clientWidth;
            if (xa <= (this.width - mid))
                return;
            if (xa + mid >= this.contentWidth) {
                x = this.contentWidth - this.width;
                $(this.viewportEl).animate({ scrollLeft: x }, { duration: 200 });
                return;
            }
            ;
            x += (element.clientWidth / 2) - (mid);
            $(this.viewportEl).stop().animate({ scrollLeft: x }, { duration: 200 });
        };
        return Thumbnails;
    }());
    CM.Thumbnails = Thumbnails;
})(CM || (CM = {}));
function getDimensions(width, height, maxWidth, maxHeight) {
    var returnWidth = 0;
    var returnHeight = 0;
    var newHeight, newWidth;
    if (height <= maxHeight && width <= maxWidth) {
        returnWidth = width;
        returnHeight = height;
    }
    else {
        var mutiplier = (maxWidth / width);
        if (height * mutiplier <= maxHeight) {
            newHeight = Math.round(height * mutiplier);
            returnWidth = maxWidth;
            returnHeight = newHeight;
        }
        else {
            mutiplier = (maxHeight / height);
            newWidth = Math.round(width * mutiplier);
            returnWidth = newWidth;
            returnHeight = maxHeight;
        }
    }
    return {
        width: returnWidth,
        height: returnHeight
    };
}
function width(el) {
    return parseInt(getComputedStyle(el).width, 10);
}
function removeWhitespace(element) {
    for (var i = 0; i < element.childNodes.length; i++) {
        var node = element.childNodes[i];
        if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) {
            element.removeChild(node);
        }
    }
}
jQuery.extend(jQuery.easing, {
    easeOutQuart: function (x, t, b, c, d) { return -c * ((t = t / d - 1) * t * t * t - 1) + b; },
    easeInOutQuart: function (x, t, b, c, d) {
        if ((t /= d / 2) < 1)
            return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    },
});
