require 'test_helper'

class InstrumentTest < ActiveSupport::TestCase
  def setup
    @instrument = Instrument.make
  end
  
  test "test Instrument search" do
    list = Instrument.model_search ''
  end
  
  test "test locking without sphinx" do
    p "ESH: in test locking without sphinx"
    user = Instrument.make
    @instrument.add_lock user
    @instrument.remove_lock user
  end
  
  test "test that an audit record is created upon save" do
    assert_difference('Audit.count') do
      Instrument.make
    end
    p "ESH: have an audit: #{Audit.find(:first).inspect}"
    p "ESH: have an audit full_model: #{Audit.find(:first).full_model}"
  end
end