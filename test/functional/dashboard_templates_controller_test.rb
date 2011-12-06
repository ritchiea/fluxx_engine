require 'test_helper'

class DashboardTemplatesControllerTest < ActionController::TestCase

  def setup
    @user1 = User.make
    login_as @user1
    @dashboard_template = DashboardTemplate.make
  end
  
  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:dashboard_templates)
  end
  
  test "should get CSV index" do
    get :index, :format => 'csv'
    assert_response :success
    assert_not_nil assigns(:dashboard_templates)
  end
  
  test "autocomplete" do
    lookup_instance = DashboardTemplate.make
    get :index, :name => lookup_instance.name, :format => :autocomplete
    a = @response.body.de_json # try to deserialize the JSON to an array
    assert a.map{|elem| elem['value']}.include?(lookup_instance.id)
  end

  test "should confirm that name_exists" do
    get :index, :name => @dashboard_template.name, :format => :autocomplete
    a = @response.body.de_json # try to deserialize the JSON to an array
    assert a.map{|elem| elem['value']}.include?(@dashboard_template.id)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create dashboard_template" do
    assert_difference('DashboardTemplate.count') do
      post :create, :dashboard_template => { :name => 'some random name for you' }
    end

    assert 201, @response.status
    assert @response.header["Location"] =~ /#{dashboard_template_path(assigns(:dashboard_template))}$/
  end

  test "should show dashboard_template" do
    get :show, :id => @dashboard_template.to_param
    assert_response :success
  end

  test "should show dashboard_template with documents" do
    model_doc1 = ModelDocument.make(:documentable => @dashboard_template)
    model_doc2 = ModelDocument.make(:documentable => @dashboard_template)
    get :show, :id => @dashboard_template.to_param
    assert_response :success
  end
  
  test "should show dashboard_template with groups" do
    group = Group.make
    group_member1 = GroupMember.make :groupable => @dashboard_template, :group => group
    group_member2 = GroupMember.make :groupable => @dashboard_template, :group => group
    get :show, :id => @dashboard_template.to_param
    assert_response :success
  end
  
  test "should show dashboard_template with audits" do
    Audit.make :auditable_id => @dashboard_template.to_param, :auditable_type => @dashboard_template.class.name
    get :show, :id => @dashboard_template.to_param
    assert_response :success
  end
  
  test "should show dashboard_template audit" do
    get :show, :id => @dashboard_template.to_param, :audit_id => @dashboard_template.audits.first.to_param
    assert_response :success
  end
  
  test "should get edit" do
    get :edit, :id => @dashboard_template.to_param
    assert_response :success
  end

  test "should not be allowed to edit if somebody else is editing" do
    @dashboard_template.update_attributes :locked_until => (Time.now + 5.minutes), :locked_by_id => User.make.id
    get :edit, :id => @dashboard_template.to_param
    assert assigns(:not_editable)
  end

  test "should not be allowed to update if somebody else is editing" do
    @dashboard_template.update_attributes :locked_until => (Time.now + 5.minutes), :locked_by_id => User.make.id
    put :update, :id => @dashboard_template.to_param, :dashboard_template => {}
    assert assigns(:not_editable)
  end

  test "should update dashboard_template" do
    put :update, :id => @dashboard_template.to_param, :dashboard_template => {}
    assert flash[:info]
    
    assert 201, @response.status
    assert @response.header["Location"] =~ /#{dashboard_template_path(assigns(:dashboard_template))}$/
  end

  test "should destroy dashboard_template" do
    delete :destroy, :id => @dashboard_template.to_param
    assert_not_nil @dashboard_template.reload().deleted_at 
  end
end
