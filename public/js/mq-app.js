$(function() {
/*
  var rand = -1,
      mp = mquzz($('#mq-player')),
      hintEl = $('#mq-area-hint-data'),
      haHint = new Hammer(hintEl[0]),
      haPlayer = new Hammer($('#mq-player')[0]);
      
  haPlayer.ontap = function(ev) {
    var mp3s = ['mquzz_021', 'mquzz_022', 'mquzz_023', 'mquzz_025', 'mquzz_026'],
        url = 'http://mquzz-audio.s3.amazonaws.com/';
    rand = rand + 1;
    
    if (mp.isPlaying()) {
      mp.stop();
    } else {
      //mp.load(url+mp3s[rand]);
      mp.play(url+mp3s[rand]);
      //mp.play('http://mquzz-audio.s3.amazonaws.com/bigfile');
      //mp.play('http://mquzz-audio.s3.amazonaws.com/mquzz_025');
    }
    if (rand === 4){ rand = -1; }        
    //21...26
  };

  haHint.ontap = function(ev) {
    if (hintEl.width() === 0){
      $( "#mq-area-hint-v>div" ).animate({ width: '100%' }, 1000);
    } else {
      $( "#mq-area-hint-v>div" ).animate({ width: '0px' }, 1000);
    }
  };
  */
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function supports_local_storage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e){
      return false;
    }
  }
  
  //
  // -------------------------------------------------------------------------
  Quote = Backbone.Model.extend({
    idAttribute: 'number',
    
    urlRoot : '/api/v1/quote',
    
    defaults: {
        "current":  false
    },

    setEvaluated: function(){
      if(supports_local_storage()){
        localStorage.setItem(this.get("number"), 'true');
        this.trigger('evaluated');
      }
    },

    wasEvaluated: function(){
      return supports_local_storage()
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
    
    home: function () {
      this.select(this.at(this.length-1));
      this.current().trigger('chosen');
      return this.current();
    },
    
    next: function () {
      if (!this.hasNext()) {
        return null;
      }
      this.idx += 1;
      this.current().trigger('chosen');
      return this.current();
    },
    
    prev: function () {
      if (!this.hasPrev()) {
        return null;
      }
      this.idx -= 1;
      this.current().trigger('chosen');
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
      quote.set({current: true}, {silent: false});

      return this;
    }
  });  
  //
  // -------------------------------------------------------------------------  
  QuoteView = Backbone.View.extend({
    
    initialize: function () {
      this.model.on('change:current', this.render, this);
      this.model.on('chosen', this.render, this);
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
    
    render: function () {
      QuoteView.elInfo.html('mquzz #' + this.model.get('number'));
      QuoteView.elDate.html('datum: ' + this.model.get('qdate')); //qdate
      QuoteView.elPerc.html('quote: 22 %');
    }
  }, {
    
    elInfo: $('#mq-area-header-info'),
    
    elDate: $('#mq-area-topper-date'),
  
    elPerc: $('#mq-area-topper-perc'),
    
    player: mquzz($('#mq-player')) //access: QuoteView.player
  });
  //
  // -------------------------------------------------------------------------    
  QuoteListView = Backbone.View.extend({
    el: $('#mq-area-overview ol'),
    
    elNext: $('#mq-area-footer-right'),
    elHome: $('#mq-area-footer-center'),
    elPrev: $('#mq-area-footer-left'),
    
    template: _.template($('#mq-tmpl-quotes').html()),
    
    events: {
      'click li': 'onClick'
    },
    
    initialize: function () {
      var that = this;
      this.views = [];
      this.collection.on('reset', this.reset, this);
      
      this.elNext.click(function (evt) { that.collection.next(); });
      this.elHome.click(function (evt) { that.collection.home(); });
      this.elPrev.click(function (evt) { that.collection.prev(); });
    },
    
    reset: function () {
      this.collection.each(function (quote){
        this.views.push(new QuoteView({model: quote}));
      }, this);
    },

    onClick: function (evt) {
      var ct = $(evt.currentTarget),
          id = ct.attr('data-mq-number');
      this.collection.select(id);
    },
    
    render: function () {
      $(this.el).empty();
      $(this.el).append( this.template({quotes: this.collection}) );
    }
  });
  
});
