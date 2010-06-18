jQuery(function($){
  module("card");

  asyncTest("addFluxxCard", 1, function(){
    $('<div>').appendTo($.my.body).hide().fluxxStage(function(){
      $.my.hand.addFluxxCard();
      equals($('.card').length, 1, "there's a card");
      setTimeout(function(){start(); $.my.stage.removeFluxxStage()},100);
    });
  });
});
