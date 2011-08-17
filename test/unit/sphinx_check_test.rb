require 'test_helper'

class SphinxCheckTest < ActiveSupport::TestCase
  def setup
    @sphinx_check = SphinxCheck.make
  end
  
  test "truth" do
    assert true
  end
end