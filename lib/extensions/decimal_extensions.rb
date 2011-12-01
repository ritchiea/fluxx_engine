class BigDecimal
  def to_currency(options = {})
    options[:precision] ||= 2
    ActionView::Base.new.number_to_currency(self, options)
  end
  def to_currency_no_cents(options = {})
    options[:precision] ||= 0
    ActionView::Base.new.number_to_currency(self, options)
  end
  
  def as_json(options = nil) 
    to_f
  end
  
end