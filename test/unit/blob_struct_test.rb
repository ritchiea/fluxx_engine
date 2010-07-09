require 'test_helper'

class BlobStructTest < ActiveSupport::TestCase
  def setup
    @blob = BlobStruct.new
  end
  
  test "test adding a new attribute to blob" do
    @blob.name = 'eric'
    assert_equal 'eric', @blob.name
    assert @blob.store
    assert_equal 'eric', @blob.store['name']
  end
  
  test "test adding nothing to blob returns nil" do
    @blob.name = 
    assert_equal nil, @blob.name
  end
  

  test "test adding a new block to blob" do
    @blob.some_block = lambda{ p 'hi there' }
    
    assert @blob.some_block
    assert @blob.some_block.is_a? Proc
  end
end