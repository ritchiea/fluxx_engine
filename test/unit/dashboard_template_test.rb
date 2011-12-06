require 'test_helper'

class DashboardTemplateTest < ActiveSupport::TestCase
  def setup
    @dashboard_template = DashboardTemplate.make
  end
  
  test "truth" do
    assert true
  end
end