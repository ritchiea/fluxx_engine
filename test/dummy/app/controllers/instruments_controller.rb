class InstrumentsController < ApplicationController
  def self.add_test_headers insta
    insta.pre do |params, request, response|
      response.headers[:pre_invoked] = true
    end
    insta.post do |params, request, response|
      response.headers[:post_invoked] = true
    end
    insta.post do |params, request, response|
      response.headers[:post_invoked] = true
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
