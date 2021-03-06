$(function() {
  // zepto fallback for click handler instead of tap
  // see https://github.com/madrobby/zepto/issues/409 
  if (!('ontouchend' in window)) {
      $(document).delegate('body', 'click', function(e) {
          $(e.target).trigger('tap');
      });
  }
  // fix swiptleft and right issue: Prevent default scrolling on document window
  // https://github.com/madrobby/zepto/issues/315
  MBP.preventScrolling();
  // Prevent iOS from zooming onfocus
  MBP.preventZoom();
  // Hide URL Bar
  MBP.hideUrlBarOnLoad();
  
  _.mixin({
    sentence: function (arr, sep, connector) {
      var result = '';
      
      sep = sep || ', ';
      connector = connector || ' und ';

      switch (arr.length) {
        case 0:
          result = '';
          break;
        case 1:
          result = _.first(arr);
          break;
        case 2:
          result = _.first(arr) + connector + _.last(arr);
          break;
        default:
          result = arr.slice(0, -1).join(sep) + connector + _.last(arr);
          break;
      }
      return result;
    },
    formatDate: function (dat) {
        var dates = dat.split("-");
        return dates[2] + "." + dates[1] + "." + dates[0];
    },   
    supports_local_storage: function  () {
      try {
        return 'localStorage' in window && window['localStorage'] !== null;
      } catch(e){
        return false;
      }
    }
  });
  

  //
  // -------------------------------------------------------------------------
  Quote = Backbone.Model.extend({
    idAttribute: 'number',
    
    urlRoot : '/api/v1/quote',
    
    defaults: {
        "current":  false
    },

    play: function () {
      this.trigger('play');
    },
    
    hint: function () {
      this.trigger('hint');
    },
    
    evaluate: function (postedSolution, resView) {
      var that = this,
          evalUrl = this.urlRoot+'/'+this.get('number')+'/evaluate';      
      

      $.ajax({
        type: 'POST',
        url: evalUrl,
        dataType: 'json',
        data: {psolution: postedSolution},
        success: function(data, textStatus, jqXHR){
          var resData = data[0];
          
          that.setEvaluated();
          
          // implicit fetch of model: update local fields that might changed          
          that.set({commits: resData.quote.commits, solutions: resData.quote.solutions},
                   {silent: true});
          
          resView.evaluated(resData);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          alert('Error in evaluation, please try again later');
        }
      });
    },
    
    setEvaluated: function(){
      if(_.supports_local_storage()){
        localStorage.setItem(this.get("number"), 'true');
      }
      this.trigger('evaluated');
    },

    wasEvaluated: function(){
      return _.supports_local_storage()
        ? localStorage.getItem(this.get("number")) === 'true'
        : false;
    }
  });
  //
  // -------------------------------------------------------------------------  
  QuoteList = Backbone.Collection.extend({
    model: Quote,
    
    initialize: function () {
      this.idx = 0; //current quote
    },
    
    home: function (stop) {
      this.select(this.at(this.length-1));
      this.current().trigger('chosen');
      if (stop) {
        this.current().trigger('hide');
        this.current().trigger('stop');
      }
      return this.current();
    },
    
    random: function (stop) {
      var ri = 0,
          quote = {},
          evaluated = {};
      if (this.length <= 0) {
        return null;
      }
    
      evaluated = this.filter(function(qq) { return !qq.wasEvaluated(); });
      if (evaluated.length <= 0) {
        ri = Math.floor(Math.random() * this.length);
      } else {
        // random only for quotes that have not been evaluated, yet
        ri = Math.floor(Math.random() * evaluated.length);
        quote = evaluated[ri];
        ri = this.indexOf(quote);
      }
      
      this.idx = ri;
      this.current().trigger('chosen');
      if (stop) {
        this.current().trigger('hide');
        this.current().trigger('stop');
      }
      return this.current();      
    },
    
    next: function (stop) {
      if (!this.hasNext()) {
        return null;
      }
      this.idx += 1;
      this.current().trigger('chosen');
      if (stop) {
        this.current().trigger('hide');
        this.current().trigger('stop');
      }
      return this.current();
    },
    
    prev: function (stop) {
      if (!this.hasPrev()) {
        return null;
      }
      this.idx -= 1;
      this.current().trigger('chosen');
      if (stop) {
        this.current().trigger('hide');
        this.current().trigger('stop');
      }
      return this.current();
    },
    
    hasNext: function () {
      return this.idx < this.length-1;    
    },
    
    hasPrev: function () {
      return this.idx > 0;
    },
    
    current: function () {
      return this.at(this.idx);
    },
    
    select : function (quoteNr) {
      var quote = this.get(quoteNr);

      this.idx = this.indexOf(quote);
      this.invoke('set', {current: false}, {silent: true});

      this.current().trigger('hide');
      this.current().trigger('stop');
      quote.set({current: true}, {silent: false});

      return this;
    }
  });
  //
  // -------------------------------------------------------------------------  
  QuoteView = Backbone.View.extend({
    el: $('#mq-area-main'),
    
    wrong: _.template($('#mq-tmpl-wrong').html()),
    
    correct: _.template($('#mq-tmpl-correct').html()),
    
    initialize: function () {
      var that = this;
      this.model.on('change:current', this.render, this);
      this.model.on('chosen', this.render, this);
      this.model.on('play', this.play, this);
      this.model.on('stop', this.stop, this);
      this.model.on('hint', this.hint, this);
      this.model.on('hide', this.hide, this);
      this.model.on('evaluate', this.evaluate, this);
    },
    
    evaluate: function () {
      var req = $(this.el).find('.mq-input').val();
      this.model.evaluate(req, this);
    },
    
    evaluated: function (data) {
      if (data.res) {
        this.renderCorrect(data);
      } else {
        this.renderWrong(data);
      }
    },
    
    play: function () {
      var baseURL = 'http://mquzz-audio.s3.amazonaws.com/',
          audiourl = this.model.get('audiourl');
      
      if (QuoteView.player.isPlaying()) {
        QuoteView.player.stop();
      } else {
        QuoteView.player.play(baseURL+audiourl);
      }
    },
    
    stop: function () {
      if (QuoteView.player.isPlaying()) {
        QuoteView.player.stop();
      }
    },
    
    show: function (duration) {
      if (duration) {
        $('#mq-area-hint-v>div').animate({width: '100%'}, duration);
      } else {
        $('#mq-area-hint-v>div').width('0px');
      }
    },
    
    hide: function (duration) {
      if (duration) {
        $('#mq-area-hint-v>div').animate({width: '0px'}, duration);
      } else {
        $('#mq-area-hint-v>div').width('0px');
      }
    },
    
    hint: function () {
      if (QuoteView.elHint.width() <= 30){
        this.show(1000);
      } else {
        this.hide(1000);
      }
    },
    
    calcRate: function(solutions, commits) {
      return commits === 0
              ? 0
              : (solutions / commits * 100).toFixed(2);
    },
    
    renderGeneral: function () {
      QuoteView.elInfo.html('#' + this.model.get('number'));
      QuoteView.elDate.html('datum: ' + _.formatDate(this.model.get('qdate')));
      QuoteView.elPerc.html('quote: '+ this.calcRate(this.model.get('solutions'), this.model.get('commits')) +' %');
      if ($(document).width() > 500) {
        QuoteView.elHint.html(this.model.get('hintl'));
      } else {
        QuoteView.elHint.html(this.model.get('hints'));
      }  
    },
    
    renderCorrect: function (data) {
      this.renderGeneral();
      QuoteView.elRequest.hide();
      QuoteView.elResult.show();
      
      QuoteView.elResult.empty();
      QuoteView.elResult.append( this.correct({ titles: data.quote.titles,
                                                commits: data.quote.commits,
                                                solutions: data.quote.solutions,
                                                buy: data.quote.buy,
                                                info: data.quote.info,
                                                trailer: data.quote.trailer,
                                                posted: data.posted,
                                                rate: this.calcRate(data.quote.solutions, data.quote.commits)}) );
    },
    
    renderWrong: function (data) {
      this.renderGeneral();
      QuoteView.elRequest.hide();
      QuoteView.elResult.show();
      
      QuoteView.elResult.empty();
      QuoteView.elResult.append( this.wrong({ titles: data.quote.titles,
                                              commits: data.quote.commits,
                                              solutions: data.quote.solutions,
                                              buy: data.quote.buy,
                                              info: data.quote.info,
                                              trailer: data.quote.trailer,
                                              posted: data.posted,
                                              rate: this.calcRate(data.quote.solutions, data.quote.commits)}) );
    },
    
    render: function () {
      this.renderGeneral();
      QuoteView.elRequest.show();
      QuoteView.elResult.hide();
    }
  }, {
    elInfo: $('#mq-area-header-nr'),
    elDate: $('#mq-area-topper-date'),
    elPerc: $('#mq-area-topper-perc'),
    elHint: $('#mq-area-hint-data'),
    elResult: $('#mq-area-result'),
    elRequest: $('#mq-area-request'),
    player: mquzz($('#mq-player')) //access: QuoteView.player
  });
  //
  // -------------------------------------------------------------------------    
  QuoteListView = Backbone.View.extend({
    el: $('#mq-area-overview ol'),
    elHelp: $('#mq-area-header-help'),
    elNext: $('#mq-area-footer-right'),
    elHome: $('#mq-area-footer-center'),
    elPrev: $('#mq-area-footer-left'),
    elInput: $('#mq-area-input-field .mq-input'),
    
    template: _.template($('#mq-tmpl-quotes').html()),
    
    events: {
      'click li': 'onClick'
    },
    
    initialize: function () {
      var that = this;
      
      this.views = [];
      this.collection.on('reset', this.reset, this);
      this.collection.on('evaluated', this.render, this);
      this.collection.on('change:current', this.render, this);
      
      $('#mq-area-main').swipeRight(function(){
        that.elInput.val('');
        that.collection.prev(true);        
      });
      $('#mq-area-main').swipeLeft(function(){
        that.elInput.val('');
        that.collection.next(true);        
      });
      
      this.elNext.tap(function(){
        that.elInput.val('');
        that.collection.next(true);
      });
      this.elHome.tap(function(){
        that.elInput.val('');
        that.collection.random(true);
      });
      this.elPrev.tap(function(){
        that.elInput.val('');
        that.collection.prev(true);
      });
      $('#mq-player').tap(function(){
        that.collection.current().play();
      });
      $('#mq-area-hint-data').tap(function(){
        that.collection.current().hint();
      });
      $('#mq-area-input-btn .mq-button').tap(function(){
        that.collection.current().trigger('stop');
        that.collection.current().trigger('evaluate');
      });
       
      //ugly -> create own view
      this.elInput.keypress(function (evt) {
        if(evt.which !== 13) {
          return;
        }
        evt.preventDefault();
        that.collection.current().trigger('stop');
        that.collection.current().trigger('evaluate');
      });
      // handle window resize to change used hint length
      $(window).resize(function() {
        that.collection.select(that.collection.current().get('number'));
      });      
    },
    
    reset: function () {
      this.collection.each(function (quote){
        this.views.push(new QuoteView({model: quote}));
      }, this);
    },

    onClick: function (evt) {
      var ct = $(evt.currentTarget),
          id = ct.attr('data-mq-number');
      this.elInput.val('');
      this.collection.select(id);
      
      this.render();
    },
    
    render: function () {
      $(this.el).empty();
      $(this.el).append( this.template({quotes: this.collection}) );
    }
  });
  //
  // -------------------------------------------------------------------------    
  HelpView = Backbone.View.extend({
    el: $('#mq-area-help'),
    
    initialize: function () {
      var that = this;
      this.$el.hide();
      this.$el.tap(function(){ that.$el.hide(); });
      HelpView.buttonEl.tap(function(){ that.$el.show(); });
    },
    
    render: function () {
      this.$el.show();
    }
  }, {
    buttonEl: $('#mq-area-header-help')
  });  
});
