class MusiciansController < ApplicationController
  insta_auto_complete Musician do |insta|
  end
  insta_index Musician do |insta|
    insta.template = 'musician_list'
  end
  insta_show Musician do |insta|
    insta.template = 'musician_show'
  end
  insta_new Musician do |insta|
    insta.template = 'musician_form'
  end
  insta_edit Musician do |insta|
    insta.template = 'musician_form'
  end
  insta_post Musician do |insta|
    insta.template = 'musician_form'
  end
  insta_put Musician do |insta|
    insta.template = 'musician_form'
  end
  insta_delete Musician do |insta|
    insta.template = 'musician_form'
  end
end
