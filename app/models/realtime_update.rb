class RealtimeUpdate < ActiveRecord::Base
  def model
    model_class.constantize.find(model_id)
  end
end
