require 'test_helper'

class SphinxChecksControllerTest < ActionController::TestCase

  def setup
    @user1 = User.make
    login_as @user1
    @sphinx_check = SphinxCheck.make
  end
  
  test "should create sphinx_check" do
    assert_difference('SphinxCheck.count') do
      post :create, :sphinx_check => { :check_ts => 25532 }
    end

    assert 201, @response.status
    assert @response.header["Location"] =~ /#{sphinx_check_path(assigns(:sphinx_check))}$/
  end

  test "should show sphinx_check" do
    get :show, :id => @sphinx_check.to_param
    assert_response :success
  end

  test "should update sphinx_check" do
    put :update, :id => @sphinx_check.to_param, :sphinx_check => {}
    assert flash[:info]
    
    assert 201, @response.status
    assert @response.header["Location"] =~ /#{sphinx_check_path(assigns(:sphinx_check))}$/
  end
end
