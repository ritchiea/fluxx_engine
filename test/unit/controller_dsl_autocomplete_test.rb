require 'test_helper'

class ControllerDslAutocompleteTest < ActiveSupport::TestCase
  def setup
    @dsl_autocomplete = ActionController::ControllerDslAutocomplete.new Musician
    @musicians = (1..9).map {Musician.make}
  end

  test "check that we can run the autocomplete" do
    autocomplete_json = @dsl_autocomplete.process_autocomplete({:q => ''})
    assert autocomplete_json
    json_array = autocomplete_json.de_json
    assert_equal @musicians.size, json_array.size
    
    json_array.each_with_index do |element, i|
      assert_equal @musicians[i].id, element['id']
    end
  end

  test "check that we can autocomplete with a search query" do
    autocomplete_json = @dsl_autocomplete.process_autocomplete({:q => @musicians[0].first_name})
    json_array = autocomplete_json.de_json
    assert_equal 1, json_array.size
    assert_equal @musicians[0].id, json_array[0]['id']
  end
  
  test "check that we can autocomplete with results_per_page" do
    @dsl_autocomplete.results_per_page = 2
    autocomplete_json = @dsl_autocomplete.process_autocomplete({:q => ''})
    json_array = autocomplete_json.de_json
    assert_equal 2, json_array.size
  end

  test "check that we can autocomplete with search_conditions" do
    @dsl_autocomplete.search_conditions = "id = #{@musicians[0].id}"
    autocomplete_json = @dsl_autocomplete.process_autocomplete({:q => ''})
    json_array = autocomplete_json.de_json
    assert_equal 1, json_array.size
    assert_equal @musicians[0].id, json_array[0]['id']
  end
  
  test "check that we can order the autocomplete results" do
    @dsl_autocomplete.order_clause = "id desc"
    autocomplete_json = @dsl_autocomplete.process_autocomplete({:q => ''})
    assert autocomplete_json
    json_array = autocomplete_json.de_json
    assert_equal @musicians.size, json_array.size
    assert_equal @musicians.last.id, json_array[0]['id']
  end
  
  test "check that we can execute the post process autocomplete block" do
    @dsl_autocomplete.postprocess_block = (lambda do |models|
      assert_equal @musicians.size, models.size
      'postprocessed'
    end)
    
    autocomplete_reply = @dsl_autocomplete.process_autocomplete({:q => ''})
    assert autocomplete_reply
    assert_equal 'postprocessed', autocomplete_reply
  end

end