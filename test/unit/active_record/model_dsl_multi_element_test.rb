require 'test_helper'

class ModelDslMultiElementTest < ActiveSupport::TestCase
  def setup
    @instrument_group = MultiElementGroup.make :target_class_name => 'Instrument', :name => 'categories', :description => 'categories'
    @woodwind_value = MultiElementValue.make :description => 'woodwind', :value => 'woodwind', :multi_element_group => @instrument_group
    @brass_value = MultiElementValue.make :description => 'brass', :value => 'brass', :multi_element_group => @instrument_group
    @percussion_value = MultiElementValue.make :description => 'percussion', :value => 'percussion', :multi_element_group => @instrument_group
    @string_value = MultiElementValue.make :description => 'string', :value => 'string', :multi_element_group => @instrument_group
    
    
    @music_type_group = MultiElementGroup.make :target_class_name => 'Musician', :name => 'music_type', :description => 'music type'
    @blues_value = MultiElementValue.make :description => 'blues', :value => 'blues', :multi_element_group => @music_type_group
    @jazz_value = MultiElementValue.make :description => 'jazz', :value => 'jazz', :multi_element_group => @music_type_group
    @folk_value = MultiElementValue.make :description => 'folk', :value => 'blues', :multi_element_group => @music_type_group
    @opera_value = MultiElementValue.make :description => 'opera', :value => 'opera', :multi_element_group => @music_type_group
  end
  
  test "test ability to add multi element to a class" do
    dsl_multi = ActiveRecord::ModelDslMultiElement.new Instrument
    dsl_multi.add_multi_elements
    test_instrument = Instrument.make
    assert test_instrument.respond_to?(:categories)
    assert test_instrument.respond_to?('choices_categories'.to_sym)
  end

  test "test ability to add single element to a class" do
    dsl_multi = ActiveRecord::ModelDslMultiElement.new Musician
    dsl_multi.add_multi_elements
    test_musician = Musician.make
    assert test_musician.respond_to?(:music_type_id)
    assert test_musician.respond_to?(:music_type)
  end

end