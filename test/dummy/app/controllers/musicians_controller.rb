class MusiciansController < ApplicationController
  insta_index Musician, :template => 'musician_list'
  insta_show Musician, :template => 'musician_show'
  insta_new Musician, :template => 'musician_form'
  insta_edit Musician, :template => 'musician_form'
  insta_post Musician, :template => 'musician_form'
  insta_put Musician, :template => 'musician_form'
  insta_delete Musician
end
