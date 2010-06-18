require 'test_helper'

class FluxxEngineTest < ActiveSupport::TestCase
  test "truth" do
    assert_kind_of Module, FluxxEngine
    m = Musician.make
    p "ESH: have a musician of: #{m.inspect}"
  end
end
