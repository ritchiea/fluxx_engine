jQuery(function($){
  module("stage");

  asyncTest("load stage", 2, function(){
    $div = $('<div/>');
    $div.hide().appendTo($('body')).fluxxStage(function(){
      equals($my.stage.length, 1, "stage was loaded with callback");
      $div.remove();
    });
    $div.hide().appendTo($('body')).fluxxStage({
      callback: function(){
        equals($my.stage.length, 1, "stage was loaded with options");
        $div.remove();
      }
    });
    
    setTimeout(function(){start()},250)
  });
});
