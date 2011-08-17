class ActiveRecord::ModelDslFilterAmount < ActiveRecord::ModelDsl
  # List of attributes that should use amount
  attr_accessor :amount_attributes
  
  def self.filter_amount new_amount
    if new_amount.is_a? String
      new_amount.gsub(CurrencyHelper.current_symbol, "").gsub(",","")
    else
      new_amount
    end
  end

  # Filter out dollar or other signs
  def add_amount_attributes
    if amount_attributes
      amount_attributes.each do |name|
        model_class.send :define_method, "#{name}=" do |new_amount|
          write_attribute(name, ActiveRecord::ModelDslFilterAmount.filter_amount(new_amount))
        end
      end
    end
  end
end