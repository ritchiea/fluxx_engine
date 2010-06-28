require 'test_helper'

class ControllerDslRelatedTest < ActiveSupport::TestCase
  def setup
    @dsl_related = ActionController::ControllerDslRelated.new Musician
  end

  test "test add_related ordering" do
    @dsl_related.add_related do |insta|
      insta.display_name = 'Instrument 1'
      insta.related_class = Instrument
      insta.search_id = :instruments
      insta.extra_condition = nil
      insta.max_results = 20
      insta.order = 'name asc'
      insta.display_template = 'template'
    end
    @dsl_related.add_related do |insta|
      insta.display_name = 'Instrument 2'
      insta.related_class = Instrument
      insta.search_id = :instruments
      insta.extra_condition = nil
      insta.max_results = 20
      insta.order = 'name asc'
      insta.display_template = 'template'
    end
    
    assert_equal 2, @dsl_related.relations.size
    assert_equal 'Instrument 1', @dsl_related.relations[0].display_name
    assert_equal 'Instrument 2', @dsl_related.relations[1].display_name
  end
  
  test "test adding blocks of relations" do
    model = Musician.make
    @dsl_related.add_related_block do |block_insta, model|
      block_insta.display_name = "Musician 1"
      block_insta.related_class = Musician
      block_insta.search_id = :musicians
      block_insta.extra_condition = nil
      block_insta.max_results = 20
      block_insta.order = 'last_name asc, first_name asc'
      block_insta.display_template = 'template'
    end
    @dsl_related.add_related_block do |block_insta, model|
      block_insta.display_name = "Musician 2"
      block_insta.related_class = Musician
      block_insta.search_id = :musicians
      block_insta.extra_condition = nil
      block_insta.max_results = 20
      block_insta.order = 'last_name asc, first_name asc'
      block_insta.display_template = 'template'
    end
    
    assert_equal 2, @dsl_related.block_relations.size
      
    rd = ActionController::ModelRelationship.new
    @dsl_related.block_relations[0].call rd, model
    assert_equal 'Musician 1', rd.display_name
    rd = ActionController::ModelRelationship.new
    @dsl_related.block_relations[1].call rd, model
    assert_equal 'Musician 2', rd.display_name
  end
  
  test "test calling load_related_data with a non-block" do
    musician = Musician.make
    5.times do
      instrument = Instrument.make
      musician.instruments << instrument
    end
    @dsl_related.add_related do |insta|
      insta.display_name = 'Instrument 1'
      insta.related_class = Instrument
      insta.search_id = :instruments
      insta.extra_condition = nil
      insta.order = 'name asc'
      insta.display_template = 'template'
    end
   
   related = @dsl_related.load_related_data musician 
   musician.instruments.each_with_index do |instrument, i|
     assert_equal instrument, related.first[:formatted_data][i][:model]
   end
  end
end