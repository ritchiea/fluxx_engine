require 'test_helper'

class ClientStoresControllerTest < ActionController::TestCase
  setup do
    @client_store = ClientStore.make
  end

  test "should get index" do
    get :index, :format => :json
    assert_response :success
    assert_not_nil assigns(:client_stores)
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