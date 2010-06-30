# This file is auto-generated from the current state of the database. Instead of editing this file, 
# please use the migrations feature of Active Record to incrementally modify your database, and
# then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your database schema. If you need
# to create the application database on another system, you should be using db:schema:load, not running
# all the migrations from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20100630001545) do

  create_table "instruments", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name"
    t.date     "date_of_birth"
    t.date     "deleted_at"
    t.integer  "created_by_id"
    t.integer  "modified_by_id"
    t.date     "locked_until"
    t.integer  "locked_by_id"
  end

  create_table "multi_element_choices", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "target_id",              :limit => 12, :null => false
    t.integer  "multi_element_value_id", :limit => 12, :null => false
  end

  add_index "multi_element_choices", ["target_id", "multi_element_value_id"], :name => "multi_element_choices_index_cl_attr_val", :unique => true

  create_table "multi_element_groups", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "target_class_name", :null => false
    t.string   "name"
    t.string   "description"
  end

  create_table "multi_element_values", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "description"
    t.string   "value"
    t.integer  "multi_element_group_id", :limit => 12
  end

  add_index "multi_element_values", ["multi_element_group_id"], :name => "index_multi_element_values_on_multi_element_group_id"

  create_table "musician_instruments", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "musician_id"
    t.integer  "instrument_id"
  end

  create_table "musicians", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "first_name"
    t.string   "last_name"
    t.integer  "music_type_id"
    t.string   "street_address"
    t.string   "city"
    t.string   "state"
    t.string   "zip"
    t.date     "date_of_birth"
  end

  create_table "realtime_updates", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "action",                         :null => false
    t.integer  "user_id",          :limit => 12
    t.integer  "model_id",         :limit => 12, :null => false
    t.string   "type_name",                      :null => false
    t.string   "model_class",                    :null => false
    t.text     "delta_attributes",               :null => false
  end

end
