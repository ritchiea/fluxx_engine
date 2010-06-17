jQuery(function($){
  module("card");

  test("addFluxxCard", 1, function(){
    $('<div>').appendTo($.my.body).hide().fluxxStage(function(){
      $.my.hand.addFluxxCard();
      equals($('.card').length, 1, "there's a card");
      $.my.stage.removeFluxxStage();
    });
  });
});
