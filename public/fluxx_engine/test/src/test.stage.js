module("stage");

test("load stage", function(){
  var div = $('<div/>').hide();
  div.appendTo($('body')).fluxxStage();
  is($('#stage').length, 1, "stage loaded");
});
