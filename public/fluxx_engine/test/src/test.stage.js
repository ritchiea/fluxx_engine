jQuery(function($){
  module("stage");

  asyncTest("load stage", 2, function(){
    $('<div/>').hide().appendTo($('body')).fluxxStage(function(){
      equals($my.stage.length, 1, "stage was loaded with callback");
    }).remove();
    $('<div/>').hide().appendTo($('body')).fluxxStage({
      onComplete: function(){
        equals($my.stage.length, 1, "stage was loaded with options");
      }
    }).remove();
    
    setTimeout(function(){start()},1000)
  });
});
