require 'test_helper'

class ControllerDslIndexTest < ActiveSupport::TestCase
  def setup
    @dsl_index = ActionController::ControllerDslIndex.new Musician
    @musicians = (1..9).map {Musician.make}
  end

  test "check that we can run the index" do
    index_results = @dsl_index.load_results({:q => ''})
    assert index_results
    assert_equal @musicians.size, index_results.size
    
    index_results.each_with_index do |element, i|
      assert_equal @musicians[i].id, element['id']
    end
  end
  
  test "check that we can index with a search query" do
    index_results = @dsl_index.load_results({:q => @musicians[0].first_name})
    assert_equal 1, index_results.size
    assert_equal @musicians[0].id, index_results[0]['id']
  end
  
  test "check that we can index with results_per_page" do
    @dsl_index.results_per_page = 2
    index_results = @dsl_index.load_results({:q => ''})
    assert_equal 2, index_results.size
  end

  test "check that we can index with search_conditions" do
    @dsl_index.search_conditions = "id = #{@musicians[0].id}"
    index_results = @dsl_index.load_results({:q => ''})
    assert_equal 1, index_results.size
    assert_equal @musicians[0].id, index_results[0]['id']
  end
  
  test "check that we can order the index results" do
    @dsl_index.order_clause = "id desc"
    index_results = @dsl_index.load_results({:q => ''})
    assert index_results
    assert_equal @musicians.size, index_results.size
    assert_equal @musicians.last.id, index_results[0]['id']
  end
  
  test "check that we can request csv" do
    index_results = @dsl_index.load_results({:q => ''}, SimpleFormat.new(true))
    assert index_results
    assert_equal @musicians.size, index_results.size
  end
  
  test "check that we can request xls" do
    index_results = @dsl_index.load_results({:q => ''}, SimpleFormat.new(false, true))
    assert index_results
    assert_equal @musicians.size, index_results.size
  end
  
  # TODO ESH: should be moved to active record or someplace more appropriate
  test "check that we can set max_sphinx_results" do
    ActionController::ControllerDslIndex.max_sphinx_results = 1000
    assert_equal 1000, ActionController::ControllerDslIndex.max_sphinx_results
  end
end