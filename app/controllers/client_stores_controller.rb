class ClientStoresController < ApplicationController
  insta_index ClientStore do |insta|
    insta.template = 'instrument_list'
  end
  insta_post ClientStore do |insta|
    insta.template = 'instrument_form'
  end
  insta_put ClientStore do |insta|
    insta.template = 'instrument_form'
  end
  insta_delete ClientStore do |insta|
    insta.template = 'instrument_form'
  end
end