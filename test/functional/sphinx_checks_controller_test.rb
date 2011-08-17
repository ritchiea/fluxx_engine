require 'test_helper'

class SphinxChecksControllerTest < ActionController::TestCase

  def setup
    @user1 = User.make
    login_as @user1
    @sphinx_check = SphinxCheck.make
  end
  
  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:sphinx_checks)
  end
  
  test "should get CSV index" do
    get :index, :format => 'csv'
    assert_response :success
    assert_not_nil assigns(:sphinx_checks)
  end
  
  test "autocomplete" do
    lookup_instance = SphinxCheck.make
    get :index, :name => lookup_instance.name, :format => :autocomplete
    a = @response.body.de_json # try to deserialize the JSON to an array
    assert a.map{|elem| elem['value']}.include?(lookup_instance.id)
  end

  test "should confirm that name_exists" do
    get :index, :name => @sphinx_check.name, :format => :autocomplete
    a = @response.body.de_json # try to deserialize the JSON to an array
    assert a.map{|elem| elem['value']}.include?(@sphinx_check.id)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create sphinx_check" do
    assert_difference('SphinxCheck.count') do
      post :create, :sphinx_check => { :name => 'some random name for you' }
    end

    assert 201, @response.status
    assert @response.header["Location"] =~ /#{sphinx_check_path(assigns(:sphinx_check))}$/
  end

  test "should show sphinx_check" do
    get :show, :id => @sphinx_check.to_param
    assert_response :success
  end

  test "should show sphinx_check with documents" do
    model_doc1 = ModelDocument.make(:documentable => @sphinx_check)
    model_doc2 = ModelDocument.make(:documentable => @sphinx_check)
    get :show, :id => @sphinx_check.to_param
    assert_response :success
  end
  
  test "should show sphinx_check with groups" do
    group = Group.make
    group_member1 = GroupMember.make :groupable => @sphinx_check, :group => group
    group_member2 = GroupMember.make :groupable => @sphinx_check, :group => group
    get :show, :id => @sphinx_check.to_param
    assert_response :success
  end
  
  test "should show sphinx_check with audits" do
    Audit.make :auditable_id => @sphinx_check.to_param, :auditable_type => @sphinx_check.class.name
    get :show, :id => @sphinx_check.to_param
    assert_response :success
  end
  
  test "should show sphinx_check audit" do
    get :show, :id => @sphinx_check.to_param, :audit_id => @sphinx_check.audits.first.to_param
    assert_response :success
  end
  
  test "should get edit" do
    get :edit, :id => @sphinx_check.to_param
    assert_response :success
  end

  test "should not be allowed to edit if somebody else is editing" do
    @sphinx_check.update_attributes :locked_until => (Time.now + 5.minutes), :locked_by_id => User.make.id
    get :edit, :id => @sphinx_check.to_param
    assert assigns(:not_editable)
  end

  test "should not be allowed to update if somebody else is editing" do
    @sphinx_check.update_attributes :locked_until => (Time.now + 5.minutes), :locked_by_id => User.make.id
    put :update, :id => @sphinx_check.to_param, :sphinx_check => {}
    assert assigns(:not_editable)
  end

  test "should update sphinx_check" do
    put :update, :id => @sphinx_check.to_param, :sphinx_check => {}
    assert flash[:info]
    
    assert 201, @response.status
    assert @response.header["Location"] =~ /#{sphinx_check_path(assigns(:sphinx_check))}$/
  end

  test "should destroy sphinx_check" do
    delete :destroy, :id => @sphinx_check.to_param
    assert_not_nil @sphinx_check.reload().deleted_at 
  end
end
