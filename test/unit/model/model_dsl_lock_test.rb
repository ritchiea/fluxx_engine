require 'test_helper'

class ModelDslRealtimeTest < ActiveSupport::TestCase
  def setup
  end
  
  test "check that we can set lock_time_interval" do
    ActiveRecord::ModelDslLock.lock_time_interval = 1.hour
    assert_equal 1.hour, ActiveRecord::ModelDslLock.lock_time_interval
  end
end