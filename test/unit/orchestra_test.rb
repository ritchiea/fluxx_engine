require 'test_helper'

class OrchestraTest < ActiveSupport::TestCase
  def setup
    @orchestra = Orchestra.make
  end
  
  test "test orchestra search" do
    list = Orchestra.model_search '', {:created_at => '11234'}
  end
  
  test "test locking with sphinx" do
    user = Musician.make
    @orchestra.add_lock user
    @orchestra.remove_lock user
  end
end