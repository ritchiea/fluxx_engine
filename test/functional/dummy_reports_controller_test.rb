require 'test_helper'

class DummyReportsControllerTest < ActionController::TestCase
  setup do
    @user = User.make
    login_as @user
  end
  
  test "should get show with dummy reports plot" do
    controller = DummyReportsController.new
    reports = controller.insta_show_report_list
    dummy_rep = reports.select{|rep| rep.is_a? TotalDummyReport}.first
    get :show, :id => dummy_rep.report_id
    assert @response.body =~ /visualizations/
    assert @response.body =~ /#{dummy_rep.report_label}/
  end
  
  test "should get show with dummy reports filter" do
    controller = DummyReportsController.new
    reports = controller.insta_show_report_list
    dummy_rep = reports.select{|rep| rep.is_a? TotalDummyReport}.first
    get :show, :id => dummy_rep.report_id, :fluxxreport_filter => 1
    p "ESH: have a body of #{@response.body}"
  end
  
end