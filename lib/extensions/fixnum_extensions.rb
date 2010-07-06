require 'rubygems'
require 'action_view'

class Fixnum
  def to_currency(options = {})
    ActionView::Base.new.number_to_currency(self, options)
  end

  def to_currency_no_cents(options = {})
    options[:precision] = options[:precision] || 0
    ActionView::Base.new.number_to_currency(self, options)
  end
end
