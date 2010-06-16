jQuery(function($){
  module("core");

  test("$my", 1, function(){
    ok($.isPlainObject($my), "jQuery Selector Cache Initialized")
  });
  
  test("$.fluxx.util.options_with_callback", function(){
    var empty = $.fluxx.util.options_with_callback();
    ok($.isPlainObject(empty), "recieved an object");
    same(empty.callback, $.noop, "callback is a noop");
    equals(_.keys(empty).length, 1, "just one key");
    
    var cb     = function(){$.noop()};
    var cbOnly = $.fluxx.util.options_with_callback({},{},cb);
    ok($.isPlainObject(cbOnly), "recieved an object");
    same(cbOnly.callback, cb, "callback is cb()");
    equals(_.keys(cbOnly).length, 1, "just one key");
    
    var cbOpts = $.fluxx.util.options_with_callback({},{callback: cb});
    ok($.isPlainObject(cbOpts), "recieved an object");
    same(cbOpts.callback, cb, "callback is cb()");
    equals(_.keys(cbOpts).length, 1, "just one key");
    
    var allOut = $.fluxx.util.options_with_callback(
      {title: 'Foo', url: '/'},
      {title: 'Bar', other: 'Thing'},
      function(){return 'Called back.'}
    );
    equals(allOut.callback(), 'Called back.', 'Callback retained.');
    equals(allOut.title, 'Bar', 'Changed with options');
    equals(allOut.url, '/', 'Stayed the same');
    equals(allOut.other, 'Thing', 'Added options remained');
  });
});
