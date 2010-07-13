require 'test_helper'

class InstrumentsControllerTest < ActionController::TestCase
  setup do
    @instrument = Instrument.make
    setup_multi
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:instruments)
  end

  test "should get index check on pre and post and format" do
    get :index
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end

  test "should get index with pagination" do
    musicians = (1..51).map {Instrument.make}
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
  test "should get new check on pre and post" do
    get :new
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end

  test "should create instrument" do
    assert_difference('Instrument.count') do
      post :create, :instrument => @instrument.attributes
    end
  end
  test "should create check on pre and post" do
    post :create, :instrument => @instrument.attributes
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end

  test "should show instrument" do
    get :show, :id => @instrument.to_param
    assert_response :success
  end
  test "should get show check on pre and post" do
    get :show, :id => @instrument.to_param
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end

  test "should get edit" do
    get :edit, :id => @instrument.to_param
    assert_response :success
  end
  test "should get edit check on pre and post" do
    get :edit, :id => @instrument.to_param
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end

  test "should update instrument" do
    put :update, :id => @instrument.to_param, :instrument => @instrument.attributes
  end
  test "should get update check on pre and post" do
    put :update, :id => @instrument.to_param, :instrument => @instrument.attributes
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end

  test "should not be able to update a locked instrument" do
    local_current_user = Musician.make
    ActionController::Base.send :define_method, :fluxx_current_user do
      local_current_user
    end
    
    locking_musician = Musician.make
    @instrument.update_attributes :locked_by => locking_musician, :locked_until => (Time.now + 5.minutes)
    new_name = @instrument.name + "_new"
    put :update, :id => @instrument.to_param, :instrument => {:name => new_name}
    assert @instrument.reload.name != new_name
  end

  test "should destroy instrument" do
    assert_difference('Instrument.count', 0) do
      delete :destroy, :id => @instrument.to_param
    end
    
    assert @instrument.reload.deleted_at
  end
  test "should get destroy check on pre and post" do
    delete :destroy, :id => @instrument.to_param
    assert response.headers[:pre_invoked]
    assert response.headers[:post_invoked]
    assert response.headers[:format_invoked]
  end
end