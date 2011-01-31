class CurrencyHelper
  CURRENCY_MAPPER_FROM_SIGN = {
    '$' => [:short_name => 'USD', :long_name => 'Dollar'], 
    '€' => [:short_name => 'EUR', :long_name => 'Euro'],
    '£' => [:short_name => 'GBP', :long_name => 'Pound'],
  }
  def self.translate_symbol_to_name currency_symbol
    CURRENCY_MAPPER_FROM_SIGN[currency_symbol]
  end
  def self.translate_symbol_to_long_name currency_symbol
    currency = CURRENCY_MAPPER_FROM_SIGN[currency_symbol]
    currency ? currency[:long_name] : nil
  end
  def self.translate_symbol_to_short_name currency_symbol
    currency = CURRENCY_MAPPER_FROM_SIGN[currency_symbol]
    currency ? currency[:short_name] : nil
  end
end