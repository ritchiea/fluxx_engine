class RealtimeUpdate < ActiveRecord::Base
  def self.delimiter
    "|~|"
  end
end
