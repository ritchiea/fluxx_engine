require 'test_helper'

class MusiciansControllerTest < ActionController::TestCase
  setup do
    @musician = Musician.make
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:musicians)
  end
  
  test "should get default CSV index" do
    musicians = (1..9).map {Musician.make}
    musicians << @musician
    get :index, :format => 'csv'
    assert_response :success
    assert_not_nil assigns(:musicians)
    rows = @response.body.split "\n"
    assert_equal (musicians.size + 1), rows.size # make sure we have the same number of rows in csv + an extra one for the header
    musicians.each do |musician|
      assert (@response.body =~ /#{musician.id.to_s}/)
    end
  end
  
  test "should get default XLS index" do
    musicians = (1..9).map {Musician.make}
    musicians << @musician
    get :index, :format => 'xls'
    assert_response :success
    assert_not_nil assigns(:musicians)
    rows = @response.body.split "<Row>"
    assert_equal (musicians.size + 2), rows.size # make sure we have the same number of rows in csv + an extra one for the header and the markup that comes before the first row
    musicians.each do |musician|
      assert (@response.body =~ /#{musician.id.to_s}/)
    end
  end
  
  test "should get autocomplete without condition" do
    get :auto_complete
    assert_response :success
    assert @response.body
    musicians = @response.body.de_json
    assert_equal 1, musicians.size
    assert_equal @musician.to_s, musicians.first['name']
    assert_equal @musician.id, musicians.first['id']
  end
  

  test "should get autocomplete with condition" do
    musicians = (1..9).map {Musician.make}
    last_musician = musicians.last
    get :auto_complete, :q => last_musician.first_name
    assert_response :success
    assert @response.body
    musicians = @response.body.de_json
    assert_equal 1, musicians.size
    assert_equal last_musician.to_s, musicians.first['name']
    assert_equal last_musician.id, musicians.first['id']
  end
  
  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create musician" do
    assert_difference('Musician.count') do
      post :create, :musician => @musician.attributes
    end
  end

  test "should show musician" do
    get :show, :id => @musician.to_param
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id => @musician.to_param
    assert_response :success
  end

  test "should update musician" do
    put :update, :id => @musician.to_param, :musician => @musician.attributes
  end

  test "should destroy musician" do
    assert_difference('Musician.count', -1) do
      delete :destroy, :id => @musician.to_param
    end
  end
end