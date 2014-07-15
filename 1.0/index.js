/**
 * @fileoverview
 * @author 宝码<nongyoubao@alibaba-inc.com>
 * @module wScratchPad
 **/
KISSY.add(function(S, Node, Base) {
    'use strict';
    var EMPTY = '';
    var $ = Node.all;
    /**
     *
     * @class WScratchPad
     * @constructor
     * @extends Base
     */
    function WScratchPad(comConfig) {
        var self = this;

        if (comConfig.srcNode == EMPTY) {
            alert('渲染节点不能为空');
            return true;
        };
        //调用父类构造函数
        WScratchPad.superclass.constructor.call(self, comConfig);
    }
    S.extend(WScratchPad, Base, /** @lends WScratchPad.prototype*/ {
        initializer: function() {
            var self = this;
            self.options = self.getAttrVals();

            self.$el = self.get('srcNode');
            if (self._supportCanvas()) {
                self.$el.html('Canvas is not supported in this browser.')
                return true;
            };

            self.enabled = true;
            self.canvas = document.createElement('canvas');
            self.ctx = self.canvas.getContext('2d');

            if (self.$el.css('position') === 'static') {
                self.$el.css('position', 'relative');
            }

            self.$img = $('<img src=""/>').attr('crossOrigin', EMPTY).css({
                position: 'absolute',
                width: '100%',
                height: '100%'
            });

            self.$scratchpad = $(self.canvas).css({
                position: 'absolute',
                width: '100%',
                height: '100%'
            });

            self.bindMobileEvents();

            self.bindPcEvents();

            self.$el.append(self.$img).append(self.$scratchpad);

            self.render();
            self._addEvent();
        },
        _addEvent: function() {
            var self = this;
            self.on('destroy', function() {
                self.$el.children().remove();
            })

            self.on('afterBgChange', function(event) {
                console.log(1)
                self.options = self.getAttrVals();
                console.log(self.options)
                self.render();
            })
            self.on('afterFgChange', function(event) {
                self.options = self.getAttrVals();
                self.render();
            })
            self.on('afterRealtimeChange', function(event) {
                self.options = self.getAttrVals();
            })
            self.on('afterSizeChange', function(event) {
                self.options = self.getAttrVals();
            })
            self.on('afterCursorChange', function(event) {
                self.options = self.getAttrVals();
                self._setCursor();
            })
        },
        render: function() {
            var self = this,
                width = Math.ceil(self.$el.innerWidth()),
                height = Math.ceil(self.$el.innerHeight()),
                devicePixelRatio = window.devicePixelRatio || 1;

            // Set number of pixels required for getting scratch percentage.
            self.pixels = width * height;

            // We'll do a hard render for the height here in case
            // we need to run this at differnt sizes.
            self.$scratchpad.attr('width', width).attr('height', height);

            self.canvas.setAttribute('width', width * devicePixelRatio);
            self.canvas.setAttribute('height', height * devicePixelRatio);
            self.ctx.scale(devicePixelRatio, devicePixelRatio);

            self.pixels = width * devicePixelRatio * height * devicePixelRatio;

            // Default to image hidden in case no bg or color is set.
            self.$img.hide();

            if (self.options.bg) {
                if (self.options.bg.charAt(0) === '#') {
                    self.$el.css('backgroundColor', self.options.bg);
                } else {
                    self.$el.css('backgroundColor', EMPTY);
                    self.$img.attr('src', self.options.bg);
                }
            }

            // Set fg.
            if (self.options.fg) {
                if (self.options.fg.charAt(0) === '#') {
                    self.ctx.fillStyle = self.options.fg;
                    self.ctx.beginPath();
                    self.ctx.rect(0, 0, width, height);
                    self.ctx.fill();
                    self.$img.show();
                } else {
                    // Have to load image before we can use it.
                    var canvasImage = new Image();
                    canvasImage.src = self.options.fg;
                    canvasImage.onload = function() {
                        self.ctx.drawImage(this, 0, 0, width, height);
                        self.$img.show();
                    };
                }
            }

            if (self.options.cursor && self.options.cursor !== 'crosshair') {
                self._setCursor();
            };
        },
        clear: function() {
            var self = this;
            self.ctx.clearRect(0, 0, Math.ceil(self.$el.innerWidth()), Math.ceil(self.$el.innerHeight()));
        },
        enable: function(enabled) {
            this.enabled = enabled === true ? true : false;
        },
        bindMobileEvents: function() {
            var self = this;
            self.$scratchpad.on('touchstart touchmove touchend touchcancel', function(event) {
                var touches = (event.changedTouches || event.originalEvent.targetTouches),
                    first = touches[0],
                    type = EMPTY;
                switch (event.type) {
                    case 'touchstart':
                        type = 'mousedown';
                        break;
                    case 'touchmove':
                        type = 'mousemove';
                        event.preventDefault();
                        break;
                    case 'touchend':
                        type = 'mouseup';
                        break;
                    default:
                        return;
                }

                var simulatedEvent = document.createEvent('MouseEvent');

                simulatedEvent.initMouseEvent(
                    type, true, true, window, 1,
                    first.screenX, first.screenY, first.clientX, first.clientY,
                    false, false, false, false, 0 /*left*/ , null
                );

                first.target.dispatchEvent(simulatedEvent);
            })
        },
        bindPcEvents: function() {
            var self = this;
            self.$scratchpad.on('mousedown', function(event) {
                if (!self.enabled) {
                    return true;
                };
                self.canvasOffset = self.$scratchpad.offset();
                self.scratch = true;
                self._scratchFunc(event, 'Down');
            }).on('mousemove', function(event) {
                if (self.scratch) {
                    self._scratchFunc(event, 'Move');
                };
            }).on('mouseup', function(event) {
                if (self.scratch) {
                    self.scratch = false;
                    self._scratchFunc(event, 'Up');
                }
            })
        },
        _setCursor: function() {
            var self = this;
            self.$el.css('cursor', self.options.cursor);
        },
        _scratchFunc: function(event, type) {
            var self = this;
            event.pageX = event.offsetX || Math.floor(event.pageX - self.canvasOffset.left);
            event.pageY = event.offsetY || Math.floor(event.pageY - self.canvasOffset.top);

            self['_scratch' + type](event);
        },
        _scratchDown: function(e) {
            var self = this;
            self.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineJoin = 'round';
            self.ctx.lineCap = 'round';
            self.ctx.strokeStyle = this.options.color;
            self.ctx.lineWidth = this.options.size;

            //draw single dot in case of a click without a move
            self.ctx.beginPath();
            self.ctx.arc(e.pageX, e.pageY, this.options.size / 2, 0, Math.PI * 2, true);
            self.ctx.closePath();
            self.ctx.fill();

            //start the path for a drag
            self.ctx.beginPath();
            self.ctx.moveTo(e.pageX, e.pageY);

            self.fire('down');
        },
        _scratchMove: function(e) {
            var self = this;
            self.ctx.lineTo(e.pageX, e.pageY);
            self.ctx.stroke();
            if (self.options.realtime) {
                self._scratchPercent();
            };
            self.fire('move');
        },
        _scratchUp: function(e) {
            var self = this;
            self.ctx.closePath();
            self._scratchPercent();
            self.fire('up');
        },
        _scratchPercent: function() {
            var self = this;
            var hits = 0,
                imageData = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height);
            for (var i = 0, ii = imageData.data.length; i < ii; i = i + 4) {
                if (imageData.data[i] === 0 && imageData.data[i + 1] === 0 && imageData.data[i + 2] === 0 && imageData.data[i + 3] === 0) {
                    hits++;
                }
            }

            self.set('eraser', (hits / this.pixels) * 100);
        },
        _supportCanvas: function() {
            return !(document.createElement('canvas')).getContext
        }
    }, {
        ATTRS: /** @lends WScratchPad*/ {
            srcNode: {
                value: EMPTY,
                getter: function(v) {
                    return $(v)
                }
            },
            eraser: {
                value: 0
            },
            realtime: {
                value: false
            },
            size: {
                value: 5
            },
            bg: {
                value: '#cacaca'
            },
            fg: {
                value: '#6699ff'
            },
            cursor: {
                value: 'crosshair'
            }
        }
    });
    return WScratchPad;
}, {
    requires: ['node', 'base', 'event']
});
