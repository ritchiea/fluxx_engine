jQuery(function($){
  module("stage");

  asyncTest("load stage", 4, function(){
    $div = $('<div/>');
    $div.hide().appendTo($('body')).fluxxStage(function(){
      equals($my.stage.length, 1, "stage was loaded with callback");
      $div.removeFluxxStage();
    });

    $div.hide().appendTo($('body')).fluxxStage({
      callback: function(){
        equals($my.stage.length, 1, "stage was loaded with options");
        $div.removeFluxxStage();
      }
    });
    
    $('#' + $.fluxx.stage.attrs.id).live('onComplete', function(){
      equals($my.stage.get(0), this, "Stage context");
      $div.removeFluxxStage(function(){
        equals($my.stage, undefined, "no stages");
      });
    });
    $div.hide().appendTo($('body')).fluxxStage();
    
    setTimeout(function(){start()},250)
  });
});
