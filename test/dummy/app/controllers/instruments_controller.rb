class InstrumentsController < ApplicationController
  def self.add_test_headers insta
    insta.pre do |controller_dsl, controller|
      controller.response.headers[:pre_invoked] = true
    end
    insta.post do |controller_dsl, controller|
      controller.response.headers[:post_invoked] = true
    end
    insta.format do |format|
      format.html do |controller_dsl, controller, outcome|
        controller.response.headers[:format_invoked] = true
        controller.render :text => 'howdy'
      end
    end
  end

  insta_index Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_list'

  end
  insta_show Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_show'
  end
  insta_new Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_form'
  end
  insta_edit Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_form'
  end
  insta_post Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_form'
  end
  insta_put Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_form'
  end
  insta_delete Instrument do |insta|
    InstrumentsController.add_test_headers insta
    insta.template = 'instrument_form'
  end
  
end
