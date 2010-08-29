require 'test_helper'

class ClientStoresControllerTest < ActionController::TestCase
  setup do
    @user = User.make
    @controller.current_user = @user
    @client_store = ClientStore.make :user_id => @user.id
  end

  test "should get index" do
    get :index, :format => :json
    assert_response :success
    assert_not_nil assigns(:client_stores)
    assert_equal 1, assigns(:client_stores).size
  end

  test "search for client stores by name" do
    dashboard_name = 'front_end_dashboard'
    @named_client_store = ClientStore.make :name => dashboard_name, :user_id => @user.id
    get :index, :format => :json, :name => dashboard_name
    assert_response :success
    assert_not_nil assigns(:client_stores)
    assert_equal @named_client_store, assigns(:client_stores).first
    a = @response.body.de_json # try to deserialize the JSON to an array
    assert a.first
    assert a.first['client_store']
  end

  test "should create client store" do
    assert_difference('ClientStore.count') do
      post :create, :client_store => @client_store.attributes, :format => :json
    end
  end

  test "should update client_store" do
    put :update, :id => @client_store.to_param, :client_store => @client_store.attributes, :format => :json
  end

  test "should destroy client_store" do
    assert_difference('ClientStore.count', 0) do
      delete :destroy, :id => @client_store.to_param, :format => :json
    end
    assert @client_store.reload.deleted_at
  end
end