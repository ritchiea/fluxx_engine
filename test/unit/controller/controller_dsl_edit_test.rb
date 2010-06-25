require 'test_helper'

class ControllerDslEditTest < ActiveSupport::TestCase
  def setup
  end

  test "check that we can load a new model" do
    @dsl_edit = ActionController::ControllerDslEdit.new Musician
    @musician = Musician.make
    edited_musician = @dsl_edit.perform_edit({:id => @musician.id})
    assert edited_musician
    assert edited_musician.is_a? Musician
  end
  
  test "check that we can load a model that's already loaded" do
    @dsl_edit = ActionController::ControllerDslEdit.new Musician
    @musician = Musician.make
    edited_musician = @dsl_edit.perform_edit({:id => nil}, @musician)
    assert_equal @musician, edited_musician
  end
  
  test "check that we can lock a record" do
    @dsl_edit = ActionController::ControllerDslEdit.new Instrument
    @instrument = Instrument.make
    fluxx_user = Musician.make
    edited_instrument = @dsl_edit.perform_edit({:id => nil}, @instrument, fluxx_user)
    assert_equal @instrument, edited_instrument
    assert edited_instrument.locked_until
    assert edited_instrument.locked_by_id
  end
  
  # TODO ESH: should be moved to active record or someplace more appropriate
  test "check that we can set lock_time_interval" do
    ActionController::ControllerDsl.lock_time_interval = 1.hour
    assert_equal 1.hour, ActionController::ControllerDsl.lock_time_interval
  end
end