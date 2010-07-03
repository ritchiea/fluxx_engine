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
end