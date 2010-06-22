class InstrumentsController < ApplicationController
  insta_index Instrument do |insta|
    insta.template = 'instrument_list'
  end
  insta_show Instrument do |insta|
    insta.template = 'instrument_show'
  end
  insta_new Instrument do |insta|
    insta.template = 'instrument_form'
  end
  insta_edit Instrument do |insta|
    insta.template = 'instrument_form'
  end
  insta_post Instrument do |insta|
    insta.template = 'instrument_form'
  end
  insta_put Instrument do |insta|
    insta.template = 'instrument_form'
  end
  insta_delete Instrument do |insta|
    insta.template = 'instrument_form'
  end
end
