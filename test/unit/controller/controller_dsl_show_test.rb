require 'test_helper'

class ControllerDslShowTest < ActiveSupport::TestCase
  def setup
  end

  test "check that we can perform_show" do
    @dsl_show = ActionController::ControllerDslShow.new Musician
    @musician = Musician.make
    new_musician = @dsl_show.perform_show({:id => @musician.id})
    assert new_musician
    assert new_musician.is_a? Musician
  end
end