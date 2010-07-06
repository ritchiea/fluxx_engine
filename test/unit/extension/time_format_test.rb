require 'test_helper'

class TimeFormatTest < ActiveSupport::TestCase
  def setup
  end

  test "try various time formats" do
    [:msoft, :sql, :ampm_time, :mdy_time, :mdy, :full, :date_time_seconds, :date_time, :next_business_day, :previous_business_day].each do |format_sym|
      time_flavor = Time.now.send format_sym
      assert time_flavor
      assert String, time_flavor.class
    end
  end
  
  test "try skip weekends time format" do
    time_flavor = Time.now.skip_weekends 10
    assert time_flavor
    assert String, time_flavor.class
  end
end