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
  QuoteView = Backbone.View.extend({
    
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
      
    }
  }, {
    // class attribtues
    player: mquzz($('#mq-player')) //access: QuoteView.player
  });
  //
  // -------------------------------------------------------------------------  
  QuoteList = Backbone.Collection.extend({
    model: Quote,
    
    select : function (quote) {
      var newNumber = _.isObject(quote) ? quote.get('number') : quote;
    }
  });
  
  QuoteListView = Backbone.View.extend({
    el: $('#mq-area-overview ol')
  });
  
});
