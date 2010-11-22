require 'test_helper'

class ModelDslTemplateTest < ActiveSupport::TestCase
  def setup
  end
  
  test "test ability to add multi element to a class" do
    
    
    # TODO ESH:
    #  In the DSL, we need an iterator that expects the result of a method to be a list.
    #  What if we have a way to declare other variables as well:
    #    {{declare variable='musician' method='first_instrument' new_variable='musicians_first_instrument'}}
    # That would add a binding for as a context object to allow users to reference objects within a related object
    # The other way to do it would be to have some kind of dot notation that we use to dereference a method
    # that is available as the result of another method call
    
    template = "
    <html>
      <body>
        How are you {{value variable='musician' method='first_name'/}}?
        So your first instrument was {{value variable='musician' method='first_instrument.name'/}}, I like to play that too!
        I see that your name backwards is {{value variable='musician' method='first_name_backwards'/}}.
        <table>
        <tr>
          <td>name</td>
          <td>date_of_birth</td>
        </tr>
        {{iterator method='instruments' new_variable='instrument' variable='musician'}}
          <tr>
            <td>{{value variable='instrument' method='name'/}}</td>
            <td>{{value variable='instrument' method='date_of_birth'/}}</td>
          </tr>
        {{/iterator}}
      
      </body>
      </html>
    "
    
    first_instrument = Instrument.make
    musician = Musician.make :first_instrument => first_instrument
    (1..4).to_a.each do |i|
      instrument = Instrument.make
      MusicianInstrument.make :instrument => instrument, :musician => musician
    end
    musician.reload
    
    result = musician.process_curly_template template
    p "ESH: result=#{result}"
    assert result.index "So your first instrument was #{first_instrument.name}"
    assert result.index "I see that your name backwards is #{musician.first_name_backwards}"
    musician.instruments.each do |instrument|
      assert result.index "<td>#{instrument.name}</td>"
      assert result.index "<td>#{instrument.date_of_birth}</td>"
    end
  end

  # t.string :first_name
  # t.string :last_name
  # t.integer :music_type_id
  # t.string :street_address
  # t.string :city
  # t.string :state
  # t.string :zip
  # t.datetime :date_of_birth
end