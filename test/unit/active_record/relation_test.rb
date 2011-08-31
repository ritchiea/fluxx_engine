require 'test_helper'

class RelationTest < ActiveSupport::TestCase
  def setup
    @amount_array = [56, 25, 41, 99, 92, 4, 55, 15, 21, 10, 51, 2, 23, 51]
    @silly_amounts = @amount_array.map {|amt| SillyAmount.create :amount => amt}
  end
  
  test "check that we can get top values" do
    hash, other = SillyAmount.group(:id).select('id, sum(amount) amount').select_top_by_key 'id', 'amount', 5

    actual_top_amounts = @amount_array.sort.reverse[0..4]
    calculated_top_amounts = hash.values.map{|amt| amt.to_i}.sort.reverse
    assert_equal actual_top_amounts, calculated_top_amounts
    other_amounts = @amount_array.sort.reverse[5..@amount_array.size]
    assert_equal other_amounts.sum, other.to_i
  end
  
  test "check that we can top values respects the limit" do
    hash, other = SillyAmount.group(:id).select('id, sum(amount) amount').select_top_by_key 'id', 'amount', @amount_array.size+5
    
    assert !other
    assert @amount_array.sum, hash.values.map(&:to_i).sum
  end
end
