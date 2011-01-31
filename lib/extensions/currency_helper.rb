class CurrencyHelper
  CURRENCY_MAPPER_FROM_SIGN = {
    '$' => [:short_name => 'USD', :long_name => 'Dollar'], 
    '€' => [:short_name => 'EUR', :long_name => 'Euro'],
    '£' => [:short_name => 'GBP', :long_name => 'Pound'],
  }
  def self.translate_symbol_to_name currency_symbol
    CURRENCY_MAPPER_FROM_SIGN[currency_symbol]
  end
end