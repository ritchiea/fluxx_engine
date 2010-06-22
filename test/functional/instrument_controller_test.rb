require 'test_helper'

class InstrumentsControllerTest < ActionController::TestCase
  setup do
    @instrument = Instrument.make
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:instruments)
  end
  
  test "should get default CSV index" do
    instruments = (1..9).map {Instrument.make}
    instruments << @instrument
    get :index, :format => 'csv'
    assert_response :success
    assert_not_nil assigns(:instruments)
    rows = @response.body.split "\n"
    assert_equal (instruments.size + 1), rows.size # make sure we have the same number of rows in csv + an extra one for the header
    instruments.each do |instrument|
      assert (@response.body =~ /#{instrument.id.to_s}/)
    end
  end
  
  test "should get default XLS index" do
    instruments = (1..9).map {Instrument.make}
    instruments << @instrument
    get :index, :format => 'xls'
    assert_response :success
    assert_not_nil assigns(:instruments)
    rows = @response.body.split "<Row>"
    assert_equal (instruments.size + 2), rows.size # make sure we have the same number of rows in csv + an extra one for the header and the markup that comes before the first row
    instruments.each do |instrument|
      assert (@response.body =~ /#{instrument.id.to_s}/)
    end
  end
  
  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create instrument" do
    assert_difference('Instrument.count') do
      post :create, :instrument => @instrument.attributes
    end
  end

  test "should show instrument" do
    get :show, :id => @instrument.to_param
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id => @instrument.to_param
    assert_response :success
  end

  test "should update instrument" do
    put :update, :id => @instrument.to_param, :instrument => @instrument.attributes
  end

  test "should destroy instrument" do
    assert_difference('Instrument.count', 0) do
      delete :destroy, :id => @instrument.to_param
    end
    
    assert @instrument.reload.deleted_at
  end
end