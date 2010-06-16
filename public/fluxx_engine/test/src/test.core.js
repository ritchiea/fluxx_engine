jQuery(function($){
  module("core");

  test("$my", 1, function(){
    ok($.isPlainObject($my), "jQuery Selector Cache Initialized")
  });
});
