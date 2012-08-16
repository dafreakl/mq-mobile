$(function () {
        
    mquzz = function (el, opt) {
        var $canvas = $(el),
            canvas = $canvas[0],
            ctx = canvas.getContext('2d'),
            cw = ch = 0,
            sound = null,
            soundBuffer = {},
            zeroClock = Math.PI*1.5,
            startAngle = zeroClock,
            endAngle = zeroClock,
            state = 0,
            progress = 0,
            curl = '',
            loadloop = null,
            loadcnt = 0,
            STATES = { LOADING: 0, PLAYING: 1, STOPPED: 2, NA: 4 };
        
        var options = {},
            defaults = {
                width: 155,
                height: 155,
                iconWidth: 25,
                iconHeight: 25, //divided by 5 for pause
                bgcolor: '#0e1013',
                circleFill: '#13161a',
                circleBorder: '#0a0a0b',
                progressFill: '#29a0cb',
                progressBorder: '#0a0a0b',
                loadingFill: '#cccccc',
                loadingBorder: '#0a0a0b',
                iconFill: '#ffffff'
            };
        
        // initialize        
        // build default values
        state = STATES.NA;
        opt = opt || {};
        _.each(_.keys(defaults), function (key) {
            if (_.isUndefined(opt[key])){
                options[key] = defaults[key];
            } else {
                options[key] = opt[key];
            }
        });

        // initialize UI
        cw = canvas.width = options.width;
        ch = canvas.height = options.height;
        
        // private section
        var filledCircle = function (x, y, r, fs, angleStart, angleEnd, withStroke) {
            var sa = angleStart || 0,
                ea = angleEnd || Math.PI*2,
                anticlockwise = true;
            ctx.beginPath();
            ctx.fillStyle = fs;
            ctx.arc(x, y, r, sa, ea, anticlockwise);
            ctx.lineTo(x, y);
            ctx.closePath();            
            ctx.fill();
            if (withStroke) {
                ctx.strokeStyle = options.progressBorder;
                ctx.stroke();
            }
        };
        
        var drawClear = function() {
            ctx.save();
            ctx.fillStyle = options.bgcolor;
            ctx.fillRect(0, 0, cw, ch);
            ctx.restore();
        };
        
        var drawCircleBg = function() {
            var x = cw/2-0.5,
                y = ch/2-0.5,
                radius = (Math.min(x,y)) - 2;
            ctx.save();
            filledCircle(x, y, radius, options.circleBorder);
            filledCircle(x, y, radius-1, options.circleFill);
            ctx.restore();
        };

        var drawStop = function() {        
            var x = cw/2-options.iconWidth-0.5,
                y = ch/2-options.iconHeight-0.5,
                width = options.iconWidth*2,
                height = options.iconHeight*2,
                r = 9.5;
            ctx.save();
            
            ctx.fillStyle = options.iconFill;
            ctx.beginPath();
            ctx.moveTo(x, y+r);
            
            ctx.lineTo(x, y+height-r);
            ctx.quadraticCurveTo(x, y+height, x+r, y+height);// controllpoint-x, controllpoint-y, x, y
            
            ctx.lineTo(x+width-r, y+height);
            ctx.quadraticCurveTo(x+width, y+height, x+width, y+height-r);
            
            ctx.lineTo(x+width, y+r);
            ctx.quadraticCurveTo(x+width, y, x+width-r, y);
            
            ctx.lineTo(x+r, y);
            ctx.quadraticCurveTo(x, y, x, y+r);
            
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        
        var drawPlay = function() {
            var x = cw/2+5-0.5,
                y = ch/2-0.5;
            ctx.save();
            
            ctx.beginPath();
            ctx.fillStyle = options.iconFill;
            ctx.moveTo(x+options.iconWidth, y);        
            ctx.lineTo(x-options.iconWidth, y-options.iconHeight);
            ctx.lineTo(x+3-options.iconWidth, y);
            ctx.lineTo(x-options.iconWidth, y+options.iconHeight);
            ctx.lineTo(x+options.iconWidth, y);
            ctx.closePath();
            
            ctx.fill();
            ctx.restore();
        };

        var drawProgress = function() {
            var x = cw/2-0.5,
                y = ch/2-0.5,
                start = startAngle, //Math.PI*1.5+Math.PI*0.75,
                end = Math.PI*1.5,
                radius = (Math.min(x,y)) - 2,
                withStroke = !!(progress > 0 && progress < 100);
            ctx.save();
            filledCircle(x, y, radius, options.progressBorder, start, end, withStroke);
            filledCircle(x, y, radius-1, options.progressFill, start, end, withStroke);
            ctx.restore();
        };
        
        var drawLoading = function() {
            // TODO: make it more fancy and sizeable
            loadcnt = loadcnt + 1;
            ctx.save();
            ctx.fillStyle = 'white';
            switch (loadcnt) {
               case 1:
                    ctx.fillRect(cw/2-10, ch/2-10, 20, 20);
                    break;
               case 2:
                  ctx.fillRect(cw/2-15, ch/2-15, 30, 30);
                  break;
               case 3:
                  ctx.fillRect(cw/2-20, ch/2-20, 40, 40);
                  break;
               case 4:
                  ctx.fillRect(cw/2-25, ch/2-25, 50, 50);
                  break;
               case 5:
                  ctx.fillRect(cw/2-20, ch/2-20, 40, 40);
                  break;
               case 6:
                  ctx.fillRect(cw/2-15, ch/2-15, 30, 30);
                  break;
            }
            ctx.restore();
            if (loadcnt === 6) {loadcnt = 0;}
        };
        
        var drawNumber = function () {
            ctx.save();
            ctx.font = 'normal 120px sans-serif';
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillText('13', cw/2-70, ch/2+40);
            ctx.restore();
        };
        
        var update = function () {
            drawClear();
            drawCircleBg();
            drawProgress();            
            if (state === STATES.LOADING) {
                drawLoading();
            } else if  (state === STATES.PLAYING) {
                drawStop();
            } else {
                drawPlay();
            }
        };
        
        var end = function () {
            state = STATES.STOPPED;
            progress = 0;
            startAngle = zeroClock;
            update();
        };
        
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        update();
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        
        return {
            load: function (url) {
                curl = url;
                state = STATES.LOADING;
                
                if (!buzz.isMP3Supported()) {
                    sound = new buzz.sound(curl, { formats: [ "ogg" ], preload: true });
                } else {
                    sound = new buzz.sound(curl, { formats: [ "mp3" ], preload: true });
                }
                
                soundBuffer[curl] = sound;

                sound.bind('timeupdate', function(e){                    
                    state = STATES.PLAYING;
                    progress = this.getPercent();
                    update();
                    startAngle = (Math.PI * 1.5) + (Math.PI * 2 * progress / 100);                    
                }).bind('ended', function(e){
                    end();
                }).bind('pause', function(e){
                    end();
                }).bind('loadstart', function(e){
                    loadloop = setInterval(update, 100);
                }).bind('canplaythrough', function(e){
                    clearInterval(loadloop);
                    state = STATES.PLAYING;
                    progress = 0;
                    sound.play();
                });                
            },
            
            isPlaying: function () {
                return state === STATES.PLAYING;
            },
            
            stop: function () {
                // it is important to use sound.pause() instead of sound.stop()
                // as sound.stop() will seek timer to the end of the sound file an trigger
                // a timeupdate event with 100% so a full circle would be drawn
                sound.pause();
            },
            
            play: function (url) {
                if (!_.isUndefined(soundBuffer[url])){
                    sound = soundBuffer[url];
                    // if the same sound file is restarted its still paused at the last
                    // stop seek and thus it needs to me set to the beginning
                    sound.setTime(0);
                    sound.play();                    
                } else {
                    this.load(url);
                }
            }
        };
    };
});