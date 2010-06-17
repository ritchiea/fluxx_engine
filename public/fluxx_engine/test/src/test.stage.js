jQuery(function($){
  module("stage");

  asyncTest("load stage", 5, function(){
    $div = $('<div/>');
    $div.hide().appendTo($.my.body).fluxxStage(function(){
      equals($.my.stage.length, 1, "stage was loaded with callback");
      $div.removeFluxxStage();
    });

    $div.hide().appendTo($.my.body).fluxxStage({
      callback: function(){
        equals($.my.stage.length, 1, "stage was loaded with options");
        $div.removeFluxxStage();
      }
    });
    
    $('#' + $.fluxx.stage.attrs.id).live('complete', function(){
      equals($.my.stage.get(0), this, "Stage context");
      $div.removeFluxxStage(function(){
        equals($.my.stage, undefined, "no stages");
        equals($('#' + $.fluxx.stage.attrs.id).length, 0, 'No stage in DOM');
      });
    });
    $div.hide().appendTo($.my.body).fluxxStage();
    $('#' + $.fluxx.stage.attrs.id).die('complete');
    
    setTimeout(function(){start()},250)
  });
});
